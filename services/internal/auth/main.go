package auth

import (
	"spark/internal/graph/model"
	"spark/internal/models"
	"time"

	"github.com/MelloB1989/karma/utils"
	"github.com/golang-jwt/jwt"
)

type AuthService interface {
	CreateUser(model.CreateUserInput) (*model.AuthPayload, error)
	LoginWithPassword(email, password string) (*model.AuthPayload, error)
	RequestEmailLoginCode(email string) (bool, error)
	VerifyEmailLoginCode(email, code string) (*model.AuthPayload, error)
	IsServiceHealthy() bool
}

func CreateJWT(u models.User) (string, error) {
	claims := models.Claims{
		UserID:      u.Id,
		Name:        u.FirstName + " " + u.LastName,
		Email:       u.Email,
		Gender:      u.Gender,
		DateOfBirth: u.Dob.Format(time.RFC3339),
		Pfp:         u.Pfp,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24 * 7).Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "spark",
		},
	}
	token, err := utils.GenerateJWT(claims)
	if err != nil {
		return "", err
	}
	return token, nil
}
