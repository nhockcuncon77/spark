package users

import (
	"spark/internal/anal"
	"spark/internal/auth"
	"spark/internal/auth/native"
	"spark/internal/auth/workos"
	"spark/internal/blurer"
	"spark/internal/graph/directives"
	"spark/internal/graph/model"
	"spark/internal/helpers/users"
	"spark/internal/mailer"
	"spark/internal/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/database"
	"github.com/MelloB1989/karma/utils"
)

type Resolver struct{}

func NewResolver() *Resolver {
	return &Resolver{}
}

func (r *Resolver) CreateUser(ctx context.Context, input model.CreateUserInput) (*model.AuthPayload, error) {
	var payload *model.AuthPayload
	var err error

	switch config.GetEnvRaw("SPARK_AUTH_SERVICE") {
	case "workos":
		payload, err = workos.NewWorkosAuth().CreateUser(input)
	default:
		return nil, fmt.Errorf("invalid auth service")
	}

	if err == nil && payload != nil && payload.User != nil {
		go func() {
			analyticsClient := anal.CreateAnalytics(payload.User.Id)
			analyticsClient.SendEvent(anal.USER_SIGNUP)
		}()
	}

	return payload, err
}

func (r *Resolver) LoginWithPassword(ctx context.Context, email string, password string) (*model.AuthPayload, error) {
	var payload *model.AuthPayload
	var err error

	switch config.GetEnvRaw("SPARK_AUTH_SERVICE") {
	case "workos":
		payload, err = workos.NewWorkosAuth().LoginWithPassword(email, password)
	case "native":
		payload, err = native.NewNativeAuth().LoginWithPassword(email, password)
	default:
		return nil, fmt.Errorf("invalid auth service (set SPARK_AUTH_SERVICE to workos or native)")
	}

	if err == nil && payload != nil && payload.User != nil {
		go func() {
			analyticsClient := anal.CreateAnalytics(payload.User.Id)
			analyticsClient.SendEvent(anal.USER_LOGIN)
		}()
	}

	return payload, err
}

func (r *Resolver) RequestEmailLoginCode(ctx context.Context, email string) (bool, error) {
	switch config.GetEnvRaw("SPARK_AUTH_SERVICE") {
	case "workos":
		return workos.NewWorkosAuth().RequestEmailLoginCode(email)
	default:
		return false, fmt.Errorf("invalid auth service")
	}
}

func (r *Resolver) VerifyEmailLoginCode(ctx context.Context, email string, code string) (*model.AuthPayload, error) {
	switch config.GetEnvRaw("SPARK_AUTH_SERVICE") {
	case "workos":
		return workos.NewWorkosAuth().VerifyEmailLoginCode(email, code)
	case "native":
		return native.NewNativeAuth().VerifyEmailLoginCode(email, code)
	default:
		return nil, fmt.Errorf("invalid auth service (set SPARK_AUTH_SERVICE to workos or native)")
	}
}

func (r *Resolver) UpdateMe(ctx context.Context, input model.UpdateUserInput) (*models.User, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	user, err := users.GetUserById(claims.UserID)
	if err != nil {
		return nil, err
	}

	if input.FirstName != nil {
		user.FirstName = *input.FirstName
	}
	if input.LastName != nil {
		user.LastName = *input.LastName
	}
	if input.Dob != nil {
		user.Dob = *input.Dob
	}
	if input.Bio != nil {
		user.Bio = *input.Bio
	}
	if input.Pfp != nil {
		user.Pfp = *input.Pfp
	}
	if input.Address != nil {
		user.Address.City = input.Address.City
		user.Address.State = input.Address.State
		user.Address.Country = input.Address.Country
	}
	if len(input.Interests) > 0 {
		user.Interests = input.Interests
	}
	if len(input.Hobbies) > 0 {
		user.Hobbies = input.Hobbies
	}
	if len(input.UserPrompts) > 0 {
		user.UserPrompts = input.UserPrompts
	}
	if len(input.Photos) > 0 {
		user.Photos = input.Photos
		// Sync pfp with first photo
		user.Pfp = input.Photos[0]
		// Generate blurred versions in background
		go func(photos []string, userId string) {
			blurred, err := blurer.BlurPhotos(photos, userId)
			if err != nil {
				log.Printf("[WARN] Failed to blur photos: %v", err)
				return
			}
			// Update blurred photos in DB
			db, dbErr := database.PostgresConn()
			if dbErr != nil {
				log.Printf("[ERROR] Failed to connect to database for blur update: %v", dbErr)
				return
			}
			defer db.Close()
			blurredJSON, _ := json.Marshal(blurred)
			_, err = db.Exec("UPDATE users SET blurred_photos = $1 WHERE id = $2", blurredJSON, userId)
			if err != nil {
				log.Printf("[ERROR] Failed to update blurred photos: %v", err)
			}
		}(input.Photos, claims.UserID)
	}
	if len(input.PersonalityTraits) > 0 {
		pt := make(map[string]int)
		for _, trait := range input.PersonalityTraits {
			if trait != nil {
				pt[trait.Key] = int(trait.Value)
			}
		}
		user.PersonalityTraits = pt
	}
	if input.Extra != nil {
		if input.Extra.School != nil {
			user.Extra.School = *input.Extra.School
		}
		if input.Extra.Work != nil {
			user.Extra.Work = *input.Extra.Work
		}
		if len(input.Extra.LookingFor) > 0 {
			user.Extra.LookingFor = input.Extra.LookingFor
		}
		if input.Extra.Zodiac != nil {
			user.Extra.Zodiac = *input.Extra.Zodiac
		}
		if len(input.Extra.Languages) > 0 {
			user.Extra.Languages = input.Extra.Languages
		}
		if input.Extra.Excercise != nil {
			user.Extra.Excercise = *input.Extra.Excercise
		}
		if input.Extra.Drinking != nil {
			user.Extra.Drinking = *input.Extra.Drinking
		}
		if input.Extra.Smoking != nil {
			user.Extra.Smoking = *input.Extra.Smoking
		}
		if input.Extra.Kids != nil {
			user.Extra.Kids = *input.Extra.Kids
		}
		if input.Extra.Religion != nil {
			user.Extra.Religion = *input.Extra.Religion
		}
		if input.Extra.Ethnicity != nil {
			user.Extra.Ethnicity = *input.Extra.Ethnicity
		}
		if input.Extra.Sexuality != nil {
			user.Extra.Sexuality = *input.Extra.Sexuality
		}
	}

	return users.UpdateUser(*user)
}

func (r *Resolver) RefreshToken(ctx context.Context) (*model.AuthPayload, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	fu, err := users.GetUserById(claims.UserID)
	if err != nil || fu == nil {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("user not found")
	}

	t, err := auth.CreateJWT(*fu)
	if err != nil {
		return nil, err
	}

	ap := &model.AuthPayload{
		AccessToken: t,
		User:        fu,
	}

	return ap, nil
}

func (r *Resolver) Me(ctx context.Context) (*models.User, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	fu, err := users.GetUserById(claims.UserID)
	if err != nil || fu == nil {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("user not found")
	}

	return fu, nil
}

func (r *Resolver) User(ctx context.Context, id string) (*model.UserPublic, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	fu, err := users.GetUserPublicById(id, claims.UserID)
	if err != nil || fu == nil {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("user not found")
	}

	return fu, nil
}

// RequestAccountDeletion initiates account deletion by sending a confirmation code to the user's email
func (r *Resolver) RequestAccountDeletion(ctx context.Context) (bool, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return false, fmt.Errorf("unauthorized: %w", err)
	}

	user, err := users.GetUserById(claims.UserID)
	if err != nil {
		return false, err
	}

	// Generate a 6-digit confirmation code
	code := utils.GenerateOTP()

	// Store code in Redis with 15 min expiry (using user ID as key)
	redisClient := utils.RedisConnect()
	redisKey := fmt.Sprintf("account_deletion:%s", claims.UserID)
	err = redisClient.Set(ctx, redisKey, code, 15*60*1000000000).Err() // 15 minutes in nanoseconds
	if err != nil {
		return false, fmt.Errorf("failed to store deletion code: %w", err)
	}

	// Send email with confirmation code
	if err := mailer.AccountDeletion(user.Email, code).Send(); err != nil {
		fmt.Printf("Warning: failed to send deletion email to %s: %v\n", user.Email, err)
		// Don't fail the request if email fails - code is still stored in Redis
	}

	return true, nil
}

// DeleteAccount permanently deletes the user's account and all associated data
func (r *Resolver) DeleteAccount(ctx context.Context, confirmationCode string) (bool, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return false, fmt.Errorf("unauthorized: %w", err)
	}

	// Verify the confirmation code
	redisClient := utils.RedisConnect()
	redisKey := fmt.Sprintf("account_deletion:%s", claims.UserID)
	storedCode, err := redisClient.Get(ctx, redisKey).Result()
	if err != nil {
		return false, fmt.Errorf("no deletion request found or code expired")
	}

	if storedCode != confirmationCode {
		return false, fmt.Errorf("invalid confirmation code")
	}

	// Delete user data from all tables using raw SQL
	db, err := database.PostgresConn()
	if err != nil {
		return false, fmt.Errorf("database connection failed: %w", err)
	}

	tables := []string{
		"posts",
		"comments",
		"swipes",
		"reports",
		"user_profile_activities",
		"user_verifications",
		"blocked_users",
		"user_files",
		"aichat_chats",
	}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM %s WHERE user_id = $1", table)
		_, err := db.Exec(query, claims.UserID)
		if err != nil {
			fmt.Printf("Warning: failed to delete from %s: %v\n", table, err)
		}
	}

	// Delete matches where user is either party
	_, _ = db.Exec("DELETE FROM matches WHERE she_id = $1 OR he_id = $1", claims.UserID)

	// Delete the user record
	_, err = db.Exec("DELETE FROM users WHERE id = $1", claims.UserID)
	if err != nil {
		return false, fmt.Errorf("failed to delete user: %w", err)
	}

	// Delete Redis code
	redisClient.Del(ctx, redisKey)

	return true, nil
}
