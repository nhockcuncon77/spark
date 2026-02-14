package models

import (
	"time"

	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

func (a *UserProfileActivity) CreateActivity() error {
	activityORM := orm.Load(&UserProfileActivity{})
	defer activityORM.Close()

	activity := &UserProfileActivity{
		Id:        utils.GenerateID(10),
		UserId:    a.UserId,
		TargetId:  a.TargetId,
		Type:      a.Type,
		CreatedAt: time.Now(),
	}

	var act []UserProfileActivity

	if err := activityORM.GetByFieldsEquals(map[string]any{
		"UserId":   a.UserId,
		"TargetId": a.TargetId,
		"Type":     a.Type,
	}).Scan(&act); err != nil {
		return err
	}

	if len(act) > 0 {
		return nil
	}

	err := activityORM.Insert(activity)
	if err != nil {
		return err
	}

	return nil
}
