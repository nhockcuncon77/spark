package middlewares

import (
	"spark/internal/anal"
	"spark/internal/models"
	"errors"
	"strings"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/dgrijalva/jwt-go"
	"github.com/gofiber/fiber/v2"
)

func IsWebsocketVerified(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	var tokenStr string

	if authHeader != "" {
		trimmed := strings.TrimSpace(authHeader)
		if strings.HasPrefix(strings.ToLower(trimmed), "bearer ") {
			tokenStr = strings.TrimSpace(trimmed[7:])
		} else {
			tokenStr = trimmed
		}
	}

	if tokenStr == "" {
		qToken := strings.TrimSpace(c.Query("token", ""))
		if qToken != "" {
			if strings.HasPrefix(strings.ToLower(qToken), "bearer ") {
				tokenStr = strings.TrimSpace(qToken[7:])
			} else {
				tokenStr = qToken
			}
		}
	}

	if tokenStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized1",
			"error":   errors.New("You are unauthorized for this."),
		})
	}

	token, err := jwt.ParseWithClaims(
		tokenStr,
		&models.Claims{},
		func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Unexpected signing method")
			}
			return []byte(config.DefaultConfig().JWTSecret), nil
		},
	)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized3",
			"error":   errors.New("You are unauthorized for this."),
		})
	}

	if claims, ok := token.Claims.(*models.Claims); ok && token.Valid {
		c.Locals("uid", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("gender", claims.Gender)
		c.Locals("exp", time.Unix(claims.ExpiresAt, 0))
		c.Locals("name", claims.Name)
		c.Locals("pfp", claims.Pfp)

		analyticsClient := anal.CreateAnalytics(claims.UserID)
		analyticsClient.SetProperty(anal.USER_ID, claims.UserID)
		analyticsClient.SetProperty(anal.USER_EMAIL, claims.Email)
		analyticsClient.SetProperty(anal.USER_GENDER, claims.Gender)
		analyticsClient.SetProperty(anal.USER_NAME, claims.Name)
		analyticsClient.SetProperty(anal.USER_PFP, claims.Pfp)
		analyticsClient.SetProperty(anal.USER_IP, c.IP())

		c.Locals("analytics", analyticsClient)

		return c.Next()
	}

	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
		"message": "Unauthorized4",
		"error":   errors.New("You are unauthorized for this."),
	})
}
