package chatservice

import (
	"spark/internal/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"slices"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
	"github.com/redis/go-redis/v9"
)

var ErrUnauthorized = errors.New("unauthorized: user is not a participant of this chat")

const (
	BatchSize   = 50
	IdleTimeout = 60 * time.Second
)

var ctx = context.Background()

func chatMsgsKey(chatId string) string  { return fmt.Sprintf("spark:chat:%s:msgs", chatId) }
func chatPubKey(chatId string) string   { return fmt.Sprintf("spark:chat:%s:pub", chatId) }
func chatMetaKey(chatId string) string  { return fmt.Sprintf("spark:chat:%s:meta", chatId) }
func chatCacheKey(chatId string) string { return fmt.Sprintf("spark:chat:%s", chatId) }
func chatFlushTokenKey(chatId string) string {
	return fmt.Sprintf("spark:chat:%s:flush_token", chatId)
}
func chatActiveKey() string { return "spark:chat:active" }

type MessageEvents string

const (
	MessageEventMessage MessageEvents = "message"
	MessageEventUpdate  MessageEvents = "update"
	MessageEventSeen    MessageEvents = "seen"
	MessageEventTyping  MessageEvents = "typing"
)

type Store struct {
	chatId       string
	userId       string
	participants []string
	rc           *redis.Client
}

type PubSubEvent struct {
	Type    MessageEvents   `json:"type"`
	Message *models.Message `json:"message,omitempty"`
	Data    json.RawMessage `json:"data,omitempty"`
}

func NewStore(chatId string, userId string) (*Store, error) {
	s := &Store{
		chatId: chatId,
		userId: userId,
		rc:     utils.RedisConnect(),
	}

	if err := s.loadParticipants(); err != nil {
		s.Close()
		return nil, fmt.Errorf("failed to load participants: %w", err)
	}

	if !s.IsParticipant(userId) {
		s.Close()
		return nil, ErrUnauthorized
	}

	return s, nil
}

// NewStoreWithoutAuth creates a store without authorization check (for internal use like flush)
func NewStoreWithoutAuth(chatId string) *Store {
	return &Store{
		chatId: chatId,
		rc:     utils.RedisConnect(),
	}
}

func (s *Store) loadParticipants() error {
	s.ensureRedis()

	chat, err := s.GetChat()
	if err != nil {
		return fmt.Errorf("failed to get chat: %w", err)
	}

	matchORM := orm.Load(&models.Match{})
	defer matchORM.Close()

	var matches []models.Match
	if err := matchORM.GetByFieldEquals("Id", chat.MatchId).Scan(&matches); err != nil {
		return fmt.Errorf("failed to get match: %w", err)
	}

	if len(matches) == 0 {
		return fmt.Errorf("match not found for chat")
	}

	match := matches[0]
	s.participants = []string{match.SheId, match.HeId}

	return nil
}

func (s *Store) IsParticipant(userId string) bool {
	return slices.Contains(s.participants, userId)
}

func (s *Store) GetParticipants() []string {
	return s.participants
}

func (s *Store) GetUserId() string {
	return s.userId
}

func (s *Store) ensureRedis() {
	if s.rc == nil {
		s.rc = utils.RedisConnect()
	}
}

func (s *Store) Close() error {
	if s.rc != nil {
		return s.rc.Close()
	}
	return nil
}

func (s *Store) SendMessage(msg *models.Message) error {
	s.ensureRedis()

	if msg.Id == "" {
		msg.Id = utils.GenerateID()
	}
	if msg.CreatedAt.IsZero() {
		msg.CreatedAt = time.Now()
	}
	msg.UpdatedAt = msg.CreatedAt

	msgJSON, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	pipe := s.rc.Pipeline()

	msgsKey := chatMsgsKey(s.chatId)
	pipe.RPush(ctx, msgsKey, msgJSON)

	pubEvent := PubSubEvent{
		Type:    MessageEventMessage,
		Message: msg,
	}
	pubJSON, _ := json.Marshal(pubEvent)
	pipe.Publish(ctx, chatPubKey(s.chatId), pubJSON)

	metaKey := chatMetaKey(s.chatId)
	now := time.Now().Unix()
	pipe.HSet(ctx, metaKey, "last_activity_ts", now)

	pipe.ZAdd(ctx, chatActiveKey(), redis.Z{
		Score:  float64(now),
		Member: s.chatId,
	})

	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("redis pipeline failed: %w", err)
	}

	// Increment message counter for sender and check for auto-unlock
	go s.incrementMessageCountAndCheckUnlock(msg.SenderId)

	return s.scheduleFlush()
}

// incrementMessageCountAndCheckUnlock increments the message counter for the sender
// and auto-unlocks the match if both parties have sent enough messages
func (s *Store) incrementMessageCountAndCheckUnlock(senderId string) {
	const unlockThreshold = 50 // Messages required from each party

	chat, err := s.GetChat()
	if err != nil {
		log.Printf("[ERROR] Failed to get chat for message counter: %v", err)
		return
	}

	matchORM := orm.Load(&models.Match{})
	defer matchORM.Close()

	var matches []models.Match
	if err := matchORM.GetByFieldEquals("Id", chat.MatchId).Scan(&matches); err != nil {
		log.Printf("[ERROR] Failed to get match for message counter: %v", err)
		return
	}
	if len(matches) == 0 {
		log.Printf("[ERROR] Match not found for chat: %s", s.chatId)
		return
	}

	match := matches[0]

	// Already unlocked
	if match.IsUnlocked {
		return
	}

	// Determine which counter to increment
	var counterColumn string
	var newCount int
	var otherCount int

	if senderId == match.SheId {
		counterColumn = "she_messages"
		newCount = match.SheMessages + 1
		otherCount = match.HeMessages
	} else if senderId == match.HeId {
		counterColumn = "he_messages"
		newCount = match.HeMessages + 1
		otherCount = match.SheMessages
	} else {
		log.Printf("[WARN] Sender %s not a participant of match %s", senderId, match.Id)
		return
	}

	// Check if should unlock
	shouldUnlock := newCount >= unlockThreshold && otherCount >= unlockThreshold

	// Build and execute update query
	var result interface{}
	if shouldUnlock {
		result = matchORM.QueryRaw(
			fmt.Sprintf("UPDATE matches SET %s = %s + 1, is_unlocked = true WHERE id = $1", counterColumn, counterColumn),
			match.Id,
		)
	} else {
		result = matchORM.QueryRaw(
			fmt.Sprintf("UPDATE matches SET %s = %s + 1 WHERE id = $1", counterColumn, counterColumn),
			match.Id,
		)
	}
	_ = result
}

func (s *Store) GetMessages(limit int, beforeId string) ([]models.Message, error) {
	s.ensureRedis()

	chat, err := s.GetChat()
	if err != nil {
		return nil, fmt.Errorf("failed to get chat: %w", err)
	}

	bufferedMsgs, err := s.getBufferedMessages()
	if err != nil {
		log.Printf("failed to get buffered messages: %v", err)
		bufferedMsgs = []models.Message{}
	}

	allMessages := append(chat.Messages, bufferedMsgs...)

	if beforeId != "" {
		filtered := make([]models.Message, 0)
		found := false
		for _, msg := range allMessages {
			if msg.Id == beforeId {
				found = true
				continue
			}
			if found {
				filtered = append(filtered, msg)
			}
		}
		if found {
			allMessages = filtered
		}
	}

	if limit > 0 && len(allMessages) > limit {
		allMessages = allMessages[len(allMessages)-limit:]
	}

	return allMessages, nil
}

func (s *Store) GetMessageById(messageId string) (*models.Message, error) {
	s.ensureRedis()

	bufferedMsgs, err := s.getBufferedMessages()
	if err == nil {
		for _, msg := range bufferedMsgs {
			if msg.Id == messageId {
				return &msg, nil
			}
		}
	}

	chat, err := s.GetChat()
	if err != nil {
		return nil, fmt.Errorf("failed to get chat: %w", err)
	}

	for _, msg := range chat.Messages {
		if msg.Id == messageId {
			return &msg, nil
		}
	}

	return nil, fmt.Errorf("message not found: %s", messageId)
}

func (s *Store) UpdateMessage(messageId string, updates *models.Message) (*models.Message, error) {
	s.ensureRedis()

	updated, err := s.updateMessageInBuffer(messageId, updates)
	if err == nil && updated != nil {
		s.publishUpdateEvent(updated)
		return updated, nil
	}

	updated, err = s.updateMessageInDB(messageId, updates)
	if err != nil {
		return nil, fmt.Errorf("failed to update message: %w", err)
	}

	s.publishUpdateEvent(updated)

	return updated, nil
}

func (s *Store) publishUpdateEvent(msg *models.Message) {
	event := PubSubEvent{
		Type:    MessageEventUpdate,
		Message: msg,
	}
	eventJSON, _ := json.Marshal(event)
	s.rc.Publish(ctx, chatPubKey(s.chatId), eventJSON)
}

type TypingEvent struct {
	UserId    string    `json:"user_id"`
	IsTyping  bool      `json:"is_typing"`
	Timestamp time.Time `json:"timestamp"`
}

func (s *Store) SendTypingEvent(userId string) error {
	s.ensureRedis()

	event := PubSubEvent{
		Type: MessageEventTyping,
	}
	data, _ := json.Marshal(TypingEvent{
		UserId:    userId,
		IsTyping:  true,
		Timestamp: time.Now(),
	})
	event.Data = data
	eventJSON, _ := json.Marshal(event)

	return s.rc.Publish(ctx, chatPubKey(s.chatId), eventJSON).Err()
}

func (s *Store) StopTypingEvent(userId string) error {
	s.ensureRedis()

	event := PubSubEvent{
		Type: MessageEventTyping,
	}
	data, _ := json.Marshal(TypingEvent{
		UserId:    userId,
		IsTyping:  false,
		Timestamp: time.Now(),
	})
	event.Data = data
	eventJSON, _ := json.Marshal(event)

	return s.rc.Publish(ctx, chatPubKey(s.chatId), eventJSON).Err()
}

func (s *Store) MarkMessagesSeen(messageIds []string, userId string) error {
	s.ensureRedis()

	for _, msgId := range messageIds {
		s.updateMessageInBuffer(msgId, &models.Message{Seen: true, Received: true})
	}

	event := PubSubEvent{
		Type: MessageEventSeen,
	}
	data, _ := json.Marshal(map[string]any{
		"message_ids": messageIds,
		"user_id":     userId,
		"timestamp":   time.Now(),
	})
	event.Data = data
	eventJSON, _ := json.Marshal(event)
	s.rc.Publish(ctx, chatPubKey(s.chatId), eventJSON)

	return nil
}

func (s *Store) GetChat() (*models.Chat, error) {
	s.ensureRedis()

	key := chatCacheKey(s.chatId)
	data, err := s.rc.Get(ctx, key).Bytes()
	if err == nil && len(data) > 0 {
		var chat models.Chat
		if err := json.Unmarshal(data, &chat); err != nil {
			return nil, err
		}
		return &chat, nil
	}

	chatORM := orm.Load(&models.Chat{})
	defer chatORM.Close()

	var c []models.Chat
	if err := chatORM.GetByFieldEquals("Id", s.chatId).Scan(&c); err != nil {
		return nil, err
	}
	if len(c) == 0 {
		return nil, fmt.Errorf("chat not found")
	}

	marshaled, err := json.Marshal(c[0])
	if err != nil {
		return nil, err
	}
	if err := s.rc.Set(ctx, key, marshaled, 5*time.Minute).Err(); err != nil {
		log.Printf("redis set cache failed: %v", err)
	}

	return &c[0], nil
}

func (s *Store) FlushMessages(flushToken string) error {
	s.ensureRedis()

	tokenKey := chatFlushTokenKey(s.chatId)
	currentToken, err := s.rc.Get(ctx, tokenKey).Result()
	if err != nil && err != redis.Nil {
		return fmt.Errorf("failed to get flush token: %w", err)
	}

	if currentToken != "" && currentToken != flushToken {
		log.Printf("stale flush token for chat %s, ignoring", s.chatId)
		return nil
	}

	msgsKey := chatMsgsKey(s.chatId)

	luaScript := redis.NewScript(`
		local msgs = redis.call('LRANGE', KEYS[1], 0, ARGV[1] - 1)
		if #msgs > 0 then
			redis.call('LTRIM', KEYS[1], ARGV[1], -1)
		end
		return msgs
	`)

	result, err := luaScript.Run(ctx, s.rc, []string{msgsKey}, BatchSize).Result()
	if err != nil {
		return fmt.Errorf("failed to pop messages: %w", err)
	}

	msgStrings, ok := result.([]any)
	if !ok || len(msgStrings) == 0 {
		return nil
	}

	// Parse messages
	messages := make([]models.Message, 0, len(msgStrings))
	for _, msgStr := range msgStrings {
		var msg models.Message
		if str, ok := msgStr.(string); ok {
			if err := json.Unmarshal([]byte(str), &msg); err != nil {
				log.Printf("failed to unmarshal message: %v", err)
				continue
			}
			messages = append(messages, msg)
		}
	}

	if len(messages) == 0 {
		return nil
	}

	if err := s.insertMessagesToDB(messages); err != nil {
		if pushErr := s.pushMessagesBack(messages); pushErr != nil {
			log.Printf("CRITICAL: failed to push messages back to Redis: %v", pushErr)
		}
		return fmt.Errorf("failed to insert messages to db: %w", err)
	}

	newToken := utils.GenerateID()
	s.rc.Set(ctx, tokenKey, newToken, IdleTimeout+10*time.Second)

	remaining, err := s.rc.LLen(ctx, msgsKey).Result()
	if err != nil {
		log.Printf("failed to check remaining messages: %v", err)
		return nil
	}

	if remaining > 0 {
		bearer := config.GetEnvRaw("QSTASH_TOKEN")
		delay := time.Duration(0)
		if remaining < BatchSize {
			delay = IdleTimeout
		}
		if err := publishQStashFlush(bearer, s.chatId, delay, newToken); err != nil {
			log.Printf("failed to schedule follow-up flush: %v", err)
		}
	}

	return nil
}
