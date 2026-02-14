package directives

import (
	analytics "spark/internal/anal"
	"spark/internal/models"
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/99designs/gqlgen/graphql"
	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/dgrijalva/jwt-go"
)

type contextKey string

const ClaimsContextKey = contextKey("authClaims")
const AnalyticsContextKey = contextKey("analytics")

func AuthDirective(ctx context.Context, obj any, next graphql.Resolver) (any, error) {
	analyticsClient := analytics.CreateAnalytics("anoynomous-" + utils.GenerateID(4))
	reqCtx := ctx.Value("httpRequest").(*http.Request)
	if reqCtx == nil {
		analyticsClient.SendRequestError(analytics.BAD_REQUEST_400, errors.New("could not retrieve HTTP request"))
		return nil, errors.New("could not retrieve HTTP request")
	}

	ipAddress := reqCtx.RemoteAddr
	analyticsClient.SetProperty(analytics.USER_IP, ipAddress)
	authHeader := reqCtx.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		analyticsClient.SendRequestError(analytics.UNAUTHORIZED_401, errors.New("missing or malformed Authorization header"))
		return nil, errors.New("missing or malformed Authorization header")
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.ParseWithClaims(tokenStr, &models.Claims{}, func(token *jwt.Token) (any, error) {
		return []byte(config.DefaultConfig().JWTSecret), nil
	})
	if err != nil || !token.Valid {
		analyticsClient.SendRequestError(analytics.UNAUTHORIZED_401, errors.New("invalid token"))
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*models.Claims)
	if !ok {
		analyticsClient.SendRequestError(analytics.UNAUTHORIZED_401, errors.New("could not extract claims"))
		return nil, errors.New("could not extract claims")
	}

	analyticsClient.UniqueIdentifier = claims.UserID
	analyticsClient.SetProperty(analytics.USER_EMAIL, claims.Email)
	analyticsClient.SetProperty(analytics.USER_GENDER, claims.Gender)
	analyticsClient.SetProperty(analytics.USER_NAME, claims.Name)
	analyticsClient.SetProperty(analytics.USER_PFP, claims.Pfp)

	// Inject claims into context
	ctx = context.WithValue(ctx, ClaimsContextKey, claims)
	ctx = context.WithValue(ctx, AnalyticsContextKey, analyticsClient)
	return next(ctx)
}

func GetAuthClaims(ctx context.Context) (*models.Claims, *analytics.AnalyticsEngine, error) {
	claims, ok := ctx.Value(ClaimsContextKey).(*models.Claims)
	if !ok {
		return nil, nil, errors.New("unauthenticated")
	}
	analyticsClient, ok := ctx.Value(AnalyticsContextKey).(*analytics.AnalyticsEngine)
	if !ok {
		return nil, nil, errors.New("analytics client not found")
	}

	return claims, analyticsClient, nil
}
