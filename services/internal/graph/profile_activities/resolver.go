package profileactivities

import (
	"spark/internal/anal"
	"spark/internal/graph/directives"
	"spark/internal/graph/model"
	"spark/internal/helpers/notifications"
	"spark/internal/helpers/users"
	"spark/internal/models"
	"context"
	"fmt"
	"time"

	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

type Resolver struct {
}

func NewResolver() *Resolver {
	return &Resolver{}
}

func (r *Resolver) CreateProfileActivity(ctx context.Context, typeArg models.ActivityType, targetUserID string) (*models.UserProfileActivity, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	profileActivity := &models.UserProfileActivity{
		UserId:    claims.UserID,
		Id:        utils.GenerateID(10),
		Type:      models.ActivityType(typeArg),
		TargetId:  targetUserID,
		CreatedAt: time.Now(),
	}

	activityORM := orm.Load(&models.UserProfileActivity{})
	defer activityORM.Close()

	var ac []models.UserProfileActivity
	if err := activityORM.GetByFieldsEquals(map[string]any{
		"UserId":   claims.UserID,
		"TargetId": targetUserID,
		"Type":     typeArg,
	}).Scan(&ac); err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to get user profile activities: %w", err)
	}
	if len(ac) > 0 {
		return nil, fmt.Errorf("activity already exists")
	}

	if err := activityORM.Insert(profileActivity); err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to create profile activity: %w", err)
	}

	if typeArg == models.POKE {
		go func() {
			ae.SetProperty(anal.TARGET_USER_ID, targetUserID)
			ae.SendEvent(anal.USER_POKED)
		}()
		// Send poke email notification
		notifications.SendPokeNotification(targetUserID, claims.UserID)
	}

	if typeArg == models.PROFILE_VIEW {
		// Send profile viewed email notification
		notifications.SendProfileViewedNotification(targetUserID, claims.UserID)
	}

	return profileActivity, nil
}

func (r *Resolver) ProfileActivities(ctx context.Context, class *model.ActivityClass) ([]*models.UserProfileActivity, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	activityORM := orm.Load(&models.UserProfileActivity{})
	defer activityORM.Close()

	query := `
SELECT *
FROM user_profile_activities
WHERE user_id = $1 OR target_id = $1
ORDER BY created_at DESC
`
	qr := activityORM.QueryRaw(query, claims.UserID)

	var all []*models.UserProfileActivity
	if err := qr.Scan(&all); err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to fetch profile activities: %w", err)
	}

	// Helper function to check if the related user exists
	userExists := func(a *models.UserProfileActivity) bool {
		if a == nil {
			return false
		}
		// Determine which user ID to check based on the activity
		var userIdToCheck string
		if claims.UserID == a.TargetId {
			userIdToCheck = a.UserId
		} else {
			userIdToCheck = a.TargetId
		}
		_, err := users.GetUserById(userIdToCheck)
		return err == nil
	}

	if class == nil {
		if all == nil {
			return []*models.UserProfileActivity{}, nil
		}
		// Filter out activities where the related user doesn't exist
		var validActivities []*models.UserProfileActivity
		for _, a := range all {
			if userExists(a) {
				validActivities = append(validActivities, a)
			}
		}
		if validActivities == nil {
			return []*models.UserProfileActivity{}, nil
		}
		return validActivities, nil
	}

	var filtered []*models.UserProfileActivity
	switch *class {
	case model.ActivityClassReceived:
		for _, a := range all {
			if a.TargetId == claims.UserID && userExists(a) {
				filtered = append(filtered, a)
			}
		}
	case model.ActivityClassSent:
		for _, a := range all {
			if a.UserId == claims.UserID && userExists(a) {
				filtered = append(filtered, a)
			}
		}
	default:
		return []*models.UserProfileActivity{}, nil
	}

	if filtered == nil {
		return []*models.UserProfileActivity{}, nil
	}
	return filtered, nil
}
