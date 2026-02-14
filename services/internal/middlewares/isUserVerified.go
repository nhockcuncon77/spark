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

// JWTMiddleware is the middleware function to verify JWT tokens
func IsUserVerified(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized1",
			"error":   errors.New("You are unauthorized for this."),
		})
	}

	// Extract the token from the Bearer string
	tokenStr := strings.TrimSpace(strings.Replace(authHeader, "Bearer", "", 1))
	if tokenStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Unauthorized2",
			"error":   errors.New("You are unauthorized for this."),
		})
	}

	// Parse the JWT token
	token, err := jwt.ParseWithClaims(
		tokenStr,
		&models.Claims{},
		func(token *jwt.Token) (any, error) {
			// Make sure the token's algorithm is what you expect:
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
		// Store the claims in the context's locals
		// fmt.Println(claims.UserID)
		c.Locals("uid", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("gender", claims.Gender)
		c.Locals("age", claims.Age)
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

		// Continue with the next handler
		return c.Next()
	}

	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
		"message": "Unauthorized4",
		"error":   errors.New("You are unauthorized for this."),
	})
}
