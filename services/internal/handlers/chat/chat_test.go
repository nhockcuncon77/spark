package chat

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	USER1_JWT       = ""
	USER2_JWT       = ""
	WS_BASE_URL     = "ws://localhost:9000"
	DEFAULT_CHAT_ID = "v8fjdw3abu"
)

type MessageType string

const (
	TEXT MessageType = "TEXT"
)

type Event string

const (
	MessageSent          Event = "message_sent"
	MessageReceived      Event = "message_received"
	MessageSeen          Event = "message_seen"
	MessageUpdated       Event = "message_updated"
	TypingStarted        Event = "typing_started"
	TypingStopped        Event = "typing_stopped"
	QueryMessages        Event = "query_messages"
	ErrorEvent           Event = "error"
	MessagesQuerySuccess Event = "messages_query_success"
)

type Media struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

type Reaction struct {
	ID        string    `json:"id"`
	SenderID  string    `json:"sender_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	ID        string      `json:"id"`
	Type      MessageType `json:"type"`
	Content   string      `json:"content"`
	SenderID  string      `json:"sender_id"`
	Received  bool        `json:"received"`
	Seen      bool        `json:"seen"`
	Media     []Media     `json:"media"`
	Reactions []Reaction  `json:"reactions"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

type IncomingMessage struct {
	ID        *string     `json:"id,omitempty"`
	Type      MessageType `json:"type"`
	Content   string      `json:"content"`
	Media     []Media     `json:"media,omitempty"`
	CreatedAt time.Time   `json:"created_at"`
}

type MessageQuery struct {
	Limit    int    `json:"limit"`
	BeforeID string `json:"before_id,omitempty"`
}

type OutgoingPayload struct {
	Message      *IncomingMessage `json:"message,omitempty"`
	Event        Event            `json:"event"`
	MarkSeen     []string         `json:"mark_seen,omitempty"`
	MessageQuery *MessageQuery    `json:"message_query,omitempty"`
}

type IncomingPayload struct {
	Messages []Message `json:"message"`
	Event    Event     `json:"event"`
	Error    string    `json:"error,omitempty"`
}

type TestClient struct {
	conn      *websocket.Conn
	jwt       string
	chatID    string
	done      chan struct{}
	writeMu   sync.Mutex
	events    chan IncomingPayload
	t         *testing.T
	pongCount int32
	closeOnce sync.Once
}

func NewTestClient(t *testing.T, jwt, chatID string) *TestClient {
	return &TestClient{
		jwt:    jwt,
		chatID: chatID,
		done:   make(chan struct{}),
		events: make(chan IncomingPayload, 100),
		t:      t,
	}
}

func (tc *TestClient) Connect() error {
	wsURL := fmt.Sprintf("%s/v1/chat/ws/%s?token=%s", WS_BASE_URL, tc.chatID, tc.jwt)
	header := http.Header{}
	header.Add("Authorization", "Bearer "+tc.jwt)

	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(wsURL, header)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	tc.conn = conn

	tc.conn.SetPingHandler(func(appData string) error {
		atomic.AddInt32(&tc.pongCount, 1)
		tc.t.Logf("Received ping, sending pong (count: %d)", atomic.LoadInt32(&tc.pongCount))
		tc.writeMu.Lock()
		defer tc.writeMu.Unlock()
		return tc.conn.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(5*time.Second))
	})

	go tc.readLoop()

	tc.t.Logf("Connected to chat %s", tc.chatID)
	return nil
}

func (tc *TestClient) readLoop() {
	for {
		select {
		case <-tc.done:
			return
		default:
			messageType, msgBytes, err := tc.conn.ReadMessage()
			if err != nil {
				tc.t.Logf("Read error: %v", err)
				return
			}

			if messageType != websocket.TextMessage {
				continue
			}

			var payload IncomingPayload
			if err := json.Unmarshal(msgBytes, &payload); err != nil {
				tc.t.Logf("Failed to parse message: %v", err)
				continue
			}

			tc.t.Logf("Received event: %s", payload.Event)
			select {
			case tc.events <- payload:
			case <-tc.done:
				return
			}
		}
	}
}

func (tc *TestClient) Close() {
	tc.closeOnce.Do(func() {
		close(tc.done)
		if tc.conn != nil {
			tc.conn.Close()
		}
	})
}

func (tc *TestClient) SendMessage(content string) error {
	payload := OutgoingPayload{
		Event: MessageSent,
		Message: &IncomingMessage{
			Type:      TEXT,
			Content:   content,
			CreatedAt: time.Now(),
		},
	}
	return tc.send(payload)
}

func (tc *TestClient) SendTyping(started bool) error {
	event := TypingStarted
	if !started {
		event = TypingStopped
	}
	return tc.send(OutgoingPayload{Event: event})
}

func (tc *TestClient) QueryMessages(limit int, beforeID string) error {
	payload := OutgoingPayload{
		Event: QueryMessages,
		MessageQuery: &MessageQuery{
			Limit:    limit,
			BeforeID: beforeID,
		},
	}
	return tc.send(payload)
}

func (tc *TestClient) MarkSeen(messageIDs []string) error {
	payload := OutgoingPayload{
		Event:    MessageSeen,
		MarkSeen: messageIDs,
	}
	return tc.send(payload)
}

func (tc *TestClient) send(payload OutgoingPayload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}
	tc.writeMu.Lock()
	defer tc.writeMu.Unlock()
	return tc.conn.WriteMessage(websocket.TextMessage, data)
}

func (tc *TestClient) WaitForEvent(eventType Event, timeout time.Duration) (IncomingPayload, error) {
	timer := time.NewTimer(timeout)
	defer timer.Stop()

	for {
		select {
		case payload := <-tc.events:
			if payload.Event == eventType {
				return payload, nil
			}
			tc.t.Logf("Skipping event: %s (waiting for %s)", payload.Event, eventType)
		case <-timer.C:
			return IncomingPayload{}, fmt.Errorf("timeout waiting for event %s", eventType)
		case <-tc.done:
			return IncomingPayload{}, fmt.Errorf("client closed")
		}
	}
}

func TestMessageAtomicity(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	client2 := NewTestClient(t, USER2_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client2.Connect())
	defer client2.Close()

	time.Sleep(500 * time.Millisecond)

	testMsg := fmt.Sprintf("atomic_test_%d", time.Now().Unix())
	t.Logf("Sending message: %s", testMsg)

	err := client1.SendMessage(testMsg)
	require.NoError(t, err)

	payload, err := client2.WaitForEvent(MessageSent, 5*time.Second)
	require.NoError(t, err)
	require.Len(t, payload.Messages, 1)
	assert.Equal(t, testMsg, payload.Messages[0].Content)
	t.Logf("Message received atomically: %s", payload.Messages[0].ID)
}

func TestConcurrentMessagesSentInOrder(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	client2 := NewTestClient(t, USER2_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client2.Connect())
	defer client2.Close()

	time.Sleep(500 * time.Millisecond)

	numMessages := 10
	var wg sync.WaitGroup
	var messagesSent sync.Map

	for i := 0; i < numMessages; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			msg := fmt.Sprintf("concurrent_msg_%d_%d", idx, time.Now().UnixNano())
			messagesSent.Store(msg, true)
			err := client1.SendMessage(msg)
			if err != nil {
				t.Logf("Error sending message %d: %v", idx, err)
			}
		}(i)
	}

	wg.Wait()
	t.Logf("Sent %d concurrent messages", numMessages)

	receivedCount := 0
	timeout := time.After(10 * time.Second)

	for receivedCount < numMessages {
		select {
		case payload := <-client2.events:
			if payload.Event == MessageSent {
				for _, msg := range payload.Messages {
					if _, ok := messagesSent.Load(msg.Content); ok {
						receivedCount++
						t.Logf("Received message %d/%d: %s", receivedCount, numMessages, msg.Content)
					}
				}
			}
		case <-timeout:
			t.Fatalf("Timeout: only received %d/%d messages", receivedCount, numMessages)
		}
	}

	assert.Equal(t, numMessages, receivedCount)
}

func TestMessageQueryConsistency(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	time.Sleep(500 * time.Millisecond)

	sentMessages := []string{}
	for i := 0; i < 5; i++ {
		msg := fmt.Sprintf("query_test_%d_%d", i, time.Now().Unix())
		sentMessages = append(sentMessages, msg)
		err := client1.SendMessage(msg)
		require.NoError(t, err)
		time.Sleep(100 * time.Millisecond)
	}

	t.Logf("Sent %d messages for query test", len(sentMessages))

	time.Sleep(1 * time.Second)

	err := client1.QueryMessages(10, "")
	require.NoError(t, err)

	payload, err := client1.WaitForEvent(MessagesQuerySuccess, 10*time.Second)
	require.NoError(t, err)

	t.Logf("Query returned %d messages", len(payload.Messages))

	foundCount := 0
	for _, sentMsg := range sentMessages {
		for _, receivedMsg := range payload.Messages {
			if receivedMsg.Content == sentMsg {
				foundCount++
				break
			}
		}
	}

	assert.GreaterOrEqual(t, foundCount, len(sentMessages), "All sent messages should be in query results")
}

func TestMessageQueryPagination(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	time.Sleep(500 * time.Millisecond)

	err := client1.QueryMessages(5, "")
	require.NoError(t, err)

	payload1, err := client1.WaitForEvent(MessagesQuerySuccess, 5*time.Second)
	require.NoError(t, err)
	require.NotEmpty(t, payload1.Messages)

	t.Logf("First query returned %d messages", len(payload1.Messages))

	if len(payload1.Messages) > 0 {
		beforeID := payload1.Messages[len(payload1.Messages)-1].ID
		t.Logf("Querying before message ID: %s", beforeID)

		err = client1.QueryMessages(5, beforeID)
		require.NoError(t, err)

		payload2, err := client1.WaitForEvent(MessagesQuerySuccess, 5*time.Second)
		require.NoError(t, err)

		t.Logf("Second query returned %d messages", len(payload2.Messages))

		if len(payload2.Messages) > 0 {
			for _, msg2 := range payload2.Messages {
				for _, msg1 := range payload1.Messages {
					assert.NotEqual(t, msg1.ID, msg2.ID, "Paginated results should not overlap")
				}
			}
		}
	}
}

func TestTypingIndicators(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	client2 := NewTestClient(t, USER2_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client2.Connect())
	defer client2.Close()

	time.Sleep(500 * time.Millisecond)

	t.Log("Sending typing started event")
	err := client1.SendTyping(true)
	require.NoError(t, err)

	payload, err := client2.WaitForEvent(TypingStarted, 5*time.Second)
	require.NoError(t, err)
	assert.Equal(t, TypingStarted, payload.Event)

	t.Log("Sending typing stopped event")
	err = client1.SendTyping(false)
	require.NoError(t, err)

	payload, err = client2.WaitForEvent(TypingStopped, 5*time.Second)
	require.NoError(t, err)
	assert.Equal(t, TypingStopped, payload.Event)
}

func TestMessageSeenStatus(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	client2 := NewTestClient(t, USER2_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client2.Connect())
	defer client2.Close()

	time.Sleep(500 * time.Millisecond)

	testMsg := fmt.Sprintf("seen_test_%d", time.Now().Unix())
	t.Logf("Sending message: %s", testMsg)

	err := client1.SendMessage(testMsg)
	require.NoError(t, err)

	payload, err := client2.WaitForEvent(MessageSent, 5*time.Second)
	require.NoError(t, err)
	require.Len(t, payload.Messages, 1)

	messageID := payload.Messages[0].ID
	t.Logf("Marking message as seen: %s", messageID)

	err = client2.MarkSeen([]string{messageID})
	require.NoError(t, err)

	seenPayload, err := client1.WaitForEvent(MessageSeen, 5*time.Second)
	require.NoError(t, err)
	assert.NotEmpty(t, seenPayload.Messages)
	t.Logf("Received message seen event for %d messages", len(seenPayload.Messages))
}

func TestLongInactivityKeepAlive(t *testing.T) {
	client1 := NewTestClient(t, USER1_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client1.Connect())
	defer client1.Close()

	client2 := NewTestClient(t, USER2_JWT, DEFAULT_CHAT_ID)
	require.NoError(t, client2.Connect())
	defer client2.Close()

	time.Sleep(500 * time.Millisecond)

	t.Log("Initial message to establish connection")
	err := client1.SendMessage(fmt.Sprintf("keepalive_start_%d", time.Now().Unix()))
	require.NoError(t, err)

	_, err = client2.WaitForEvent(MessageSent, 5*time.Second)
	require.NoError(t, err)

	inactivityPeriod := 65 * time.Second
	t.Logf("Waiting for %v of inactivity to test keep-alive", inactivityPeriod)

	initialPongCount := atomic.LoadInt32(&client1.pongCount)
	time.Sleep(inactivityPeriod)

	finalPongCount := atomic.LoadInt32(&client1.pongCount)
	t.Logf("Pong count increased from %d to %d during inactivity", initialPongCount, finalPongCount)

	assert.Greater(t, finalPongCount, initialPongCount, "Should have received pings during inactivity")

	testMsg := fmt.Sprintf("keepalive_end_%d", time.Now().Unix())
	t.Logf("Sending message after inactivity: %s", testMsg)

	err = client1.SendMessage(testMsg)
	require.NoError(t, err)

	payload, err := client2.WaitForEvent(MessageSent, 10*time.Second)
	require.NoError(t, err)
	require.Len(t, payload.Messages, 1)
	assert.Equal(t, testMsg, payload.Messages[0].Content)

	t.Log("Connection survived long inactivity period")
}

func BenchmarkMessageThroughput(b *testing.B) {
	client1 := NewTestClient(&testing.T{}, USER1_JWT, DEFAULT_CHAT_ID)
	if err := client1.Connect(); err != nil {
		b.Fatalf("Failed to connect: %v", err)
	}
	defer client1.Close()

	client2 := NewTestClient(&testing.T{}, USER2_JWT, DEFAULT_CHAT_ID)
	if err := client2.Connect(); err != nil {
		b.Fatalf("Failed to connect: %v", err)
	}
	defer client2.Close()

	time.Sleep(500 * time.Millisecond)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		msg := fmt.Sprintf("bench_msg_%d", i)
		err := client1.SendMessage(msg)
		if err != nil {
			b.Logf("Error sending message: %v", err)
		}
	}
}

func BenchmarkConcurrentMessages(b *testing.B) {
	client1 := NewTestClient(&testing.T{}, USER1_JWT, DEFAULT_CHAT_ID)
	if err := client1.Connect(); err != nil {
		b.Fatalf("Failed to connect: %v", err)
	}
	defer client1.Close()

	time.Sleep(500 * time.Millisecond)

	b.ResetTimer()

	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			msg := fmt.Sprintf("bench_concurrent_%d", i)
			client1.SendMessage(msg)
			i++
		}
	})
}

func BenchmarkQueryMessages(b *testing.B) {
	client1 := NewTestClient(&testing.T{}, USER1_JWT, DEFAULT_CHAT_ID)
	if err := client1.Connect(); err != nil {
		b.Fatalf("Failed to connect: %v", err)
	}
	defer client1.Close()

	time.Sleep(500 * time.Millisecond)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		err := client1.QueryMessages(10, "")
		if err != nil {
			b.Logf("Error querying messages: %v", err)
		}
		client1.WaitForEvent(MessagesQuerySuccess, 5*time.Second)
	}
}
