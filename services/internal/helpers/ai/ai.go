package ai

import (
	"spark/internal/constants"
	"spark/internal/models"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/MelloB1989/karma/ai"
	"github.com/MelloB1989/karma/config"
	m "github.com/MelloB1989/karma/models"

	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

func CreateNewChat(userId string) (string, error) {
	chatORM := orm.Load(&models.AIChat{})
	defer chatORM.Close()

	aichat := &models.AIChat{
		Id:        utils.GenerateID(),
		UserId:    userId,
		Title:     "New Chat",
		CreatedAt: time.Now(),
	}

	err := chatORM.Insert(aichat)
	if err != nil {
		return "", err
	}

	chatORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:aichats:%s", userId))

	return aichat.Id, nil
}

func GetChatById(chatId, uid string) (*models.AIChat, error) {
	chatId = strings.TrimSpace(chatId)
	uid = strings.TrimSpace(uid)
	if chatId == "" || uid == "" {
		return nil, errors.New("chatId and uid are required")
	}

	chatORM := orm.Load(&models.AIChat{},
		orm.WithCacheKey(fmt.Sprintf("spark:aichat:%s", chatId)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")))
	defer chatORM.Close()

	var ac []models.AIChat
	err := chatORM.GetByFieldsEquals(map[string]any{
		"Id":     chatId,
		"UserId": uid,
	}).Scan(&ac)
	if err != nil {
		return nil, err
	}
	if len(ac) == 0 {
		return nil, errors.New("chat not found")
	}

	return &ac[0], nil
}

func GetAllChatsForUser(uid string) ([]models.AIChat, error) {
	uid = strings.TrimSpace(uid)
	if uid == "" {
		return nil, errors.New("uid is required")
	}

	chatORM := orm.Load(&models.AIChat{},
		orm.WithCacheKey(fmt.Sprintf("spark:aichats:%s", uid)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")))
	defer chatORM.Close()

	var chs []models.AIChat

	err := chatORM.GetByFieldsEquals(map[string]any{
		"UserId": uid,
	}).Scan(&chs)
	if err != nil {
		return nil, err
	}

	for i := range chs {
		chs[i].Messages = nil
	}

	return chs, nil
}

func UpdateChatTitle(chatId, uid string) (*models.AIChat, error) {
	kai := ai.NewKarmaAI(ai.Llama31_8B, ai.Groq, ai.WithMaxTokens(40), ai.WithSystemMessage(constants.AITitleGeneratorSystemPrompt))
	chatORM := orm.Load(&models.AIChat{},
		orm.WithCacheKey(fmt.Sprintf("spark:aichat:%s", chatId)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")))
	defer chatORM.Close()

	var chats []models.AIChat
	err := chatORM.GetByFieldsEquals(map[string]any{
		"Id":     chatId,
		"UserId": uid,
	}).Scan(&chats)
	if err != nil {
		return nil, err
	}
	if len(chats) == 0 {
		return nil, errors.New("chat not found")
	}

	chat := &chats[0]
	ch, err := json.MarshalIndent(chat.Messages, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal transcription result: %v", err)
	}
	resp, err := kai.GenerateFromSinglePrompt("Generate a title for following AI chat: " + string(ch))
	if err != nil {
		log.Fatalf("Failed to generate title: %v", err)
		return nil, err
	}
	chat.Title = resp.AIResponse

	if err := chatORM.Update(chat, chat.Id); err != nil {
		return nil, err
	}
	chatORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:aichat:%s", chatId))

	return chat, nil
}

func UpdateChatMessages(chatId, uid string, messages []m.AIMessage) (*models.AIChat, error) {
	chatORM := orm.Load(&models.AIChat{},
		orm.WithCacheKey(fmt.Sprintf("spark:aichat:%s", chatId)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")))
	defer chatORM.Close()

	var ac []models.AIChat
	if err := chatORM.GetByFieldsEquals(map[string]any{
		"Id":     chatId,
		"UserId": uid,
	}).Scan(&ac); err != nil {
		return nil, err
	}
	if len(ac) == 0 {
		return nil, errors.New("chat not found")
	}

	chat := &ac[0]
	chat.Messages = messages

	if err := chatORM.Update(chat, chat.Id); err != nil {
		return nil, err
	}
	chatORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:aichat:%s", chatId))
	return chat, nil
}

func UpdateChatMessageByID(chatId, uid, messageId string, newMsg m.AIMessage) (*models.AIChat, error) {
	chatORM := orm.Load(&models.AIChat{},
		orm.WithCacheKey(fmt.Sprintf("spark:aichat:%s", chatId)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")))
	defer chatORM.Close()

	var ac []models.AIChat
	if err := chatORM.GetByFieldsEquals(map[string]any{
		"Id":     chatId,
		"UserId": uid,
	}).Scan(&ac); err != nil {
		return nil, err
	}
	if len(ac) == 0 {
		return nil, errors.New("chat not found")
	}

	chat := &ac[0]
	found := false
	for i := range chat.Messages {
		if chat.Messages[i].UniqueId == messageId {
			if newMsg.Timestamp.IsZero() {
				newMsg.Timestamp = chat.Messages[i].Timestamp
			}
			chat.Messages[i] = newMsg
			found = true
			break
		}
	}
	if !found {
		return nil, errors.New("message not found")
	}

	if err := chatORM.Update(chat, chat.Id); err != nil {
		return nil, err
	}
	chatORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:aichat:%s", chatId))
	return chat, nil
}

func AppendChatMessage(chatId, uid string, msg m.AIMessage) (*models.AIChat, error) {
	chatORM := orm.Load(&models.AIChat{},
		orm.WithCacheKey(fmt.Sprintf("spark:aichat:%s", chatId)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")))
	defer chatORM.Close()

	var ac []models.AIChat
	if err := chatORM.GetByFieldsEquals(map[string]any{
		"Id":     chatId,
		"UserId": uid,
	}).Scan(&ac); err != nil {
		return nil, err
	}
	if len(ac) == 0 {
		return nil, errors.New("chat not found")
	}

	chat := &ac[0]

	if msg.UniqueId == "" {
		msg.UniqueId = strings.ToUpper(utils.GenerateID())
	}
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	chat.Messages = append(chat.Messages, msg)

	if err := chatORM.Update(chat, chat.Id); err != nil {
		return nil, err
	}
	chatORM.InvalidateCacheByPrefix(fmt.Sprintf("spark:aichat:%s", chatId))
	return chat, nil
}
