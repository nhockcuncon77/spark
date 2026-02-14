package users

import (
	"spark/internal/graph/model"
	"spark/internal/models"
	"time"
)

func ToUserPublic(d models.User) *model.UserPublic {
	pt := make([]*model.PersonalityTrait, 0)
	for k, v := range d.PersonalityTraits {
		pt = append(pt, &model.PersonalityTrait{
			Key:   k,
			Value: int32(v),
		})
	}

	return &model.UserPublic{
		ID:                d.Id,
		Name:              d.FirstName + " " + d.LastName,
		Pfp:               d.Pfp,
		Bio:               d.Bio,
		Dob:               d.Dob.Format(time.RFC3339),
		Gender:            d.Gender,
		Hobbies:           d.Hobbies,
		Interests:         d.Interests,
		UserPrompts:       d.UserPrompts,
		PersonalityTraits: pt,
		Photos:            d.Photos,
		IsVerified:        d.IsVerified,
		Extra:             &d.Extra,
		CreatedAt:         d.CreatedAt,
		IsOnline:          false,
	}
}
