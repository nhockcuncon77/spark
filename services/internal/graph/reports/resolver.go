package reports

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

func (r *Resolver) CreateReport(ctx context.Context, input model.CreateReportInput) (*models.Report, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	now := time.Now()

	reportORM := orm.Load(&models.Report{})
	defer reportORM.Close()

	report := &models.Report{
		Id:        utils.GenerateID(10),
		UserId:    claims.UserID,
		TargetId:  input.TargetID,
		CreatedAt: now,
		UpdatedAt: now,
		Reason:    input.Reason,
	}

	if input.AdditionalInfo != nil {
		report.AdditionalInfo = *input.AdditionalInfo
	}
	if len(input.Media) > 0 {
		for _, media := range input.Media {
			report.Media = append(report.Media, models.Media{
				Id:        utils.GenerateID(10),
				CreatedAt: now,
				Type:      string(media.Type),
				Url:       media.URL,
			})
		}
	}

	err = reportORM.Insert(report)
	if err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to create report: %w", err)
	}

	return report, nil
}
