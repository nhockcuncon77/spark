package streaks

import (
	"spark/internal/helpers/pushnotify"
	"spark/internal/helpers/users"
	"spark/internal/models"
	"fmt"
	"log"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/orm"
	"github.com/MelloB1989/karma/utils"
)

// Milestone thresholds for streak notifications
var MilestoneThresholds = []int{7, 14, 30, 50, 100, 365}

// MilestoneInfo represents a streak milestone
type MilestoneInfo struct {
	Days      int
	Emoji     string
	Title     string
	Achieved  bool
	AchievedAt *time.Time
}

// GetMilestoneInfo returns milestone information for a streak count
func GetMilestoneInfo(streak int) []MilestoneInfo {
	milestones := []MilestoneInfo{
		{Days: 7, Emoji: "🔥", Title: "Week Warrior"},
		{Days: 14, Emoji: "🔥🔥", Title: "Two Week Champion"},
		{Days: 30, Emoji: "🔥🔥🔥", Title: "Monthly Master"},
		{Days: 50, Emoji: "⭐", Title: "Fifty Day Star"},
		{Days: 100, Emoji: "💯🔥", Title: "Century Streak"},
		{Days: 365, Emoji: "👑", Title: "Year Long Legend"},
	}

	for i := range milestones {
		milestones[i].Achieved = streak >= milestones[i].Days
	}

	return milestones
}

// GetOrCreateStreak gets an existing streak or creates a new one for a match
func GetOrCreateStreak(matchID string) (*models.MatchStreak, error) {
	streakORM := orm.Load(&models.MatchStreak{},
		orm.WithCacheKey(fmt.Sprintf("match_streak:%s", matchID)),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer streakORM.Close()

	var streaks []models.MatchStreak
	if err := streakORM.GetByFieldEquals("MatchId", matchID).Scan(&streaks); err != nil {
		return nil, err
	}

	if len(streaks) > 0 {
		return &streaks[0], nil
	}

	// Create new streak
	now := time.Now()
	streak := &models.MatchStreak{
		Id:              utils.GenerateID(),
		MatchId:         matchID,
		CurrentStreak:   0,
		LongestStreak:   0,
		LastMessageDate: nil,
		StreakStartDate: nil,
		SheLastMessage:  nil,
		HeLastMessage:   nil,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := streakORM.Insert(streak); err != nil {
		return nil, err
	}

	return streak, nil
}

// GetMatchStreak returns the streak for a match
func GetMatchStreak(matchID string) (*models.MatchStreak, error) {
	streakORM := orm.Load(&models.MatchStreak{},
		orm.WithCacheKey(fmt.Sprintf("match_streak:%s", matchID)),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer streakORM.Close()

	var streaks []models.MatchStreak
	if err := streakORM.GetByFieldEquals("MatchId", matchID).Scan(&streaks); err != nil {
		return nil, err
	}

	if len(streaks) == 0 {
		return nil, nil
	}

	return &streaks[0], nil
}

// UpdateStreakOnMessage updates the streak when a message is sent
// Returns the new streak count and whether a milestone was reached
func UpdateStreakOnMessage(matchID string, senderID string, isShe bool) (int, bool, error) {
	streak, err := GetOrCreateStreak(matchID)
	if err != nil {
		return 0, false, err
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Update sender's last message time
	if isShe {
		streak.SheLastMessage = &now
	} else {
		streak.HeLastMessage = &now
	}

	// Calculate if streak should update
	shouldUpdateStreak := false
	previousStreak := streak.CurrentStreak

	if streak.LastMessageDate == nil {
		// First message ever - start the streak
		shouldUpdateStreak = true
		streak.StreakStartDate = &now
		streak.CurrentStreak = 1
	} else {
		lastDate := time.Date(
			streak.LastMessageDate.Year(),
			streak.LastMessageDate.Month(),
			streak.LastMessageDate.Day(),
			0, 0, 0, 0, now.Location(),
		)

		daysSinceLastMessage := int(today.Sub(lastDate).Hours() / 24)

		switch {
		case daysSinceLastMessage == 0:
			// Same day - no streak change
		case daysSinceLastMessage == 1:
			// Next day - check if both parties have messaged
			// For a streak to increment, we need messages from both parties
			if streak.SheLastMessage != nil && streak.HeLastMessage != nil {
				sheDate := time.Date(
					streak.SheLastMessage.Year(),
					streak.SheLastMessage.Month(),
					streak.SheLastMessage.Day(),
					0, 0, 0, 0, now.Location(),
				)
				heDate := time.Date(
					streak.HeLastMessage.Year(),
					streak.HeLastMessage.Month(),
					streak.HeLastMessage.Day(),
					0, 0, 0, 0, now.Location(),
				)
				// If both messaged today or yesterday, increment streak
				if (sheDate.Equal(today) || sheDate.Equal(today.AddDate(0, 0, -1))) &&
					(heDate.Equal(today) || heDate.Equal(today.AddDate(0, 0, -1))) {
					shouldUpdateStreak = true
					streak.CurrentStreak++
				}
			}
		default:
			// More than 1 day - streak broken, reset
			streak.CurrentStreak = 1
			streak.StreakStartDate = &now
			shouldUpdateStreak = true
		}
	}

	streak.LastMessageDate = &now
	streak.UpdatedAt = now

	// Update longest streak
	if streak.CurrentStreak > streak.LongestStreak {
		streak.LongestStreak = streak.CurrentStreak
	}

	// Save streak
	streakORM := orm.Load(&models.MatchStreak{})
	defer streakORM.Close()
	if err := streakORM.Update(streak, streak.Id); err != nil {
		return streak.CurrentStreak, false, err
	}

	// Check for milestone
	milestoneReached := false
	if shouldUpdateStreak && streak.CurrentStreak > previousStreak {
		for _, threshold := range MilestoneThresholds {
			if streak.CurrentStreak == threshold {
				milestoneReached = true
				break
			}
		}
	}

	return streak.CurrentStreak, milestoneReached, nil
}

// SendMilestoneNotifications sends streak milestone notifications to both users
func SendMilestoneNotifications(matchID string, streak int) {
	go func() {
		// Get match to find both users
		matchORM := orm.Load(&models.Match{})
		defer matchORM.Close()

		var matches []models.Match
		if err := matchORM.GetByFieldEquals("Id", matchID).Scan(&matches); err != nil || len(matches) == 0 {
			log.Printf("[Streak] Failed to get match for milestone notification: %v", err)
			return
		}

		match := matches[0]

		// Get user names
		sheUser, _ := users.GetUserByID(match.SheId)
		heUser, _ := users.GetUserByID(match.HeId)

		sheName := "Your match"
		heName := "Your match"
		if sheUser != nil {
			sheName = sheUser.FirstName
		}
		if heUser != nil {
			heName = heUser.FirstName
		}

		// Send to both users
		pushnotify.SendStreakMilestoneNotification(match.SheId, heName, streak, matchID)
		pushnotify.SendStreakMilestoneNotification(match.HeId, sheName, streak, matchID)
	}()
}

// GetUserStreaks returns all active streaks for a user
func GetUserStreaks(userID string) ([]models.MatchStreak, error) {
	// First get all user's matches
	matchORM := orm.Load(&models.Match{})
	defer matchORM.Close()

	var allMatches []models.Match

	// Get matches where user is she
	var sheMatches []models.Match
	if err := matchORM.GetByFieldEquals("SheId", userID).Scan(&sheMatches); err == nil {
		allMatches = append(allMatches, sheMatches...)
	}

	// Get matches where user is he
	var heMatches []models.Match
	if err := matchORM.GetByFieldEquals("HeId", userID).Scan(&heMatches); err == nil {
		allMatches = append(allMatches, heMatches...)
	}

	if len(allMatches) == 0 {
		return []models.MatchStreak{}, nil
	}

	// Get streaks for all matches
	var activeStreaks []models.MatchStreak
	for _, match := range allMatches {
		streak, err := GetMatchStreak(match.Id)
		if err != nil || streak == nil {
			continue
		}
		if streak.CurrentStreak > 0 {
			activeStreaks = append(activeStreaks, *streak)
		}
	}

	return activeStreaks, nil
}

// GetUserStreakStats returns aggregate streak statistics for a user
func GetUserStreakStats(userID string) (totalActive int, longestEver int, err error) {
	streaks, err := GetUserStreaks(userID)
	if err != nil {
		return 0, 0, err
	}

	for _, streak := range streaks {
		if streak.CurrentStreak > 0 {
			totalActive++
		}
		if streak.LongestStreak > longestEver {
			longestEver = streak.LongestStreak
		}
	}

	return totalActive, longestEver, nil
}

// CalculateHoursRemaining calculates hours until streak breaks (24 hours from last message)
func CalculateHoursRemaining(streak *models.MatchStreak) *int {
	if streak == nil || streak.LastMessageDate == nil || streak.CurrentStreak == 0 {
		return nil
	}

	now := time.Now()
	deadline := streak.LastMessageDate.Add(48 * time.Hour) // 48 hours to maintain streak
	remaining := deadline.Sub(now)

	if remaining <= 0 {
		return nil // Streak already broken
	}

	hours := int(remaining.Hours())
	return &hours
}

// IsStreakAtRisk returns true if less than 4 hours remaining
func IsStreakAtRisk(streak *models.MatchStreak) bool {
	hours := CalculateHoursRemaining(streak)
	return hours != nil && *hours < 4
}
