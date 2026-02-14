package native

import (
	"errors"
	"fmt"
	"strings"

	"spark/internal/auth"
	"spark/internal/graph/model"
	"spark/internal/helpers/users"
	"spark/internal/models"

	"github.com/MelloB1989/karma/utils"
	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 10

// NativeAuth implements auth.AuthService using the app's PostgreSQL database (password_hash on users).
type NativeAuth struct{}

func NewNativeAuth() auth.AuthService {
	return &NativeAuth{}
}

func (*NativeAuth) CreateUser(u model.CreateUserInput) (*model.AuthPayload, error) {
	existing, _ := users.GetUserByEmail(u.Email)
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("password hash: %w", err)
	}

	finalUser := &models.User{
		Id:           utils.GenerateID(7),
		Pfp:          "",
		Email:        u.Email,
		Gender:       strings.ToUpper(u.Gender),
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		Dob:          u.Dob,
		PasswordHash: string(hash),
		Bio:          "",
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

	return &model.AuthPayload{
		AccessToken: t,
		User:        fu,
	}, nil
}

func (*NativeAuth) LoginWithPassword(email, password string) (*model.AuthPayload, error) {
	u, err := users.GetUserByEmail(email)
	if err != nil || u == nil {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("invalid email or password")
	}

	if u.PasswordHash == "" {
		return nil, errors.New("this account uses sign-in with email code or another provider")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	t, err := auth.CreateJWT(*u)
	if err != nil {
		return nil, err
	}

	return &model.AuthPayload{
		AccessToken: t,
		User:        u,
	}, nil
}

func (*NativeAuth) RequestEmailLoginCode(email string) (bool, error) {
	return false, errors.New("email code sign-in is not available with database auth; use email and password")
}

func (*NativeAuth) VerifyEmailLoginCode(email, code string) (*model.AuthPayload, error) {
	return nil, errors.New("email code sign-in is not available with database auth; use email and password")
}

func (*NativeAuth) IsServiceHealthy() bool {
	_, err := users.GetUserByEmail("healthcheck@spark.local")
	// DB reachable: "user not found" means query ran successfully
	return err == nil || strings.Contains(err.Error(), "user not found")
}
