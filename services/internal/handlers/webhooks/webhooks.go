package webhooks

import (
	"spark/internal/helpers/subscriptions"
	"spark/internal/helpers/users"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/gofiber/fiber/v2"
)

// DodoPayments webhook payload
type DodoWebhookPayload struct {
	Type       string `json:"type"`
	BusinessId string `json:"business_id"`
	Data       struct {
		SubscriptionId string `json:"subscription_id"`
		CustomerId     string `json:"customer_id"`
		ProductId      string `json:"product_id"`
		Status         string `json:"status"`
		Customer       struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		} `json:"customer"`
		PreviousBillingDate string `json:"previous_billing_date"`
		NextBillingDate     string `json:"next_billing_date"`
		Metadata            map[string]string `json:"metadata"`
	} `json:"data"`
	Timestamp string `json:"timestamp"`
}

// RevenueCat webhook payload
type RevCatWebhookPayload struct {
	APIVersion string `json:"api_version"`
	Event      struct {
		Type                string `json:"type"`
		ID                  string `json:"id"`
		AppUserID           string `json:"app_user_id"`
		OriginalAppUserID   string `json:"original_app_user_id"`
		ProductID           string `json:"product_id"`
		EntitlementIDs      []string `json:"entitlement_ids"`
		PeriodType          string `json:"period_type"`
		PurchasedAtMs       int64  `json:"purchased_at_ms"`
		ExpirationAtMs      int64  `json:"expiration_at_ms"`
		Environment         string `json:"environment"`
		Store               string `json:"store"`
		SubscriberAttributes map[string]struct {
			Value     string `json:"value"`
			UpdatedAt int64  `json:"updated_at_ms"`
		} `json:"subscriber_attributes"`
	} `json:"event"`
}

// Dodo product ID to plan ID mapping
var dodoProductToPlan = map[string]string{
	"SPARK_plus_monthly":  subscriptions.PlanPlus,
	"SPARK_plus_yearly":   subscriptions.PlanPlus,
	"SPARK_pro_monthly":   subscriptions.PlanPro,
	"SPARK_pro_yearly":    subscriptions.PlanPro,
	"SPARK_elite_monthly": subscriptions.PlanElite,
	"SPARK_elite_yearly":  subscriptions.PlanElite,
}

// RevenueCat product ID to plan ID mapping
var revcatProductToPlan = map[string]string{
	"SPARK_plus_monthly":  subscriptions.PlanPlus,
	"SPARK_plus_annual":   subscriptions.PlanPlus,
	"SPARK_pro_monthly":   subscriptions.PlanPro,
	"SPARK_pro_annual":    subscriptions.PlanPro,
	"SPARK_elite_monthly": subscriptions.PlanElite,
	"SPARK_elite_annual":  subscriptions.PlanElite,
}

// HandleDodoWebhook handles DodoPayments webhooks
func HandleDodoWebhook(c *fiber.Ctx) error {
	// Verify webhook signature
	signature := c.Get("X-Dodo-Signature")
	secret := config.GetEnvRaw("DODO_WEBHOOK_SECRET")

	if secret != "" && signature != "" {
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write(c.Body())
		expectedSig := hex.EncodeToString(mac.Sum(nil))
		if signature != expectedSig {
			log.Printf("[Webhook] Invalid Dodo signature")
			return c.SendStatus(fiber.StatusUnauthorized)
		}
	}

	var payload DodoWebhookPayload
	if err := json.Unmarshal(c.Body(), &payload); err != nil {
		log.Printf("[Webhook] Failed to parse Dodo payload: %v", err)
		return c.SendStatus(fiber.StatusBadRequest)
	}

	log.Printf("[Webhook] Dodo event: %s for subscription %s", payload.Type, payload.Data.SubscriptionId)

	// Find user by email or metadata
	var userID string
	if payload.Data.Metadata != nil {
		if uid, ok := payload.Data.Metadata["user_id"]; ok {
			userID = uid
		}
	}
	if userID == "" && payload.Data.Customer.Email != "" {
		user, err := users.GetUserByEmail(payload.Data.Customer.Email)
		if err == nil && user != nil {
			userID = user.Id
		}
	}

	if userID == "" {
		log.Printf("[Webhook] Could not find user for Dodo webhook")
		return c.SendStatus(fiber.StatusOK) // Still return 200 to prevent retries
	}

	// Get plan from product
	planID := subscriptions.PlanPlus // default
	if p, ok := dodoProductToPlan[payload.Data.ProductId]; ok {
		planID = p
	}

	switch payload.Type {
	case "subscription.active", "subscription.created":
		periodStart := time.Now()
		periodEnd := time.Now().AddDate(0, 1, 0) // Default 1 month

		if payload.Data.NextBillingDate != "" {
			if t, err := time.Parse(time.RFC3339, payload.Data.NextBillingDate); err == nil {
				periodEnd = t
			}
		}

		_, err := subscriptions.CreateSubscription(
			userID,
			planID,
			"dodo",
			payload.Data.SubscriptionId,
			payload.Data.CustomerId,
			periodStart,
			periodEnd,
		)
		if err != nil {
			log.Printf("[Webhook] Failed to create subscription: %v", err)
		}

	case "subscription.renewed":
		// Update period
		sub, _ := subscriptions.GetUserSubscription(userID)
		if sub != nil {
			periodEnd := time.Now().AddDate(0, 1, 0)
			if payload.Data.NextBillingDate != "" {
				if t, err := time.Parse(time.RFC3339, payload.Data.NextBillingDate); err == nil {
					periodEnd = t
				}
			}
			subscriptions.CreateSubscription(
				userID,
				planID,
				"dodo",
				payload.Data.SubscriptionId,
				payload.Data.CustomerId,
				time.Now(),
				periodEnd,
			)
		}

	case "subscription.cancelled", "subscription.expired":
		sub, _ := subscriptions.GetUserSubscription(userID)
		if sub != nil {
			subscriptions.ExpireSubscription(sub.Id)
		}

	case "subscription.paused":
		sub, _ := subscriptions.GetUserSubscription(userID)
		if sub != nil {
			subscriptions.CancelSubscription(userID)
		}
	}

	return c.SendStatus(fiber.StatusOK)
}

// HandleRevenueCatWebhook handles RevenueCat webhooks
func HandleRevenueCatWebhook(c *fiber.Ctx) error {
	// Verify webhook signature
	authHeader := c.Get("Authorization")
	expectedAuth := "Bearer " + config.GetEnvRaw("REVENUECAT_WEBHOOK_SECRET")

	if expectedAuth != "Bearer " && authHeader != expectedAuth {
		log.Printf("[Webhook] Invalid RevenueCat authorization")
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	var payload RevCatWebhookPayload
	if err := json.Unmarshal(c.Body(), &payload); err != nil {
		log.Printf("[Webhook] Failed to parse RevenueCat payload: %v", err)
		return c.SendStatus(fiber.StatusBadRequest)
	}

	log.Printf("[Webhook] RevenueCat event: %s for user %s", payload.Event.Type, payload.Event.AppUserID)

	userID := payload.Event.AppUserID
	if userID == "" {
		userID = payload.Event.OriginalAppUserID
	}

	if userID == "" {
		log.Printf("[Webhook] No user ID in RevenueCat webhook")
		return c.SendStatus(fiber.StatusOK)
	}

	// Get plan from product
	planID := subscriptions.PlanPlus
	if p, ok := revcatProductToPlan[payload.Event.ProductID]; ok {
		planID = p
	}

	switch payload.Event.Type {
	case "INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE":
		periodStart := time.UnixMilli(payload.Event.PurchasedAtMs)
		periodEnd := time.UnixMilli(payload.Event.ExpirationAtMs)

		_, err := subscriptions.CreateSubscription(
			userID,
			planID,
			"revcat",
			payload.Event.ID,
			"",
			periodStart,
			periodEnd,
		)
		if err != nil {
			log.Printf("[Webhook] Failed to create subscription: %v", err)
		}

	case "CANCELLATION", "EXPIRATION":
		sub, _ := subscriptions.GetUserSubscription(userID)
		if sub != nil {
			subscriptions.ExpireSubscription(sub.Id)
		}

	case "BILLING_ISSUE":
		// Could send notification to user
		log.Printf("[Webhook] Billing issue for user %s", userID)
	}

	return c.SendStatus(fiber.StatusOK)
}

// RegisterWebhookRoutes registers webhook routes
func RegisterWebhookRoutes(app *fiber.App) {
	webhooks := app.Group("/webhooks")
	webhooks.Post("/dodo", HandleDodoWebhook)
	webhooks.Post("/revenuecat", HandleRevenueCatWebhook)
}
