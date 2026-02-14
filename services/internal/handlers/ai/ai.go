package ai

import (
	"spark/internal/constants"
	hai "spark/internal/helpers/ai"
	"spark/internal/helpers/socketstate"
	"spark/internal/helpers/users"
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/MelloB1989/karma/ai"
	"github.com/MelloB1989/karma/models"
	"github.com/MelloB1989/karma/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func GetProfileSummary(c *fiber.Ctx) error {
	userId := c.Params("userId")
	if userId == "" {
		return fiber.ErrUnauthorized
	}
	queryUserId, ok := c.Locals("uid").(string)
	if !ok {
		return fiber.ErrUnauthorized
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("X-Accel-Buffering", "no")

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		kai := ai.NewKarmaAI(ai.Llama31_8B, ai.Groq, ai.WithMaxTokens(120), ai.WithSystemMessage(constants.AISummarizerSystemPrompt))

		callback := func(chunk models.StreamedResponse) error {
			data, err := json.Marshal(chunk)
			if err != nil {
				return err
			}

			_, err = fmt.Fprintf(w, "data: %s\n\n", string(data))
			if err != nil {
				return err
			}

			if err := w.Flush(); err != nil {
				return err
			}

			return nil
		}

		userDetails, err := users.GetUserPublicById(userId, queryUserId)
		if err != nil {
			w.Write([]byte(err.Error()))
		}
		ud, err := json.MarshalIndent(userDetails, "", "  ")
		if err != nil {
			log.Fatalf("Failed to marshal user details: %v", err)
		}
		currentUserDetails, err := users.GetUserPublicById(queryUserId)
		if err != nil {
			w.Write([]byte(err.Error()))
		}
		cud, err := json.MarshalIndent(currentUserDetails, "", "  ")
		if err != nil {
			log.Fatalf("Failed to marshal transcription result: %v", err)
		}
		msg := models.AIChatHistory{
			Messages: []models.AIMessage{
				{
					Role:    models.User,
					Message: "target user details: " + string(ud) + "\ncurrent user details: " + string(cud) + "\n Generate personalized profile summary of target user for the current user",
				},
			},
		}

		kai.ChatCompletionStream(msg, callback)
	})
	return nil
}

func GetAIBio(c *fiber.Ctx) error {
	queryUserId, ok := c.Locals("uid").(string)
	if !ok {
		return fiber.ErrUnauthorized
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("X-Accel-Buffering", "no")

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		kai := ai.NewKarmaAI(ai.Llama31_8B, ai.Groq, ai.WithMaxTokens(120), ai.WithSystemMessage(constants.AIBioGeneratorSystemPrompt))

		callback := func(chunk models.StreamedResponse) error {
			data, err := json.Marshal(chunk)
			if err != nil {
				return err
			}

			_, err = fmt.Fprintf(w, "data: %s\n\n", string(data))
			if err != nil {
				return err
			}

			if err := w.Flush(); err != nil {
				return err
			}

			return nil
		}

		currentUserDetails, err := users.GetUserPublicById(queryUserId)
		if err != nil {
			w.Write([]byte(err.Error()))
		}
		cud, err := json.MarshalIndent(currentUserDetails, "", "  ")
		if err != nil {
			log.Fatalf("Failed to marshal transcription result: %v", err)
		}
		msg := models.AIChatHistory{
			Messages: []models.AIMessage{
				{
					Role:    models.User,
					Message: "\ncurrent user details: " + string(cud) + "\n Generate a bio for the current user",
				},
			},
		}

		kai.ChatCompletionStream(msg, callback)
	})
	return nil
}

type incomingMessageTypes string

const (
	incomingChatCompletion  incomingMessageTypes = "chat_completion"
	incomingUpdateChatTitle incomingMessageTypes = "update_chat_title"
	incomingCreateNewChat   incomingMessageTypes = "create_new_chat"
	incomingProfileAbout    incomingMessageTypes = "profile_about"
	incomingGetChat         incomingMessageTypes = "get_chat"
	incomingGetChats        incomingMessageTypes = "get_chats"
	incomingOnlineStatus    incomingMessageTypes = "online_status"
	incomingAIRequest       incomingMessageTypes = "ai_request"
	incomingImageGeneration incomingMessageTypes = "image_generation" // For future use
)

type outgoingMessageType string

const (
	outgoingChatCompletionType outgoingMessageType = "chat_completion"
	outgoingCreateNewChat      outgoingMessageType = "create_new_chat"
	outgoingUpdateChatTitle    outgoingMessageType = "update_chat_title"
	outgoingError              outgoingMessageType = "error"
	outgoingGetChat            outgoingMessageType = "get_chat"
	outgoingGetChats           outgoingMessageType = "get_chats"
	outgoingOnlineStatus       outgoingMessageType = "online_status"
	outgoingAIRequest          outgoingMessageType = "ai_request"
	outgoingImageGeneration    outgoingMessageType = "image_generation" // For future use
)

const (
	writeWait      = 30 * time.Second
	pongWait       = 60 * time.Second
	pingInterval   = (pongWait * 9) / 10 // Send pings at 90% of pong wait time
	maxPingRetries = 3
)

func AIChatHandler(c *websocket.Conn) {
	uid, ok := c.Locals("uid").(string)
	if !ok {
		c.Close()
		return
	}

	// Thread-safe write function
	var writeMu sync.Mutex
	writeJSON := func(v any) error {
		writeMu.Lock()
		defer writeMu.Unlock()
		c.SetWriteDeadline(time.Now().Add(writeWait))
		err := c.WriteJSON(v)
		c.SetWriteDeadline(time.Time{}) // Clear deadline after write
		return err
	}

	// Message types
	var incoming struct {
		Message *string              `json:"message,omitempty"`
		Type    incomingMessageTypes `json:"type"`
		Id      *string              `json:"id,omitempty"`
		ChatId  *string              `json:"chatId,omitempty"`
		Media   []string             `json:"media,omitempty"`
		Data    json.RawMessage      `json:"data,omitempty"`
	}

	type outgoing struct {
		MessageChunk string              `json:"message"`
		Type         outgoingMessageType `json:"type"`
		Id           string              `json:"id"`
		Error        string              `json:"error,omitempty"`
		ChatId       *string             `json:"chatId,omitempty"`
		Data         any                 `json:"data,omitempty"`
	}

	getIncomingID := func() string {
		if incoming.Id != nil {
			return *incoming.Id
		}
		return ""
	}

	// Set up ping/pong handlers
	c.SetPongHandler(func(string) error {
		c.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	c.SetPingHandler(func(appData string) error {
		c.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Initialize AI service
	currentUserDetails, err := users.GetUserPublicById(uid)
	if err != nil {
		writeJSON(outgoing{
			Type:  outgoingError,
			Error: fmt.Sprintf("Failed to get user details: %v", err),
		})
		c.Close()
		return
	}

	cud, err := json.MarshalIndent(currentUserDetails, "", "  ")
	if err != nil {
		log.Printf("Failed to marshal user details: %v", err)
		c.Close()
		return
	}

	kai := ai.NewKarmaAI(
		ai.Grok4Fast,
		ai.XAI,
		ai.WithMaxTokens(420),
		ai.WithSystemMessage(constants.AIDatingAssistantSystemPrompt),
		ai.WithUserPrePrompt(fmt.Sprintf("Current user details are: %s", string(cud))),
	)

	// Graceful shutdown coordination
	done := make(chan struct{})
	defer close(done)

	// Goroutine 1: Send periodic pings to keep connection alive
	go func() {
		ticker := time.NewTicker(pingInterval)
		defer ticker.Stop()
		pingFailures := 0

		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				writeMu.Lock()
				c.SetWriteDeadline(time.Now().Add(writeWait))
				err := c.WriteMessage(websocket.PingMessage, nil)
				c.SetWriteDeadline(time.Time{})
				writeMu.Unlock()

				if err != nil {
					pingFailures++
					log.Printf("[AI Chat %s] ping failed (attempt %d/%d): %v", uid, pingFailures, maxPingRetries, err)
					if pingFailures >= maxPingRetries {
						log.Printf("[AI Chat %s] max ping failures reached, closing connection", uid)
						c.Close()
						return
					}
					continue
				}
				pingFailures = 0
			}
		}
	}()

	log.Printf("[AI Chat %s] Connection established, setting read deadline: %v", uid, pongWait)
	c.SetReadDeadline(time.Now().Add(pongWait))

	for {
		_, msgBytes, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[AI Chat %s] unexpected close: %v", uid, err)
			} else {
				log.Printf("[AI Chat %s] connection closed: %v", uid, err)
			}
			c.Close()
			return
		}

		c.SetReadDeadline(time.Now().Add(pongWait))

		if err := json.Unmarshal(msgBytes, &incoming); err != nil {
			writeJSON(outgoing{
				Type:  outgoingError,
				Error: fmt.Sprintf("Invalid JSON: %v", err.Error()),
				Id:    getIncomingID(),
			})
			continue
		}

		// Handle incoming messages
		switch incoming.Type {
		case incomingChatCompletion:
			if incoming.Message == nil || incoming.ChatId == nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "message and chatId are required",
					Id:    getIncomingID(),
				})
				continue
			}

			mid := *incoming.Message
			chatId := *incoming.ChatId
			if strings.TrimSpace(mid) == "" || strings.TrimSpace(chatId) == "" {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "message and chatId cannot be empty",
					Id:    getIncomingID(),
				})
				continue
			}

			oldMgs, err := hai.GetChatById(chatId, uid)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
					Id:    getIncomingID(),
				})
				continue
			}

			callback := func(chunk models.StreamedResponse) error {
				return writeJSON(outgoing{
					MessageChunk: chunk.AIResponse,
					Type:         outgoingChatCompletionType,
					Id:           getIncomingID(),
					ChatId:       incoming.ChatId,
				})
			}

			chatHistory := models.AIChatHistory{
				Messages: oldMgs.Messages,
				ChatId:   chatId,
			}
			chatHistory.Messages = append(chatHistory.Messages, models.AIMessage{
				UniqueId: strings.ToUpper(utils.GenerateID(10)),
				Message:  *incoming.Message,
				Role:     models.User,
			})

			resp, err := kai.ChatCompletionStream(chatHistory, callback)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
					Id:    getIncomingID(),
				})
				continue
			}

			if resp.AIResponse != "" {
				chatHistory.Messages = append(chatHistory.Messages, models.AIMessage{
					UniqueId: strings.ToUpper(utils.GenerateID(10)),
					Message:  resp.AIResponse,
					Role:     models.Assistant,
				})
				_, err = hai.UpdateChatMessages(chatId, uid, chatHistory.Messages)
				if err != nil {
					writeJSON(outgoing{
						Type:  outgoingError,
						Error: err.Error(),
						Id:    getIncomingID(),
					})
					continue
				}
			}

		case incomingUpdateChatTitle:
			if incoming.ChatId == nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "chatId is required",
					Id:    getIncomingID(),
				})
				continue
			}

			chatId := *incoming.ChatId
			if strings.TrimSpace(chatId) == "" {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "chatId cannot be empty",
					Id:    getIncomingID(),
				})
				continue
			}

			updatedChat, err := hai.UpdateChatTitle(chatId, uid)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
					Id:    getIncomingID(),
				})
				continue
			}

			writeJSON(outgoing{
				Type:   outgoingUpdateChatTitle,
				Id:     getIncomingID(),
				ChatId: incoming.ChatId,
				Data: map[string]any{
					"title": updatedChat.Title,
				},
			})

		case incomingCreateNewChat:
			chat, err := hai.CreateNewChat(uid)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
					Id:    getIncomingID(),
				})
				continue
			}

			writeJSON(outgoing{
				Type: outgoingCreateNewChat,
				Id:   getIncomingID(),
				Data: map[string]any{
					"chat": chat,
				},
			})

		case incomingProfileAbout:
			data := make(map[string]any)
			if err := json.Unmarshal(incoming.Data, &data); err != nil {
				log.Printf("failed to unmarshal profile data: %v", err)
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "invalid data format",
					Id:    getIncomingID(),
				})
				continue
			}

			if data["user_id"] == nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "user_id is required",
					Id:    getIncomingID(),
				})
				continue
			}

			if incoming.Message == nil || incoming.ChatId == nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "message and chatId are required",
					Id:    getIncomingID(),
				})
				continue
			}

			mid := *incoming.Message
			chatId := *incoming.ChatId
			if strings.TrimSpace(mid) == "" || strings.TrimSpace(chatId) == "" {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "message and chatId cannot be empty",
					Id:    getIncomingID(),
				})
				continue
			}

			oldMgs, err := hai.GetChatById(chatId, uid)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
					Id:    getIncomingID(),
				})
				continue
			}

			targetUserId, ok := data["user_id"].(string)
			if !ok {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "invalid user_id format",
					Id:    getIncomingID(),
				})
				continue
			}

			targetUserDetails, err := users.GetUserPublicById(targetUserId)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: fmt.Sprintf("Failed to get target user details: %v", err),
					Id:    getIncomingID(),
				})
				continue
			}

			tud, err := json.MarshalIndent(targetUserDetails, "", "  ")
			if err != nil {
				log.Printf("Failed to marshal target user details: %v", err)
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "Failed to process user details",
					Id:    getIncomingID(),
				})
				continue
			}

			// Create a modified AI instance for this specific request
			profileKai := ai.NewKarmaAI(
				ai.Llama31_8B,
				ai.Groq,
				ai.WithMaxTokens(420),
				ai.WithSystemMessage(constants.AIDatingAssistantSystemPrompt),
				ai.WithUserPrePrompt(fmt.Sprintf(
					"Current user details are: %s\n\nUser has asked suggestion on profile: %s\n",
					string(cud),
					string(tud),
				)),
			)

			callback := func(chunk models.StreamedResponse) error {
				return writeJSON(outgoing{
					MessageChunk: chunk.AIResponse,
					Type:         outgoingChatCompletionType,
					Id:           getIncomingID(),
					ChatId:       incoming.ChatId,
				})
			}

			chatHistory := models.AIChatHistory{
				Messages: oldMgs.Messages,
				ChatId:   chatId,
			}
			chatHistory.Messages = append(chatHistory.Messages, models.AIMessage{
				UniqueId: strings.ToUpper(utils.GenerateID(10)),
				Message:  *incoming.Message,
				Role:     models.User,
			})

			resp, err := profileKai.ChatCompletionStream(chatHistory, callback)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
					Id:    getIncomingID(),
				})
				continue
			}
			if resp.AIResponse != "" {
				chatHistory.Messages = append(chatHistory.Messages, models.AIMessage{
					UniqueId: strings.ToUpper(utils.GenerateID(10)),
					Message:  resp.AIResponse,
					Role:     models.Assistant,
				})
				_, err = hai.UpdateChatMessages(chatId, uid, chatHistory.Messages)
				if err != nil {
					writeJSON(outgoing{
						Type:  outgoingError,
						Error: err.Error(),
						Id:    getIncomingID(),
					})
					continue
				}
			}

		case incomingGetChat:
			chatId := *incoming.ChatId
			if strings.TrimSpace(chatId) == "" {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: "message and chatId cannot be empty",
					Id:    getIncomingID(),
				})
				continue
			}
			chat, err := hai.GetChatById(chatId, uid)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
				})
				continue
			}

			writeJSON(outgoing{
				Type:   outgoingGetChat,
				Data:   chat,
				ChatId: incoming.ChatId,
			})

		case incomingGetChats:
			chats, err := hai.GetAllChatsForUser(uid)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
				})
				continue
			}

			writeJSON(outgoing{
				Type: outgoingGetChats,
				Data: chats,
			})

		case incomingOnlineStatus:
			userAppState := socketstate.NewPublicUserState(uid)
			err := userAppState.SetOnlineStatus(true)
			if err != nil {
				writeJSON(outgoing{
					Type:  outgoingError,
					Error: err.Error(),
				})
				continue
			} else {
				writeJSON(outgoing{
					Type: outgoingOnlineStatus,
					Data: true,
				})
			}

		case incomingAIRequest:
		// Need to implement

		default:
			writeJSON(outgoing{
				Type:  outgoingError,
				Error: fmt.Sprintf("unknown message type: %s", incoming.Type),
				Id:    getIncomingID(),
			})
		}
	}
}
