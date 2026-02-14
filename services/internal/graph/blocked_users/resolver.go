package blocked_users

import (
	"spark/internal/graph/model"
	"spark/internal/models"
	"context"
	"time"

	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

type Resolver struct{}

func NewResolver() *Resolver {
	return &Resolver{}
}

// BlockUser blocks a user from the authenticated user's perspective
func (r *Resolver) BlockUser(ctx context.Context, targetUserId string) (bool, error) {
	uid := ctx.Value("uid").(string)

	// Check if already blocked
	isBlocked, err := r.IsUserBlocked(ctx, targetUserId)
	if err != nil {
		return false, err
	}
	if isBlocked {
		return true, nil // Already blocked
	}

	// Create blocked user record
	blockedUser := models.BlockedUser{
		Id:            utils.GenerateID(7),
		UserId:        uid,
		BlockedUserId: targetUserId,
		CreatedAt:     time.Now(),
	}

	blockedORM := orm.Load(&models.BlockedUser{})
	defer blockedORM.Close()

	if err := blockedORM.Insert(&blockedUser); err != nil {
		return false, err
	}

	return true, nil
}

// UnblockUser unblocks a user
func (r *Resolver) UnblockUser(ctx context.Context, targetUserId string) (bool, error) {
	uid := ctx.Value("uid").(string)

	blockedORM := orm.Load(&models.BlockedUser{})
	defer blockedORM.Close()

	// Find the blocked user record
	var blocked []models.BlockedUser
	if err := blockedORM.GetByFieldEquals("UserId", uid).Scan(&blocked); err != nil {
		return false, err
	}

	for _, b := range blocked {
		if b.BlockedUserId == targetUserId {
			if _, err := blockedORM.DeleteByPrimaryKey(b.Id); err != nil {
				return false, err
			}
			break
		}
	}

	return true, nil
}

// IsUserBlocked checks if a user is blocked by the authenticated user
func (r *Resolver) IsUserBlocked(ctx context.Context, targetUserId string) (bool, error) {
	uid := ctx.Value("uid").(string)

	blockedORM := orm.Load(&models.BlockedUser{})
	defer blockedORM.Close()

	var blocked []models.BlockedUser
	if err := blockedORM.GetByFieldEquals("UserId", uid).Scan(&blocked); err != nil {
		return false, err
	}

	for _, b := range blocked {
		if b.BlockedUserId == targetUserId {
			return true, nil
		}
	}

	return false, nil
}

// BlockedUsers returns all users blocked by the authenticated user
func (r *Resolver) BlockedUsers(ctx context.Context) ([]*model.UserPublic, error) {
	uid := ctx.Value("uid").(string)

	blockedORM := orm.Load(&models.BlockedUser{})
	defer blockedORM.Close()

	var blocked []models.BlockedUser
	if err := blockedORM.GetByFieldEquals("UserId", uid).Scan(&blocked); err != nil {
		return nil, err
	}

	// Get user details for each blocked user
	var blockedUsers []*model.UserPublic
	for _, b := range blocked {
		usersORM := orm.Load(&models.User{})
		var users []models.User
		if err := usersORM.GetByFieldEquals("Id", b.BlockedUserId).Scan(&users); err != nil {
			usersORM.Close()
			continue
		}
		usersORM.Close()

		if len(users) > 0 {
			user := users[0]
			// Convert personality traits
			var traits []*model.PersonalityTrait
			for k, v := range user.PersonalityTraits {
				traits = append(traits, &model.PersonalityTrait{Key: k, Value: int32(v)})
			}

			blockedUsers = append(blockedUsers, &model.UserPublic{
				ID:                user.Id,
				Name:              user.FirstName + " " + user.LastName,
				Pfp:               user.Pfp,
				Bio:               user.Bio,
				Dob:               user.Dob.Format("2006-01-02"),
				Gender:            user.Gender,
				Hobbies:           user.Hobbies,
				Interests:         user.Interests,
				UserPrompts:       user.UserPrompts,
				PersonalityTraits: traits,
				Photos:            user.Photos,
				IsVerified:        user.IsVerified,
				CreatedAt:         user.CreatedAt,
				IsOnline:          false,
				IsLocked:          true,
				IsPoked:           false,
				ChatID:            "",
			})
		}
	}

	return blockedUsers, nil
}
