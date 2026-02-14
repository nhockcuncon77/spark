package pushnotify

import (
	"spark/internal/models"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/orm"
	"github.com/MelloB1989/karma/utils"
)

const (
	ExpoPushURL = "https://exp.host/--/api/v2/push/send"
)

// ExpoPushMessage represents a single push notification message
type ExpoPushMessage struct {
	To        string                 `json:"to"`
	Title     string                 `json:"title,omitempty"`
	Body      string                 `json:"body"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Sound     string                 `json:"sound,omitempty"`
	Badge     *int                   `json:"badge,omitempty"`
	TTL       *int                   `json:"ttl,omitempty"`
	Priority  string                 `json:"priority,omitempty"`
	Subtitle  string                 `json:"subtitle,omitempty"`
	ChannelId string                 `json:"channelId,omitempty"`
}

// ExpoPushTicket represents the response from Expo's push API
type ExpoPushTicket struct {
	Status  string `json:"status"`
	Id      string `json:"id,omitempty"`
	Message string `json:"message,omitempty"`
	Details struct {
		Error string `json:"error,omitempty"`
	} `json:"details,omitempty"`
}

// ExpoPushResponse is the response from Expo's push API
type ExpoPushResponse struct {
	Data []ExpoPushTicket `json:"data"`
}

// PushNotification represents a notification to be sent
type PushNotification struct {
	Title     string
	Body      string
	Data      map[string]interface{}
	Sound     string
	Badge     *int
	ChannelId string
}

// Client handles push notification operations
type Client struct {
	httpClient *http.Client
}

// NewClient creates a new push notification client
func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// DefaultClient is the global push notification client
var DefaultClient = NewClient()

// RegisterToken registers a push token for a user
func RegisterToken(userID, token, platform, deviceID string) error {
	tokenORM := orm.Load(&models.UserPushToken{},
		orm.WithCacheKey(fmt.Sprintf("push_token:%s", userID)),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer tokenORM.Close()

	// Check if token already exists
	var existing []models.UserPushToken
	if err := tokenORM.GetByFieldEquals("Token", token).Scan(&existing); err == nil && len(existing) > 0 {
		// Token exists, update it
		existing[0].UserId = userID
		existing[0].Platform = platform
		existing[0].DeviceId = deviceID
		existing[0].IsActive = true
		existing[0].UpdatedAt = time.Now()
		return tokenORM.Update(&existing[0], existing[0].Id)
	}

	// Create new token
	pushToken := &models.UserPushToken{
		Id:        utils.GenerateID(),
		UserId:    userID,
		Token:     token,
		Platform:  platform,
		DeviceId:  deviceID,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return tokenORM.Insert(pushToken)
}

// RemoveToken deactivates a push token
func RemoveToken(token string) error {
	tokenORM := orm.Load(&models.UserPushToken{})
	defer tokenORM.Close()

	var existing []models.UserPushToken
	if err := tokenORM.GetByFieldEquals("Token", token).Scan(&existing); err != nil {
		return err
	}

	if len(existing) == 0 {
		return nil
	}

	existing[0].IsActive = false
	existing[0].UpdatedAt = time.Now()
	return tokenORM.Update(&existing[0], existing[0].Id)
}

// GetUserTokens returns all active tokens for a user
func GetUserTokens(userID string) ([]string, error) {
	tokenORM := orm.Load(&models.UserPushToken{},
		orm.WithCacheKey(fmt.Sprintf("push_tokens:%s", userID)),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer tokenORM.Close()

	var tokens []models.UserPushToken
	if err := tokenORM.GetByFieldEquals("UserId", userID).Scan(&tokens); err != nil {
		return nil, err
	}

	var activeTokens []string
	for _, t := range tokens {
		if t.IsActive {
			activeTokens = append(activeTokens, t.Token)
		}
	}

	return activeTokens, nil
}

// SendToUser sends a push notification to all of a user's devices
func SendToUser(userID string, notification PushNotification) error {
	tokens, err := GetUserTokens(userID)
	if err != nil {
		return fmt.Errorf("failed to get user tokens: %w", err)
	}

	if len(tokens) == 0 {
		log.Printf("[Push] No active tokens for user %s", userID)
		return nil
	}

	return DefaultClient.SendBatch(tokens, notification)
}

// SendToUsers sends a push notification to multiple users
func SendToUsers(userIDs []string, notification PushNotification) error {
	var allTokens []string
	for _, userID := range userIDs {
		tokens, err := GetUserTokens(userID)
		if err != nil {
			log.Printf("[Push] Failed to get tokens for user %s: %v", userID, err)
			continue
		}
		allTokens = append(allTokens, tokens...)
	}

	if len(allTokens) == 0 {
		return nil
	}

	return DefaultClient.SendBatch(allTokens, notification)
}

// SendBatch sends notifications to multiple tokens
func (c *Client) SendBatch(tokens []string, notification PushNotification) error {
	if len(tokens) == 0 {
		return nil
	}

	messages := make([]ExpoPushMessage, len(tokens))
	for i, token := range tokens {
		messages[i] = ExpoPushMessage{
			To:        token,
			Title:     notification.Title,
			Body:      notification.Body,
			Data:      notification.Data,
			Sound:     notification.Sound,
			Badge:     notification.Badge,
			ChannelId: notification.ChannelId,
		}
		if notification.Sound == "" {
			messages[i].Sound = "default"
		}
	}

	return c.sendMessages(messages)
}

func (c *Client) sendMessages(messages []ExpoPushMessage) error {
	body, err := json.Marshal(messages)
	if err != nil {
		return fmt.Errorf("failed to marshal messages: %w", err)
	}

	req, err := http.NewRequestWithContext(context.Background(), "POST", ExpoPushURL, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Encoding", "gzip, deflate")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("push API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var pushResp ExpoPushResponse
	if err := json.Unmarshal(respBody, &pushResp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	// Log any errors
	for i, ticket := range pushResp.Data {
		if ticket.Status == "error" {
			log.Printf("[Push] Failed to send to token %d: %s - %s", i, ticket.Details.Error, ticket.Message)
			// Mark token as inactive if it's invalid
			if ticket.Details.Error == "DeviceNotRegistered" && i < len(messages) {
				go RemoveToken(messages[i].To)
			}
		}
	}

	log.Printf("[Push] Sent %d notifications successfully", len(messages))
	return nil
}

// ==================== Notification Helpers ====================

// SendMatchNotification sends push notification for a new match
func SendMatchNotification(userID1, userID2, matcherName string) {
	go func() {
		notification := PushNotification{
			Title: "It's a Match! 💜",
			Body:  fmt.Sprintf("You and %s liked each other! Start chatting now.", matcherName),
			Data: map[string]interface{}{
				"type":    "match",
				"user_id": userID2,
			},
			ChannelId: "matches",
		}
		if err := SendToUser(userID1, notification); err != nil {
			log.Printf("[Push] Failed to send match notification to %s: %v", userID1, err)
		}
	}()
}

// SendMessageNotification sends push notification for a new message
func SendMessageNotification(recipientID, senderName, chatID, preview string) {
	go func() {
		body := preview
		if len(body) > 100 {
			body = body[:100] + "..."
		}
		notification := PushNotification{
			Title: senderName,
			Body:  body,
			Data: map[string]interface{}{
				"type":    "message",
				"chat_id": chatID,
			},
			ChannelId: "messages",
		}
		if err := SendToUser(recipientID, notification); err != nil {
			log.Printf("[Push] Failed to send message notification to %s: %v", recipientID, err)
		}
	}()
}

// SendUnlockRequestNotification sends push notification when someone requests to unlock photos
func SendUnlockRequestNotification(recipientID, requesterName, matchID string) {
	go func() {
		notification := PushNotification{
			Title: "Photo Unlock Request 🔓",
			Body:  fmt.Sprintf("%s wants to reveal photos! Ready to see each other?", requesterName),
			Data: map[string]interface{}{
				"type":     "unlock_request",
				"match_id": matchID,
			},
			ChannelId: "matches",
		}
		if err := SendToUser(recipientID, notification); err != nil {
			log.Printf("[Push] Failed to send unlock request notification to %s: %v", recipientID, err)
		}
	}()
}

// SendUnlockAcceptedNotification sends push notification when unlock is accepted
func SendUnlockAcceptedNotification(recipientID, accepterName, matchID string) {
	go func() {
		notification := PushNotification{
			Title: "Photos Revealed! 📸",
			Body:  fmt.Sprintf("%s accepted! You can now see each other's photos.", accepterName),
			Data: map[string]interface{}{
				"type":     "unlock_accepted",
				"match_id": matchID,
			},
			ChannelId: "matches",
		}
		if err := SendToUser(recipientID, notification); err != nil {
			log.Printf("[Push] Failed to send unlock accepted notification to %s: %v", recipientID, err)
		}
	}()
}

// SendRatingRequestNotification prompts user to rate after unlock
func SendRatingRequestNotification(recipientID, partnerName, matchID string) {
	go func() {
		notification := PushNotification{
			Title: "Time to Rate! ⭐",
			Body:  fmt.Sprintf("What do you think of %s? Rate to see if it's a date!", partnerName),
			Data: map[string]interface{}{
				"type":     "rating_request",
				"match_id": matchID,
			},
			ChannelId: "matches",
		}
		if err := SendToUser(recipientID, notification); err != nil {
			log.Printf("[Push] Failed to send rating request notification to %s: %v", recipientID, err)
		}
	}()
}

// SendDateConfirmationNotification sends when both users rate 8+
func SendDateConfirmationNotification(recipientID, partnerName, matchID string) {
	go func() {
		notification := PushNotification{
			Title: "It's a Date! 🎉",
			Body:  fmt.Sprintf("You and %s both gave 8+ ratings! Plan your date!", partnerName),
			Data: map[string]interface{}{
				"type":     "date_confirmed",
				"match_id": matchID,
			},
			ChannelId: "matches",
		}
		if err := SendToUser(recipientID, notification); err != nil {
			log.Printf("[Push] Failed to send date confirmation notification to %s: %v", recipientID, err)
		}
	}()
}

// SendStreakMilestoneNotification sends notification for streak milestones
func SendStreakMilestoneNotification(recipientID, partnerName string, streak int, matchID string) {
	go func() {
		var emoji string
		switch {
		case streak >= 100:
			emoji = "💯🔥"
		case streak >= 30:
			emoji = "🔥🔥🔥"
		case streak >= 14:
			emoji = "🔥🔥"
		default:
			emoji = "🔥"
		}
		notification := PushNotification{
			Title: fmt.Sprintf("%d Day Streak! %s", streak, emoji),
			Body:  fmt.Sprintf("Keep the conversation going with %s!", partnerName),
			Data: map[string]interface{}{
				"type":     "streak_milestone",
				"match_id": matchID,
				"streak":   streak,
			},
			ChannelId: "streaks",
		}
		if err := SendToUser(recipientID, notification); err != nil {
			log.Printf("[Push] Failed to send streak milestone notification to %s: %v", recipientID, err)
		}
	}()
}

// SendMassNotification sends a notification to all users or a segment
func SendMassNotification(title, body string, segment string) error {
	// Get all users based on segment
	// For now, we'll implement "all" segment
	tokenORM := orm.Load(&models.UserPushToken{})
	defer tokenORM.Close()

	var tokens []models.UserPushToken
	if err := tokenORM.GetByFieldEquals("IsActive", true).Scan(&tokens); err != nil {
		return err
	}

	tokenStrings := make([]string, len(tokens))
	for i, t := range tokens {
		tokenStrings[i] = t.Token
	}

	notification := PushNotification{
		Title:     title,
		Body:      body,
		ChannelId: "announcements",
	}

	// Send in batches of 100
	batchSize := 100
	for i := 0; i < len(tokenStrings); i += batchSize {
		end := i + batchSize
		if end > len(tokenStrings) {
			end = len(tokenStrings)
		}
		batch := tokenStrings[i:end]
		if err := DefaultClient.SendBatch(batch, notification); err != nil {
			log.Printf("[Push] Failed to send batch %d-%d: %v", i, end, err)
		}
	}

	log.Printf("[Push] Mass notification sent to %d tokens", len(tokenStrings))
	return nil
}
