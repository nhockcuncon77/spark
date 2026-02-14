package socketstate

import (
	"spark/internal/anal"
	"context"
	"fmt"
	"time"

	"github.com/MelloB1989/karma/utils"
	"github.com/redis/go-redis/v9"
)

type PublicUserState struct {
	uid   string
	redis *redis.Client
}

func NewPublicUserState(uid string) *PublicUserState {
	return &PublicUserState{
		uid:   uid,
		redis: utils.RedisConnect(),
	}
}

func (s *PublicUserState) GetOnlineStatus() (bool, error) {
	status, err := s.redis.Get(context.Background(), fmt.Sprintf("user:%s:online", s.uid)).Bool()
	if err != nil {
		if err == redis.Nil {
			return false, nil
		}
		return false, err
	}
	return status, nil
}

func (s *PublicUserState) SetOnlineStatus(status bool) error {
	ctx := context.Background()

	// Check previous status to avoid duplicate events
	prevStatus, _ := s.redis.Get(ctx, fmt.Sprintf("user:%s:online", s.uid)).Bool()

	if prevStatus != status {
		go func() {
			analyticsClient := anal.CreateAnalytics(s.uid)
			if status {
				analyticsClient.SendEvent(anal.USER_ONLINE)
			} else {
				analyticsClient.SendEvent(anal.USER_OFFLINE)
			}
		}()
	}

	if status {
		return s.redis.Set(ctx, fmt.Sprintf("user:%s:online", s.uid), "true", time.Minute*6).Err()
	}
	return s.redis.Set(ctx, fmt.Sprintf("user:%s:online", s.uid), "false", time.Minute*6).Err()
}

func (s *PublicUserState) GetOtherUserOnlineStatus(uid string) (bool, error) {
	status, err := s.redis.Get(context.Background(), fmt.Sprintf("user:%s:online", uid)).Bool()
	if err != nil {
		if err == redis.Nil {
			return false, nil
		}
		return false, err
	}
	return status, nil
}
