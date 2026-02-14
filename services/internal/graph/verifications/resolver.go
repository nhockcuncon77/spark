package verifications

import (
	"spark/internal/anal"
	"spark/internal/graph/directives"
	"spark/internal/graph/model"
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

func (r *Resolver) CreateVerification(ctx context.Context, input model.UserVerificationInput) (*models.UserVerification, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}
	if input.Media == nil {
		return nil, fmt.Errorf("media is required")
	}
	verificationORM := orm.Load(&models.UserVerification{})
	defer verificationORM.Close()

	now := time.Now()

	verification := &models.UserVerification{
		Id:        utils.GenerateID(),
		UserId:    claims.UserID,
		Status:    "requested",
		CreatedAt: now,
		UpdatedAt: now,
	}

	for _, m := range input.Media {
		if m == nil {
			return nil, fmt.Errorf("media is required")
		}
		media := models.Media{
			Type:      string(m.Type),
			Url:       m.URL,
			CreatedAt: now,
		}
		verification.Media = append(verification.Media, media)
	}

	if err := verificationORM.Insert(verification); err != nil {
		return nil, fmt.Errorf("failed to create verification: %w", err)
	}

	return verification, nil
}

func (r *Resolver) GetUserVerificationStatus(ctx context.Context) (*models.UserVerification, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}
	verificationORM := orm.Load(&models.UserVerification{})
	defer verificationORM.Close()

	var vr []models.UserVerification
	if err := verificationORM.GetByFieldEquals("UserId", claims.UserID); err != nil {
		return nil, fmt.Errorf("failed to get verification status: %w", err)
	}
	if len(vr) == 0 {
		return nil, fmt.Errorf("no verification status found")
	}
	return &vr[0], nil
}
