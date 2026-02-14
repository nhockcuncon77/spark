package ai

import (
	"spark/internal/helpers/subscriptions"
	"spark/internal/models"
	"fmt"
	"log"

	"github.com/MelloB1989/karma/ai"
	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/orm"
	"github.com/MelloB1989/karma/utils"
)

// ReplyTone represents the tone for AI-generated replies
type ReplyTone string

const (
	ToneFlirty     ReplyTone = "flirty"
	ToneFriendly   ReplyTone = "friendly"
	ToneWitty      ReplyTone = "witty"
	ToneThoughtful ReplyTone = "thoughtful"
)

// AIReply represents a generated reply suggestion
type AIReply struct {
	ID   string    `json:"id"`
	Text string    `json:"text"`
	Tone ReplyTone `json:"tone"`
}

// GenerateRepliesResult is the result of generating AI replies
type GenerateRepliesResult struct {
	Replies        []AIReply `json:"replies"`
	RemainingToday int       `json:"remaining_today"`
}

const aiReplySystemPrompt = `You are a dating chat assistant for the Spark dating app. Your job is to generate 3 flirty, engaging, and personalized reply suggestions based on the conversation context.

Guidelines:
- Keep replies concise (1-2 sentences max)
- Be playful and engaging but not creepy
- Match the energy of the conversation
- Avoid generic responses
- Don't be overly forward or explicit
- Be authentic and natural

You MUST respond with exactly 3 replies in this JSON format:
{
  "replies": [
    {"text": "First reply here", "tone": "flirty"},
    {"text": "Second reply here", "tone": "friendly"},
    {"text": "Third reply here", "tone": "witty"}
  ]
}

The tone should be one of: flirty, friendly, witty, thoughtful`

// GenerateAIReplies generates AI-powered reply suggestions for a chat
func GenerateAIReplies(userID, chatID string, contextMessages int, preferredTone string) (*GenerateRepliesResult, error) {
	// Check if user can use AI features
	canUse, remaining, err := subscriptions.CanUseAIReplies(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check AI access: %w", err)
	}

	if !canUse {
		return &GenerateRepliesResult{
			Replies:        []AIReply{},
			RemainingToday: 0,
		}, fmt.Errorf("AI reply limit reached for today")
	}

	// Get the chat messages
	chatORM := orm.Load(&models.Chat{},
		orm.WithCacheKey(fmt.Sprintf("chat:%s", chatID)),
		orm.WithCacheOn(true),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer chatORM.Close()

	var chats []models.Chat
	if err := chatORM.GetByFieldEquals("Id", chatID).Scan(&chats); err != nil {
		return nil, fmt.Errorf("failed to get chat: %w", err)
	}

	if len(chats) == 0 {
		return nil, fmt.Errorf("chat not found")
	}

	chat := chats[0]

	// Build conversation context
	if contextMessages <= 0 {
		contextMessages = 10
	}

	startIdx := 0
	if len(chat.Messages) > contextMessages {
		startIdx = len(chat.Messages) - contextMessages
	}

	conversationContext := "Recent conversation:\n"
	for i := startIdx; i < len(chat.Messages); i++ {
		msg := chat.Messages[i]
		role := "Other person"
		if msg.SenderId == userID {
			role = "You"
		}
		conversationContext += fmt.Sprintf("%s: %s\n", role, msg.Content)
	}

	if preferredTone != "" {
		conversationContext += fmt.Sprintf("\nPreferred tone: %s\n", preferredTone)
	}

	// Generate replies using karma AI
	kai := ai.NewKarmaAI(
		ai.GPT4oMini,
		ai.OpenAI,
		ai.WithMaxTokens(500),
		ai.WithTemperature(0.8),
		ai.WithSystemMessage(aiReplySystemPrompt),
		ai.WithJSONResponse(),
	)

	resp, err := kai.GenerateFromSinglePrompt(conversationContext)
	if err != nil {
		log.Printf("[AI] Failed to generate replies: %v", err)
		return nil, fmt.Errorf("failed to generate replies: %w", err)
	}

	// Parse the response
	replies, err := parseAIReplies(resp.AIResponse)
	if err != nil {
		log.Printf("[AI] Failed to parse AI response: %v", err)
		// Return default replies if parsing fails
		replies = getDefaultReplies()
	}

	// Increment usage count
	if err := subscriptions.IncrementAIUsage(userID); err != nil {
		log.Printf("[AI] Failed to increment usage: %v", err)
	}

	// Calculate remaining
	newRemaining := remaining - 1
	if remaining == -1 {
		newRemaining = -1 // Unlimited
	}

	return &GenerateRepliesResult{
		Replies:        replies,
		RemainingToday: newRemaining,
	}, nil
}

func parseAIReplies(response string) ([]AIReply, error) {
	// Try to parse JSON response
	type aiReplyResponse struct {
		Replies []struct {
			Text string `json:"text"`
			Tone string `json:"tone"`
		} `json:"replies"`
	}

	var parsed aiReplyResponse
	if err := utils.JSONUnmarshal([]byte(response), &parsed); err != nil {
		return nil, err
	}

	replies := make([]AIReply, 0, len(parsed.Replies))
	for _, r := range parsed.Replies {
		tone := ReplyTone(r.Tone)
		if tone != ToneFlirty && tone != ToneFriendly && tone != ToneWitty && tone != ToneThoughtful {
			tone = ToneFriendly
		}
		replies = append(replies, AIReply{
			ID:   utils.GenerateID(),
			Text: r.Text,
			Tone: tone,
		})
	}

	if len(replies) == 0 {
		return nil, fmt.Errorf("no replies in response")
	}

	return replies, nil
}

func getDefaultReplies() []AIReply {
	return []AIReply{
		{ID: utils.GenerateID(), Text: "That's really interesting! Tell me more about it 😊", Tone: ToneFriendly},
		{ID: utils.GenerateID(), Text: "I love that! What else are you passionate about?", Tone: ToneFlirty},
		{ID: utils.GenerateID(), Text: "Okay, you've got my attention now 👀", Tone: ToneWitty},
	}
}

// GetAIUsageStatus returns the current AI usage status for a user
func GetAIUsageStatus(userID string) (canUse bool, remaining int, err error) {
	return subscriptions.CanUseAIReplies(userID)
}
