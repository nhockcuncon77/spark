package workos

import (
	"spark/internal/auth"
	"spark/internal/graph/model"
	"spark/internal/helpers/users"
	"spark/internal/mailer"
	"spark/internal/models"
	"context"
	"errors"
	"strings"

	"github.com/MelloB1989/karma/config"
	"github.com/workos/workos-go/v4/pkg/usermanagement"
)

type WorkosAuth struct{}

func NewWorkosAuth() auth.AuthService {
	return &WorkosAuth{}
}

func (*WorkosAuth) CreateUser(u model.CreateUserInput) (*model.AuthPayload, error) {
	usermanagement.SetAPIKey(
		getWorkosClient().ApiKey,
	)

	user, err := usermanagement.CreateUser(
		context.Background(),
		usermanagement.CreateUserOpts{
			Email:     u.Email,
			Password:  u.Password,
			FirstName: u.FirstName,
			LastName:  u.LastName,
		},
	)
	if err != nil {
		return nil, err
	}

	finalUser := &models.User{
		Id:        user.ID,
		Pfp:       user.ProfilePictureURL,
		Email:     u.Email,
		Gender:    strings.ToUpper(u.Gender),
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Dob:       u.Dob,
	}

	if u.Bio != nil {
		finalUser.Bio = *u.Bio
	}
	if u.Address != nil {
		finalUser.Address.City = u.Address.City
		finalUser.Address.Country = u.Address.Country
		finalUser.Address.State = u.Address.State
	}
	if len(u.UserPrompts) > 0 {
		finalUser.UserPrompts = u.UserPrompts
	}
	if len(u.Photos) > 0 {
		finalUser.Photos = u.Photos
	}

	fu, err := users.CreateUser(*finalUser)
	if err != nil {
		return nil, err
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

func (*WorkosAuth) LoginWithPassword(email, password string) (*model.AuthPayload, error) {
	usermanagement.SetAPIKey(
		getWorkosClient().ApiKey,
	)

	response, err := usermanagement.AuthenticateWithPassword(
		context.Background(),
		usermanagement.AuthenticateWithPasswordOpts{
			ClientID: getWorkosClient().ClientId,
			Email:    email,
			Password: password,
		},
	)
	if err != nil {
		return nil, err
	}

	fu, err := users.GetUserById(response.User.ID)
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

func (*WorkosAuth) RequestEmailLoginCode(email string) (bool, error) {
	usermanagement.SetAPIKey(
		getWorkosClient().ApiKey,
	)

	response, err := usermanagement.CreateMagicAuth(
		context.Background(),
		usermanagement.CreateMagicAuthOpts{
			Email: email,
		},
	)

	mail := mailer.BuildMagicLogin(email, response.Code)
	err = mail.Send()
	if err != nil {
		return false, err
	}

	return true, nil
}

func (*WorkosAuth) VerifyEmailLoginCode(email, code string) (*model.AuthPayload, error) {
	usermanagement.SetAPIKey(
		getWorkosClient().ApiKey,
	)

	response, err := usermanagement.AuthenticateWithMagicAuth(
		context.Background(),
		usermanagement.AuthenticateWithMagicAuthOpts{
			ClientID: getWorkosClient().ClientId,
			Email:    email,
			Code:     code,
		},
	)

	if err != nil {
		return nil, err
	}

	fu, err := users.GetUserById(response.User.ID)
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

func (*WorkosAuth) IsServiceHealthy() bool {
	usermanagement.SetAPIKey(
		getWorkosClient().ApiKey,
	)

	response, err := usermanagement.ListUsers(
		context.Background(),
		usermanagement.ListUsersOpts{
			Limit: 1,
		},
	)

	if err != nil {
		return false
	}

	return len(response.Data) > 0
}

func getWorkosClient() struct {
	ClientId string
	ApiKey   string
} {
	if config.GetEnvRaw("ENVIRONMENT") == "DEV" {
		return struct {
			ClientId string
			ApiKey   string
		}{
			ClientId: config.GetEnvRaw("DEV_WORKOS_CLIENT_ID"),
			ApiKey:   config.GetEnvRaw("DEV_WORKOS_API_KEY"),
		}
	}
	return struct {
		ClientId string
		ApiKey   string
	}{
		ClientId: config.GetEnvRaw("WORKOS_CLIENT_ID"),
		ApiKey:   config.GetEnvRaw("WORKOS_API_KEY"),
	}
}
