package chatservice

import (
	"spark/internal/models"
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"
)

type MockRedisClient struct {
	data     map[string]any
	lists    map[string][]string
	pubsub   map[string][]string
	mu       sync.RWMutex
	subChans map[string]chan string
}

func NewMockRedis() *MockRedisClient {
	return &MockRedisClient{
		data:     make(map[string]any),
		lists:    make(map[string][]string),
		pubsub:   make(map[string][]string),
		subChans: make(map[string]chan string),
	}
}

func (m *MockRedisClient) Publish(channel string, message string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.pubsub[channel] = append(m.pubsub[channel], message)
	if ch, ok := m.subChans[channel]; ok {
		select {
		case ch <- message:
		default:
		}
	}
}

func (m *MockRedisClient) Subscribe(channel string) chan string {
	m.mu.Lock()
	defer m.mu.Unlock()
	ch := make(chan string, 100)
	m.subChans[channel] = ch
	return ch
}

func (m *MockRedisClient) RPush(key string, value string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.lists[key] = append(m.lists[key], value)
}

func (m *MockRedisClient) LRange(key string, start, stop int) []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	list := m.lists[key]
	if start < 0 {
		start = 0
	}
	if stop < 0 || stop >= len(list) {
		stop = len(list) - 1
	}
	if start > stop || start >= len(list) {
		return []string{}
	}
	return list[start : stop+1]
}

func (m *MockRedisClient) GetPublishedMessages(channel string) []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.pubsub[channel]
}

func TestMessageCreation(t *testing.T) {
	msg := &models.Message{
		Id:        "test-msg-001",
		SenderId:  "user-001",
		Content:   "Hello, World!",
		Type:      models.TEXT,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	t.Logf("DEBUG: Created message with ID: %s", msg.Id)
	t.Logf("DEBUG: Message content: %s", msg.Content)
	t.Logf("DEBUG: Message sender: %s", msg.SenderId)

	if msg.Id == "" {
		t.Error("Message ID should not be empty")
	}
	if msg.Content != "Hello, World!" {
		t.Errorf("Expected content 'Hello, World!', got '%s'", msg.Content)
	}
	if msg.Type != models.TEXT {
		t.Errorf("Expected type TEXT, got %s", msg.Type)
	}
}

func TestMessageSerialization(t *testing.T) {
	now := time.Now().Truncate(time.Second)
	msg := &models.Message{
		Id:        "test-msg-002",
		SenderId:  "user-002",
		Content:   "Test message content",
		Type:      models.TEXT,
		CreatedAt: now,
		UpdatedAt: now,
		Received:  false,
		Seen:      false,
	}

	t.Logf("DEBUG: Original message: %+v", msg)

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal message: %v", err)
	}
	t.Logf("DEBUG: Serialized JSON: %s", string(data))

	var decoded models.Message
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal message: %v", err)
	}
	t.Logf("DEBUG: Decoded message: %+v", decoded)

	if decoded.Id != msg.Id {
		t.Errorf("ID mismatch: expected %s, got %s", msg.Id, decoded.Id)
	}
	if decoded.Content != msg.Content {
		t.Errorf("Content mismatch: expected %s, got %s", msg.Content, decoded.Content)
	}
	if decoded.SenderId != msg.SenderId {
		t.Errorf("SenderId mismatch: expected %s, got %s", msg.SenderId, decoded.SenderId)
	}
}

func TestPubSubEventSerialization(t *testing.T) {
	msg := &models.Message{
		Id:        "test-msg-003",
		SenderId:  "user-003",
		Content:   "PubSub test",
		Type:      models.TEXT,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	event := PubSubEvent{
		Type:    MessageEventMessage,
		Message: msg,
	}

	t.Logf("DEBUG: Original event type: %s", event.Type)
	t.Logf("DEBUG: Event message ID: %s", event.Message.Id)

	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal event: %v", err)
	}
	t.Logf("DEBUG: Serialized event: %s", string(data))

	var decoded PubSubEvent
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal event: %v", err)
	}

	if decoded.Type != MessageEventMessage {
		t.Errorf("Event type mismatch: expected %s, got %s", MessageEventMessage, decoded.Type)
	}
	if decoded.Message == nil {
		t.Error("Decoded message should not be nil")
	}
	if decoded.Message.Id != msg.Id {
		t.Errorf("Message ID mismatch: expected %s, got %s", msg.Id, decoded.Message.Id)
	}
}

func TestTypingEventSerialization(t *testing.T) {
	typingEvent := TypingEvent{
		UserId:    "user-004",
		IsTyping:  true,
		Timestamp: time.Now(),
	}

	t.Logf("DEBUG: Typing event user: %s, isTyping: %v", typingEvent.UserId, typingEvent.IsTyping)

	data, err := json.Marshal(typingEvent)
	if err != nil {
		t.Fatalf("Failed to marshal typing event: %v", err)
	}
	t.Logf("DEBUG: Serialized typing event: %s", string(data))

	pubEvent := PubSubEvent{
		Type: MessageEventTyping,
		Data: data,
	}

	eventData, err := json.Marshal(pubEvent)
	if err != nil {
		t.Fatalf("Failed to marshal pub event: %v", err)
	}
	t.Logf("DEBUG: Full pub event: %s", string(eventData))

	var decoded PubSubEvent
	err = json.Unmarshal(eventData, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal pub event: %v", err)
	}

	if decoded.Type != MessageEventTyping {
		t.Errorf("Expected type %s, got %s", MessageEventTyping, decoded.Type)
	}

	var decodedTyping TypingEvent
	err = json.Unmarshal(decoded.Data, &decodedTyping)
	if err != nil {
		t.Fatalf("Failed to unmarshal typing data: %v", err)
	}

	if decodedTyping.UserId != typingEvent.UserId {
		t.Errorf("UserId mismatch: expected %s, got %s", typingEvent.UserId, decodedTyping.UserId)
	}
	if decodedTyping.IsTyping != typingEvent.IsTyping {
		t.Errorf("IsTyping mismatch: expected %v, got %v", typingEvent.IsTyping, decodedTyping.IsTyping)
	}
}

func TestMessageWithMedia(t *testing.T) {
	media := []models.Media{
		{
			Id:        "media-001",
			Type:      "image",
			Url:       "https://example.com/image.jpg",
			CreatedAt: time.Now(),
		},
		{
			Id:        "media-002",
			Type:      "video",
			Url:       "https://example.com/video.mp4",
			CreatedAt: time.Now(),
		},
	}

	msg := &models.Message{
		Id:        "test-msg-005",
		SenderId:  "user-005",
		Content:   "Message with media",
		Type:      models.IMAGE,
		Media:     media,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	t.Logf("DEBUG: Message with %d media items", len(msg.Media))
	for i, m := range msg.Media {
		t.Logf("DEBUG: Media[%d]: type=%s, url=%s", i, m.Type, m.Url)
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal message with media: %v", err)
	}
	t.Logf("DEBUG: Serialized: %s", string(data))

	var decoded models.Message
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if len(decoded.Media) != 2 {
		t.Errorf("Expected 2 media items, got %d", len(decoded.Media))
	}
	if decoded.Media[0].Type != "image" {
		t.Errorf("Expected first media type 'image', got '%s'", decoded.Media[0].Type)
	}
}

func TestMessageWithReactions(t *testing.T) {
	reactions := []models.Reaction{
		{
			Id:        "reaction-001",
			SenderId:  "user-006",
			Content:   "👍",
			CreatedAt: time.Now(),
		},
		{
			Id:        "reaction-002",
			SenderId:  "user-007",
			Content:   "❤️",
			CreatedAt: time.Now(),
		},
	}

	msg := &models.Message{
		Id:        "test-msg-006",
		SenderId:  "user-005",
		Content:   "Message with reactions",
		Type:      models.TEXT,
		Reactions: reactions,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	t.Logf("DEBUG: Message with %d reactions", len(msg.Reactions))
	for i, r := range msg.Reactions {
		t.Logf("DEBUG: Reaction[%d]: from=%s, content=%s", i, r.SenderId, r.Content)
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var decoded models.Message
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if len(decoded.Reactions) != 2 {
		t.Errorf("Expected 2 reactions, got %d", len(decoded.Reactions))
	}
}

func TestConcurrentMessageCreation(t *testing.T) {
	var wg sync.WaitGroup
	messages := make([]*models.Message, 100)
	errors := make([]error, 100)

	t.Log("DEBUG: Starting concurrent message creation test with 100 goroutines")
	startTime := time.Now()

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			msg := &models.Message{
				Id:        fmt.Sprintf("concurrent-msg-%03d", idx),
				SenderId:  fmt.Sprintf("user-%03d", idx%10),
				Content:   fmt.Sprintf("Concurrent message %d", idx),
				Type:      models.TEXT,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			data, err := json.Marshal(msg)
			if err != nil {
				errors[idx] = err
				return
			}
			var decoded models.Message
			err = json.Unmarshal(data, &decoded)
			if err != nil {
				errors[idx] = err
				return
			}
			messages[idx] = &decoded
		}(i)
	}

	wg.Wait()
	elapsed := time.Since(startTime)
	t.Logf("DEBUG: Completed in %v", elapsed)

	errorCount := 0
	for i, err := range errors {
		if err != nil {
			errorCount++
			t.Logf("DEBUG: Error at index %d: %v", i, err)
		}
	}

	successCount := 0
	for _, msg := range messages {
		if msg != nil {
			successCount++
		}
	}

	t.Logf("DEBUG: Success: %d, Errors: %d", successCount, errorCount)

	if errorCount > 0 {
		t.Errorf("Got %d errors during concurrent creation", errorCount)
	}
	if successCount != 100 {
		t.Errorf("Expected 100 successful messages, got %d", successCount)
	}
}

func TestMockRedisPubSub(t *testing.T) {
	redis := NewMockRedis()
	channel := "test-channel"

	t.Log("DEBUG: Testing mock Redis pub/sub")

	subChan := redis.Subscribe(channel)
	t.Logf("DEBUG: Subscribed to channel: %s", channel)

	go func() {
		time.Sleep(10 * time.Millisecond)
		redis.Publish(channel, "test-message-1")
		t.Log("DEBUG: Published message 1")
		redis.Publish(channel, "test-message-2")
		t.Log("DEBUG: Published message 2")
	}()

	received := make([]string, 0)
	timeout := time.After(100 * time.Millisecond)

	for i := 0; i < 2; i++ {
		select {
		case msg := <-subChan:
			t.Logf("DEBUG: Received: %s", msg)
			received = append(received, msg)
		case <-timeout:
			t.Log("DEBUG: Timeout waiting for messages")
			break
		}
	}

	t.Logf("DEBUG: Total received: %d messages", len(received))

	if len(received) != 2 {
		t.Errorf("Expected 2 messages, got %d", len(received))
	}

	published := redis.GetPublishedMessages(channel)
	t.Logf("DEBUG: Published messages in store: %d", len(published))

	if len(published) != 2 {
		t.Errorf("Expected 2 published messages in store, got %d", len(published))
	}
}

func TestMockRedisList(t *testing.T) {
	redis := NewMockRedis()
	key := "test-list"

	t.Log("DEBUG: Testing mock Redis list operations")

	for i := 0; i < 5; i++ {
		msg := fmt.Sprintf("message-%d", i)
		redis.RPush(key, msg)
		t.Logf("DEBUG: Pushed: %s", msg)
	}

	all := redis.LRange(key, 0, -1)
	t.Logf("DEBUG: LRange(0, -1) returned %d items", len(all))

	if len(all) != 5 {
		t.Errorf("Expected 5 items, got %d", len(all))
	}

	first3 := redis.LRange(key, 0, 2)
	t.Logf("DEBUG: LRange(0, 2) returned %d items: %v", len(first3), first3)

	if len(first3) != 3 {
		t.Errorf("Expected 3 items, got %d", len(first3))
	}

	last2 := redis.LRange(key, 3, 4)
	t.Logf("DEBUG: LRange(3, 4) returned %d items: %v", len(last2), last2)

	if len(last2) != 2 {
		t.Errorf("Expected 2 items, got %d", len(last2))
	}
}

func TestEventTypeConstants(t *testing.T) {
	t.Logf("DEBUG: MessageEventMessage = %s", MessageEventMessage)
	t.Logf("DEBUG: MessageEventUpdate = %s", MessageEventUpdate)
	t.Logf("DEBUG: MessageEventSeen = %s", MessageEventSeen)
	t.Logf("DEBUG: MessageEventTyping = %s", MessageEventTyping)

	if MessageEventMessage != "message" {
		t.Errorf("Expected 'message', got '%s'", MessageEventMessage)
	}
	if MessageEventUpdate != "update" {
		t.Errorf("Expected 'update', got '%s'", MessageEventUpdate)
	}
	if MessageEventSeen != "seen" {
		t.Errorf("Expected 'seen', got '%s'", MessageEventSeen)
	}
	if MessageEventTyping != "typing" {
		t.Errorf("Expected 'typing', got '%s'", MessageEventTyping)
	}
}

func TestChatKeyGeneration(t *testing.T) {
	chatId := "test-chat-123"

	msgsKey := chatMsgsKey(chatId)
	pubKey := chatPubKey(chatId)
	metaKey := chatMetaKey(chatId)
	cacheKey := chatCacheKey(chatId)
	flushKey := chatFlushTokenKey(chatId)
	activeKey := chatActiveKey()

	t.Logf("DEBUG: msgsKey = %s", msgsKey)
	t.Logf("DEBUG: pubKey = %s", pubKey)
	t.Logf("DEBUG: metaKey = %s", metaKey)
	t.Logf("DEBUG: cacheKey = %s", cacheKey)
	t.Logf("DEBUG: flushKey = %s", flushKey)
	t.Logf("DEBUG: activeKey = %s", activeKey)

	expectedMsgsKey := "spark:chat:test-chat-123:msgs"
	if msgsKey != expectedMsgsKey {
		t.Errorf("Expected msgsKey '%s', got '%s'", expectedMsgsKey, msgsKey)
	}

	expectedPubKey := "spark:chat:test-chat-123:pub"
	if pubKey != expectedPubKey {
		t.Errorf("Expected pubKey '%s', got '%s'", expectedPubKey, pubKey)
	}

	expectedMetaKey := "spark:chat:test-chat-123:meta"
	if metaKey != expectedMetaKey {
		t.Errorf("Expected metaKey '%s', got '%s'", expectedMetaKey, metaKey)
	}

	expectedCacheKey := "spark:chat:test-chat-123"
	if cacheKey != expectedCacheKey {
		t.Errorf("Expected cacheKey '%s', got '%s'", expectedCacheKey, cacheKey)
	}

	expectedFlushKey := "spark:chat:test-chat-123:flush_token"
	if flushKey != expectedFlushKey {
		t.Errorf("Expected flushKey '%s', got '%s'", expectedFlushKey, flushKey)
	}

	expectedActiveKey := "spark:chat:active"
	if activeKey != expectedActiveKey {
		t.Errorf("Expected activeKey '%s', got '%s'", expectedActiveKey, activeKey)
	}
}

func TestMessageSeenEventSerialization(t *testing.T) {
	messageIds := []string{"msg-001", "msg-002", "msg-003"}
	userId := "user-008"

	seenData := map[string]any{
		"message_ids": messageIds,
		"user_id":     userId,
		"timestamp":   time.Now(),
	}

	t.Logf("DEBUG: Seen data: %+v", seenData)

	data, err := json.Marshal(seenData)
	if err != nil {
		t.Fatalf("Failed to marshal seen data: %v", err)
	}
	t.Logf("DEBUG: Serialized: %s", string(data))

	event := PubSubEvent{
		Type: MessageEventSeen,
		Data: data,
	}

	eventData, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal event: %v", err)
	}
	t.Logf("DEBUG: Full event: %s", string(eventData))

	var decoded PubSubEvent
	err = json.Unmarshal(eventData, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal event: %v", err)
	}

	if decoded.Type != MessageEventSeen {
		t.Errorf("Expected type %s, got %s", MessageEventSeen, decoded.Type)
	}

	var decodedData map[string]any
	err = json.Unmarshal(decoded.Data, &decodedData)
	if err != nil {
		t.Fatalf("Failed to unmarshal seen data: %v", err)
	}

	ids, ok := decodedData["message_ids"].([]any)
	if !ok {
		t.Fatalf("message_ids is not an array")
	}
	t.Logf("DEBUG: Decoded message_ids: %v", ids)

	if len(ids) != 3 {
		t.Errorf("Expected 3 message IDs, got %d", len(ids))
	}
}

func TestMessageUpdateFields(t *testing.T) {
	original := &models.Message{
		Id:        "test-msg-007",
		SenderId:  "user-009",
		Content:   "Original content",
		Type:      models.TEXT,
		Received:  false,
		Seen:      false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	t.Logf("DEBUG: Original - Received: %v, Seen: %v, Content: %s",
		original.Received, original.Seen, original.Content)

	updated := *original
	updated.Received = true
	updated.UpdatedAt = time.Now()

	t.Logf("DEBUG: After marking received - Received: %v, Seen: %v",
		updated.Received, updated.Seen)

	if !updated.Received {
		t.Error("Received should be true")
	}
	if updated.Seen {
		t.Error("Seen should still be false")
	}

	updated.Seen = true
	updated.UpdatedAt = time.Now()

	t.Logf("DEBUG: After marking seen - Received: %v, Seen: %v",
		updated.Received, updated.Seen)

	if !updated.Seen {
		t.Error("Seen should be true")
	}

	updated.Content = "Updated content"
	updated.UpdatedAt = time.Now()

	t.Logf("DEBUG: After content update - Content: %s", updated.Content)

	if updated.Content != "Updated content" {
		t.Errorf("Expected 'Updated content', got '%s'", updated.Content)
	}

	if updated.CreatedAt.Equal(updated.UpdatedAt) {
		t.Log("DEBUG: Warning - CreatedAt equals UpdatedAt (may be too fast)")
	}
}

func TestConcurrentPubSub(t *testing.T) {
	redis := NewMockRedis()
	channel := "concurrent-test-channel"

	t.Log("DEBUG: Starting concurrent pub/sub test")

	subChan := redis.Subscribe(channel)

	var wg sync.WaitGroup
	numPublishers := 10
	messagesPerPublisher := 10

	t.Logf("DEBUG: %d publishers, %d messages each", numPublishers, messagesPerPublisher)

	for i := 0; i < numPublishers; i++ {
		wg.Add(1)
		go func(publisherID int) {
			defer wg.Done()
			for j := 0; j < messagesPerPublisher; j++ {
				msg := fmt.Sprintf("publisher-%d-msg-%d", publisherID, j)
				redis.Publish(channel, msg)
			}
		}(i)
	}

	wg.Wait()
	t.Log("DEBUG: All publishers done")

	time.Sleep(50 * time.Millisecond)

	published := redis.GetPublishedMessages(channel)
	t.Logf("DEBUG: Total published messages: %d", len(published))

	expectedTotal := numPublishers * messagesPerPublisher
	if len(published) != expectedTotal {
		t.Errorf("Expected %d published messages, got %d", expectedTotal, len(published))
	}

	received := 0
	timeout := time.After(100 * time.Millisecond)
	done := false
	for !done {
		select {
		case <-subChan:
			received++
		case <-timeout:
			done = true
		}
	}
	t.Logf("DEBUG: Received via subscription: %d", received)
}

func TestMessageOrdering(t *testing.T) {
	redis := NewMockRedis()
	listKey := "message-order-test"

	t.Log("DEBUG: Testing message ordering")

	for i := 0; i < 10; i++ {
		msg := &models.Message{
			Id:        fmt.Sprintf("order-msg-%02d", i),
			SenderId:  "user-010",
			Content:   fmt.Sprintf("Message %d", i),
			Type:      models.TEXT,
			CreatedAt: time.Now().Add(time.Duration(i) * time.Second),
			UpdatedAt: time.Now().Add(time.Duration(i) * time.Second),
		}
		data, _ := json.Marshal(msg)
		redis.RPush(listKey, string(data))
		t.Logf("DEBUG: Pushed message %d", i)
	}

	all := redis.LRange(listKey, 0, -1)
	t.Logf("DEBUG: Retrieved %d messages", len(all))

	if len(all) != 10 {
		t.Fatalf("Expected 10 messages, got %d", len(all))
	}

	for i, msgData := range all {
		var msg models.Message
		err := json.Unmarshal([]byte(msgData), &msg)
		if err != nil {
			t.Errorf("Failed to unmarshal message %d: %v", i, err)
			continue
		}
		expectedId := fmt.Sprintf("order-msg-%02d", i)
		if msg.Id != expectedId {
			t.Errorf("Message %d: expected ID '%s', got '%s'", i, expectedId, msg.Id)
		}
		t.Logf("DEBUG: Message %d verified: ID=%s", i, msg.Id)
	}
}

func TestEmptyMessageFields(t *testing.T) {
	msg := &models.Message{
		Id:        "empty-test",
		SenderId:  "user-011",
		Content:   "",
		Type:      models.TEXT,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	t.Logf("DEBUG: Message with empty content: %+v", msg)

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}
	t.Logf("DEBUG: Serialized: %s", string(data))

	var decoded models.Message
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if decoded.Content != "" {
		t.Errorf("Expected empty content, got '%s'", decoded.Content)
	}
	if decoded.Media != nil && len(decoded.Media) > 0 {
		t.Errorf("Expected no media, got %d items", len(decoded.Media))
	}
	if decoded.Reactions != nil && len(decoded.Reactions) > 0 {
		t.Errorf("Expected no reactions, got %d items", len(decoded.Reactions))
	}

	t.Logf("DEBUG: Decoded empty fields verified")
}

func TestLargeMessageContent(t *testing.T) {
	largeContent := ""
	for i := 0; i < 1000; i++ {
		largeContent += "This is a test message with some content. "
	}

	t.Logf("DEBUG: Large content length: %d bytes", len(largeContent))

	msg := &models.Message{
		Id:        "large-msg-test",
		SenderId:  "user-012",
		Content:   largeContent,
		Type:      models.TEXT,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal large message: %v", err)
	}
	t.Logf("DEBUG: Serialized size: %d bytes", len(data))

	var decoded models.Message
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal large message: %v", err)
	}

	if len(decoded.Content) != len(largeContent) {
		t.Errorf("Content length mismatch: expected %d, got %d",
			len(largeContent), len(decoded.Content))
	}

	if decoded.Content != largeContent {
		t.Error("Large content mismatch")
	}

	t.Log("DEBUG: Large message test passed")
}

func TestSpecialCharactersInContent(t *testing.T) {
	testCases := []struct {
		name    string
		content string
	}{
		{"unicode", "Hello 世界 🌍 مرحبا"},
		{"newlines", "Line 1\nLine 2\nLine 3"},
		{"tabs", "Col1\tCol2\tCol3"},
		{"quotes", `He said "Hello" and 'Goodbye'`},
		{"backslash", `Path: C:\Users\test`},
		{"html", "<script>alert('xss')</script>"},
		{"json", `{"key": "value"}`},
		{"emoji", "😀😃😄😁😆😅🤣😂🙂🙃"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Logf("DEBUG: Testing %s: %s", tc.name, tc.content)

			msg := &models.Message{
				Id:        "special-char-" + tc.name,
				SenderId:  "user-013",
				Content:   tc.content,
				Type:      models.TEXT,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			data, err := json.Marshal(msg)
			if err != nil {
				t.Fatalf("Failed to marshal: %v", err)
			}
			t.Logf("DEBUG: Serialized: %s", string(data))

			var decoded models.Message
			err = json.Unmarshal(data, &decoded)
			if err != nil {
				t.Fatalf("Failed to unmarshal: %v", err)
			}

			if decoded.Content != tc.content {
				t.Errorf("Content mismatch for %s: expected '%s', got '%s'",
					tc.name, tc.content, decoded.Content)
			}
		})
	}
}

func TestBatchSizeConstant(t *testing.T) {
	t.Logf("DEBUG: BatchSize = %d", BatchSize)
	t.Logf("DEBUG: IdleTimeout = %v", IdleTimeout)

	if BatchSize <= 0 {
		t.Errorf("BatchSize should be positive, got %d", BatchSize)
	}

	if IdleTimeout <= 0 {
		t.Errorf("IdleTimeout should be positive, got %v", IdleTimeout)
	}

	if BatchSize != 50 {
		t.Logf("DEBUG: Note - BatchSize is %d (expected 50)", BatchSize)
	}

	if IdleTimeout != 60*time.Second {
		t.Logf("DEBUG: Note - IdleTimeout is %v (expected 60s)", IdleTimeout)
	}
}

func BenchmarkMessageSerialization(b *testing.B) {
	msg := &models.Message{
		Id:        "bench-msg",
		SenderId:  "user-bench",
		Content:   "Benchmark message content",
		Type:      models.TEXT,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Media: []models.Media{
			{Id: "m1", Type: "image", Url: "https://example.com/1.jpg"},
		},
		Reactions: []models.Reaction{
			{Id: "r1", SenderId: "user-2", Content: "👍"},
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		data, _ := json.Marshal(msg)
		var decoded models.Message
		json.Unmarshal(data, &decoded)
	}
}

func BenchmarkPubSubEvent(b *testing.B) {
	msg := &models.Message{
		Id:        "bench-event",
		SenderId:  "user-bench",
		Content:   "Event benchmark",
		Type:      models.TEXT,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	event := PubSubEvent{
		Type:    MessageEventMessage,
		Message: msg,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		data, _ := json.Marshal(event)
		var decoded PubSubEvent
		json.Unmarshal(data, &decoded)
	}
}
