package shared

import (
	"spark/internal/graph/model"
	"spark/internal/models"
	"encoding/json"
	"fmt"
	"time"
)

type FlexibleTime time.Time

func (ft *FlexibleTime) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if s == "" {
		*ft = FlexibleTime(time.Time{})
		return nil
	}

	formats := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05.999999",
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05.999999",
		"2006-01-02 15:04:05",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			*ft = FlexibleTime(t)
			return nil
		}
	}

	return fmt.Errorf("unable to parse time: %s", s)
}

func (ft FlexibleTime) Time() time.Time {
	return time.Time(ft)
}

type DBUserProfile struct {
	ID                string                `json:"id"`
	FirstName         string                `json:"first_name"`
	LastName          string                `json:"last_name"`
	Email             string                `json:"email"`
	Dob               string                `json:"dob"`
	Gender            string                `json:"gender"`
	Pfp               string                `json:"pfp"`
	Bio               string                `json:"bio"`
	Hobbies           []string              `json:"hobbies"`
	Interests         []string              `json:"interests"`
	UserPrompts       []string              `json:"user_prompts"`
	PersonalityTraits map[string]int        `json:"personality_traits"`
	Photos            []string              `json:"photos"`
	BlurredPhotos     []string              `json:"blurred_photos"`
	IsVerified        bool                  `json:"is_verified"`
	Extra             *models.ExtraMetadata `json:"extra"`
	CreatedAt         FlexibleTime          `json:"created_at"`
	UpdatedAt         string                `json:"updated_at"`
}

func (d *DBUserProfile) UnmarshalJSON(data []byte) error {
	type Alias DBUserProfile
	aux := &struct {
		Extra json.RawMessage `json:"extra"`
		*Alias
	}{
		Alias: (*Alias)(d),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if len(aux.Extra) > 0 && string(aux.Extra) != "null" {
		var extra models.ExtraMetadata
		if err := json.Unmarshal(aux.Extra, &extra); err == nil {
			d.Extra = &extra
		}
	}
	return nil
}

func (d *DBUserProfile) ToUserPublic() *model.UserPublic {
	pt := make([]*model.PersonalityTrait, 0, len(d.PersonalityTraits))
	for k, v := range d.PersonalityTraits {
		pt = append(pt, &model.PersonalityTrait{
			Key:   k,
			Value: int32(v),
		})
	}

	return &model.UserPublic{
		ID:                d.ID,
		Name:              d.FirstName + " " + d.LastName,
		Pfp:               d.Pfp,
		Bio:               d.Bio,
		Dob:               d.Dob,
		Gender:            d.Gender,
		Hobbies:           EmptyIfNil(d.Hobbies),
		Interests:         EmptyIfNil(d.Interests),
		UserPrompts:       EmptyIfNil(d.UserPrompts),
		PersonalityTraits: pt,
		Photos:            EmptyIfNil(d.Photos),
		IsVerified:        d.IsVerified,
		Extra:             d.Extra,
		CreatedAt:         d.CreatedAt.Time(),
		IsOnline:          false,
	}
}

// ToUserPublicWithLock returns UserPublic with appropriate photos based on lock status
// If locked, returns blurred photos; if unlocked, returns original photos
func (d *DBUserProfile) ToUserPublicWithLock(isLocked bool) *model.UserPublic {
	up := d.ToUserPublic()
	if isLocked && len(d.BlurredPhotos) > 0 {
		up.Photos = EmptyIfNil(d.BlurredPhotos)
		// Also blur the PFP
		if len(d.BlurredPhotos) > 0 {
			up.Pfp = d.BlurredPhotos[0]
		}
	}
	return up
}

func EmptyIfNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

type DBChat struct {
	Id        string           `json:"id"`
	MatchId   string           `json:"match_id"`
	CreatedAt FlexibleTime     `json:"created_at"`
	Messages  []models.Message `json:"messages"`
}

func (d *DBChat) ToChat() models.Chat {
	return models.Chat{
		Id:        d.Id,
		MatchId:   d.MatchId,
		CreatedAt: d.CreatedAt.Time(),
		Messages:  d.Messages,
	}
}

type DBMatch struct {
	Id               string                  `json:"id"`
	SheId            string                  `json:"she_id"`
	HeId             string                  `json:"he_id"`
	Score            int                     `json:"score"`
	PostUnlockRating models.PostUnlockRating `json:"post_unlock_rating"`
	IsUnlocked       bool                    `json:"is_unlocked"`
	SheMessages      int                     `json:"she_messages"`
	HeMessages       int                     `json:"he_messages"`
	MatchedAt        FlexibleTime            `json:"matched_at"`
}

func (d *DBMatch) ToMatch() models.Match {
	return models.Match{
		Id:               d.Id,
		SheId:            d.SheId,
		HeId:             d.HeId,
		Score:            d.Score,
		PostUnlockRating: d.PostUnlockRating,
		IsUnlocked:       d.IsUnlocked,
		SheMessages:      d.SheMessages,
		HeMessages:       d.HeMessages,
		MatchedAt:        d.MatchedAt.Time(),
	}
}
