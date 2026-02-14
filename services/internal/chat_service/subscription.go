package chatservice

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Subscription struct {
	pubsub  *redis.PubSub
	channel <-chan *redis.Message
	chatId  string
}

func (s *Store) Subscribe() *Subscription {
	s.ensureRedis()
	pubsub := s.rc.Subscribe(ctx, chatPubKey(s.chatId))

	channel := pubsub.Channel(
		redis.WithChannelHealthCheckInterval(30*time.Second),
		redis.WithChannelSendTimeout(10*time.Second),
	)

	return &Subscription{
		pubsub:  pubsub,
		channel: channel,
		chatId:  s.chatId,
	}
}

func (sub *Subscription) Channel() <-chan *redis.Message {
	return sub.channel
}

func (sub *Subscription) ReceiveEvent() (*PubSubEvent, error) {
	msg, ok := <-sub.channel
	if !ok {
		return nil, fmt.Errorf("subscription closed")
	}

	var event PubSubEvent
	if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
		return nil, fmt.Errorf("failed to parse event: %w", err)
	}

	return &event, nil
}

func (sub *Subscription) Close() error {
	return sub.pubsub.Close()
}
