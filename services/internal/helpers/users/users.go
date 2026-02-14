package users

import (
	"spark/internal/graph/model"
	"spark/internal/models"
	"fmt"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

func CreateUser(user models.User) (*models.User, error) {
	if user.Id == "" {
		user.Id = utils.GenerateID(7)
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	usersORM := orm.Load(&models.User{})
	defer usersORM.Close()

	if err := usersORM.Insert(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserById(id string) (*models.User, error) {
	usersORM := orm.Load(&models.User{},
		orm.WithCacheKey(fmt.Sprintf("user-%s", id)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer usersORM.Close()

	var u []models.User
	if err := usersORM.GetByFieldEquals("Id", id).Scan(&u); err != nil {
		return nil, err
	}
	if len(u) == 0 {
		return nil, fmt.Errorf("user not found")
	}
	user := u[0]

	return &user, nil
}

// GetUserByID is an alias for GetUserById
func GetUserByID(id string) (*models.User, error) {
	return GetUserById(id)
}

func GetUserByEmail(email string) (*models.User, error) {
	usersORM := orm.Load(&models.User{},
		orm.WithCacheKey(fmt.Sprintf("user-email-%s", email)),
		orm.WithCacheOn(true),
		orm.WithCacheTTL(5*time.Minute),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer usersORM.Close()

	var u []models.User
	if err := usersORM.GetByFieldEquals("Email", email).Scan(&u); err != nil {
		return nil, err
	}
	if len(u) == 0 {
		return nil, fmt.Errorf("user not found")
	}
	return &u[0], nil
}

func GetUserPublicById(id string, queryUser ...string) (*model.UserPublic, error) {
	usersORM := orm.Load(&models.User{},
		orm.WithCacheKey(fmt.Sprintf("user-%s", id)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer usersORM.Close()

	var u []models.User
	if err := usersORM.GetByFieldEquals("Id", id).Scan(&u); err != nil {
		return nil, err
	}
	if len(u) == 0 {
		return nil, fmt.Errorf("user not found")
	}
	user := u[0]

	userPublic := ToUserPublic(user)
	userPublic.IsLocked = true
	userPublic.IsPoked = false
	userPublic.ChatID = ""

	if len(queryUser) > 0 && queryUser[0] != "" {
		queryUserID := queryUser[0]

		relationQuery := `
			SELECT
				m.id as match_id,
				c.id as chat_id,
				CASE WHEN upa.id IS NOT NULL THEN true ELSE false END as is_poked,
				COALESCE(m.is_unlocked, false) as is_unlocked
			FROM (
				SELECT $1::varchar as user_id, $2::varchar as query_user_id
			) params
			LEFT JOIN matches m ON (
				(m.she_id = params.user_id AND m.he_id = params.query_user_id) OR
				(m.he_id = params.user_id AND m.she_id = params.query_user_id)
			)
			LEFT JOIN chats c ON c.match_id = m.id
			LEFT JOIN user_profile_activities upa ON (
				upa.user_id = params.query_user_id AND
				upa.target_id = params.user_id AND
				upa.type = 'POKE'
			)
			LIMIT 1
		`

		type RelationData struct {
			MatchID    *string `json:"match_id"`
			ChatID     *string `json:"chat_id"`
			IsPoked    bool    `json:"is_poked"`
			IsUnlocked bool    `json:"is_unlocked"`
		}

		var relationResult []RelationData
		if err := usersORM.QueryRaw(relationQuery, id, queryUserID).Scan(&relationResult); err == nil {
			if len(relationResult) > 0 {
				result := relationResult[0]

				if result.MatchID != nil && *result.MatchID != "" {
					// Use the actual unlock status from the match
					userPublic.IsLocked = !result.IsUnlocked

					if result.ChatID != nil {
						userPublic.ChatID = *result.ChatID
					}
				}

				userPublic.IsPoked = result.IsPoked
			}
		}
	}

	// Enforce blurred photos if locked
	if userPublic.IsLocked {
		if len(user.BlurredPhotos) > 0 {
			userPublic.Photos = user.BlurredPhotos
			// Also blur the PFP
			userPublic.Pfp = user.BlurredPhotos[0]
		}
	}

	return userPublic, nil
}

func UpdateUser(user models.User) (*models.User, error) {
	usersORM := orm.Load(&models.User{})
	defer usersORM.Close()

	if err := usersORM.Update(&user, user.Id); err != nil {
		return nil, err
	}
	usersORM.InvalidateCacheByPrefix(fmt.Sprintf("user-%s", user.Id))

	return &user, nil
}

func GetUserActivities(userId string, activityType ...models.ActivityType) ([]models.UserProfileActivity, error) {
	activitiesORM := orm.Load(&models.UserProfileActivity{})
	defer activitiesORM.Close()

	var activities []models.UserProfileActivity
	if err := activitiesORM.GetByFieldEquals("UserId", userId).Scan(&activities); err != nil {
		return nil, err
	}

	if len(activityType) > 0 {
		filteredActivities := make([]models.UserProfileActivity, 0)
		for _, activity := range activities {
			for _, t := range activityType {
				if activity.Type == t {
					filteredActivities = append(filteredActivities, activity)
				}
			}
		}
		activities = filteredActivities
	}

	return activities, nil
}
