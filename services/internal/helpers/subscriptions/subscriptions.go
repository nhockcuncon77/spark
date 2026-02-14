package subscriptions

import (
	"spark/internal/models"
	"fmt"
	"log"
	"time"

	"github.com/MelloB1989/karma/orm"
	"github.com/MelloB1989/karma/utils"
	"spark/internal/helpers/ormcompat"
)

// Plan IDs
const (
	PlanFree  = "free"
	PlanPlus  = "plus"
	PlanPro   = "pro"
	PlanElite = "elite"
)

// Default limits per plan
var PlanLimits = map[string]models.SubscriptionLimits{
	PlanFree: {
		SwipesPerDay:     10,
		AiRepliesPerDay:  0,
		SuperlikesPerDay: 1,
		BoostsPerMonth:   0,
	},
	PlanPlus: {
		SwipesPerDay:     -1, // unlimited
		AiRepliesPerDay:  5,
		SuperlikesPerDay: 5,
		BoostsPerMonth:   1,
	},
	PlanPro: {
		SwipesPerDay:     -1,
		AiRepliesPerDay:  -1,
		SuperlikesPerDay: 10,
		BoostsPerMonth:   3,
	},
	PlanElite: {
		SwipesPerDay:     -1,
		AiRepliesPerDay:  -1,
		SuperlikesPerDay: -1,
		BoostsPerMonth:   10,
	},
}

// Default features per plan
var PlanFeatures = map[string]models.SubscriptionFeatures{
	PlanFree: {
		SeeWhoLiked:      false,
		PriorityMatching: false,
		ProfileBoost:     false,
		AdvancedFilters:  false,
		VerifiedPriority: false,
		UnlimitedRewinds: false,
		ReadReceipts:     false,
		IncognitoMode:    false,
	},
	PlanPlus: {
		SeeWhoLiked:      true,
		PriorityMatching: false,
		ProfileBoost:     false,
		AdvancedFilters:  false,
		VerifiedPriority: false,
		UnlimitedRewinds: true,
		ReadReceipts:     true,
		IncognitoMode:    false,
	},
	PlanPro: {
		SeeWhoLiked:      true,
		PriorityMatching: true,
		ProfileBoost:     false,
		AdvancedFilters:  true,
		VerifiedPriority: false,
		UnlimitedRewinds: true,
		ReadReceipts:     true,
		IncognitoMode:    true,
	},
	PlanElite: {
		SeeWhoLiked:      true,
		PriorityMatching: true,
		ProfileBoost:     true,
		AdvancedFilters:  true,
		VerifiedPriority: true,
		UnlimitedRewinds: true,
		ReadReceipts:     true,
		IncognitoMode:    true,
	},
}

// GetAllPlans returns all available subscription plans
func GetAllPlans() ([]models.SubscriptionPlan, error) {
	planORM := orm.Load(&models.SubscriptionPlan{})
	plans, err := ormcompat.GetByFieldEqualsSlice[models.SubscriptionPlan](planORM, "IsActive", true)
	if err != nil {
		return nil, err
	}
	return plans, nil
}

// GetPlan returns a subscription plan by ID
func GetPlan(planID string) (*models.SubscriptionPlan, error) {
	planORM := orm.Load(&models.SubscriptionPlan{})
	plans, err := ormcompat.GetByFieldEqualsSlice[models.SubscriptionPlan](planORM, "Id", planID)
	if err != nil {
		return nil, err
	}

	if len(plans) == 0 {
		// Return default plan limits/features if plan not in DB
		return &models.SubscriptionPlan{
			Id:       planID,
			Name:     planID,
			Limits:   PlanLimits[planID],
			Features: PlanFeatures[planID],
		}, nil
	}

	return &plans[0], nil
}

// GetUserSubscription returns the active subscription for a user
func GetUserSubscription(userID string) (*models.UserSubscription, error) {
	subORM := orm.Load(&models.UserSubscription{})
	subs, err := ormcompat.GetByFieldEqualsSlice[models.UserSubscription](subORM, "UserId", userID)
	if err != nil {
		return nil, err
	}

	// Find active subscription
	now := time.Now()
	for _, sub := range subs {
		if sub.Status == "active" && sub.CurrentPeriodEnd.After(now) {
			return &sub, nil
		}
	}

	return nil, nil // No active subscription
}

// GetUserPlanID returns the current plan ID for a user
func GetUserPlanID(userID string) string {
	sub, err := GetUserSubscription(userID)
	if err != nil || sub == nil {
		return PlanFree
	}
	return sub.PlanId
}

// GetUserLimits returns the subscription limits for a user
func GetUserLimits(userID string) models.SubscriptionLimits {
	planID := GetUserPlanID(userID)
	if limits, ok := PlanLimits[planID]; ok {
		return limits
	}
	return PlanLimits[PlanFree]
}

// GetUserFeatures returns the subscription features for a user
func GetUserFeatures(userID string) models.SubscriptionFeatures {
	planID := GetUserPlanID(userID)
	if features, ok := PlanFeatures[planID]; ok {
		return features
	}
	return PlanFeatures[PlanFree]
}

// HasFeature checks if a user has access to a specific feature
func HasFeature(userID, feature string) bool {
	features := GetUserFeatures(userID)
	switch feature {
	case "see_who_liked":
		return features.SeeWhoLiked
	case "priority_matching":
		return features.PriorityMatching
	case "profile_boost":
		return features.ProfileBoost
	case "advanced_filters":
		return features.AdvancedFilters
	case "verified_priority":
		return features.VerifiedPriority
	case "unlimited_rewinds":
		return features.UnlimitedRewinds
	case "read_receipts":
		return features.ReadReceipts
	case "incognito_mode":
		return features.IncognitoMode
	default:
		return false
	}
}

// CanSwipe checks if user can swipe (respects daily limit)
func CanSwipe(userID string) (bool, int, error) {
	limits := GetUserLimits(userID)
	if limits.SwipesPerDay == -1 {
		return true, -1, nil // Unlimited
	}

	// Get user's current swipe count
	userORM := orm.Load(&models.User{})
	users, err := ormcompat.GetByFieldEqualsSlice[models.User](userORM, "Id", userID)
	if err != nil {
		return false, 0, err
	}

	if len(users) == 0 {
		return false, 0, fmt.Errorf("user not found")
	}

	user := users[0]

	// Check if we need to reset (new day)
	now := time.Now()
	if user.LastSwipeReset.Day() != now.Day() || user.LastSwipeReset.Month() != now.Month() {
		// Reset swipe count
		user.SwipesToday = 0
		user.LastSwipeReset = now
		userORM.Update(&user, user.Id)
	}

	remaining := limits.SwipesPerDay - user.SwipesToday
	return remaining > 0, remaining, nil
}

// IncrementSwipeCount increments the user's daily swipe count
func IncrementSwipeCount(userID string) error {
	userORM := orm.Load(&models.User{})
	users, err := ormcompat.GetByFieldEqualsSlice[models.User](userORM, "Id", userID)
	if err != nil {
		return err
	}

	if len(users) == 0 {
		return fmt.Errorf("user not found")
	}

	user := users[0]
	user.SwipesToday++
	user.UpdatedAt = time.Now()

	return userORM.Update(&user, user.Id)
}

// CanUseAIReplies checks if user can use AI replies
func CanUseAIReplies(userID string) (bool, int, error) {
	limits := GetUserLimits(userID)
	if limits.AiRepliesPerDay == -1 {
		return true, -1, nil // Unlimited
	}

	if limits.AiRepliesPerDay == 0 {
		return false, 0, nil // No AI access
	}

	// Get user's current AI usage
	userORM := orm.Load(&models.User{})
	users, err := ormcompat.GetByFieldEqualsSlice[models.User](userORM, "Id", userID)
	if err != nil {
		return false, 0, err
	}

	if len(users) == 0 {
		return false, 0, fmt.Errorf("user not found")
	}

	user := users[0]

	// Check if we need to reset (new day)
	now := time.Now()
	if user.LastAiReset.Day() != now.Day() || user.LastAiReset.Month() != now.Month() {
		// Reset AI count
		user.AiRepliesUsedToday = 0
		user.LastAiReset = now
		userORM.Update(&user, user.Id)
	}

	remaining := limits.AiRepliesPerDay - user.AiRepliesUsedToday
	return remaining > 0, remaining, nil
}

// IncrementAIUsage increments the user's daily AI usage count
func IncrementAIUsage(userID string) error {
	userORM := orm.Load(&models.User{})
	users, err := ormcompat.GetByFieldEqualsSlice[models.User](userORM, "Id", userID)
	if err != nil {
		return err
	}

	if len(users) == 0 {
		return fmt.Errorf("user not found")
	}

	user := users[0]
	user.AiRepliesUsedToday++
	user.UpdatedAt = time.Now()

	return userORM.Update(&user, user.Id)
}

// CreateSubscription creates a new subscription for a user
func CreateSubscription(userID, planID, provider, providerSubID, providerCustID string, periodStart, periodEnd time.Time) (*models.UserSubscription, error) {
	subORM := orm.Load(&models.UserSubscription{})
	existing, _ := ormcompat.GetByFieldEqualsSlice[models.UserSubscription](subORM, "UserId", userID)
	if len(existing) > 0 {
		for _, sub := range existing {
			if sub.Status == "active" {
				sub.Status = "cancelled"
				now := time.Now()
				sub.CancelledAt = &now
				sub.UpdatedAt = now
				subORM.Update(&sub, sub.Id)
			}
		}
	}

	// Create new subscription
	subscription := &models.UserSubscription{
		Id:                     utils.GenerateID(),
		UserId:                 userID,
		PlanId:                 planID,
		Status:                 "active",
		Provider:               provider,
		ProviderSubscriptionId: providerSubID,
		ProviderCustomerId:     providerCustID,
		CurrentPeriodStart:     periodStart,
		CurrentPeriodEnd:       periodEnd,
		CancelAtPeriodEnd:      false,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}

	if err := subORM.Insert(subscription); err != nil {
		return nil, err
	}

	// Update user's plan
	userORM := orm.Load(&models.User{})
	users, _ := ormcompat.GetByFieldEqualsSlice[models.User](userORM, "Id", userID)
	if len(users) > 0 {
		users[0].SubscriptionPlanId = planID
		users[0].UpdatedAt = time.Now()
		userORM.Update(&users[0], users[0].Id)
	}

	log.Printf("[Subscription] Created %s subscription for user %s", planID, userID)
	return subscription, nil
}

// CancelSubscription cancels a subscription at period end
func CancelSubscription(userID string) error {
	sub, err := GetUserSubscription(userID)
	if err != nil {
		return err
	}
	if sub == nil {
		return fmt.Errorf("no active subscription found")
	}

	subORM := orm.Load(&models.UserSubscription{})
	sub.CancelAtPeriodEnd = true
	sub.UpdatedAt = time.Now()

	return subORM.Update(sub, sub.Id)
}

// ReactivateSubscription removes the cancel at period end flag
func ReactivateSubscription(userID string) error {
	sub, err := GetUserSubscription(userID)
	if err != nil {
		return err
	}
	if sub == nil {
		return fmt.Errorf("no active subscription found")
	}

	subORM := orm.Load(&models.UserSubscription{})
	sub.CancelAtPeriodEnd = false
	sub.UpdatedAt = time.Now()

	return subORM.Update(sub, sub.Id)
}

// ExpireSubscription marks a subscription as expired
func ExpireSubscription(subscriptionID string) error {
	subORM := orm.Load(&models.UserSubscription{})
	subs, err := ormcompat.GetByFieldEqualsSlice[models.UserSubscription](subORM, "Id", subscriptionID)
	if err != nil {
		return err
	}
	if len(subs) == 0 {
		return fmt.Errorf("subscription not found")
	}

	subs[0].Status = "expired"
	subs[0].UpdatedAt = time.Now()

	// Update user's plan back to free
	userORM := orm.Load(&models.User{})
	users, _ := ormcompat.GetByFieldEqualsSlice[models.User](userORM, "Id", subs[0].UserId)
	if len(users) > 0 {
		users[0].SubscriptionPlanId = PlanFree
		users[0].UpdatedAt = time.Now()
		userORM.Update(&users[0], users[0].Id)
	}

	return subORM.Update(&subs[0], subs[0].Id)
}

// SeedDefaultPlans creates the default subscription plans in the database
func SeedDefaultPlans() error {
	planORM := orm.Load(&models.SubscriptionPlan{})
	plans := []models.SubscriptionPlan{
		{
			Id:           PlanFree,
			Name:         "Free",
			Description:  "Get started with basic features",
			PriceMonthly: 0,
			PriceYearly:  0,
			Features:     PlanFeatures[PlanFree],
			Limits:       PlanLimits[PlanFree],
			IsActive:     true,
			SortOrder:    0,
			CreatedAt:    time.Now(),
		},
		{
			Id:           PlanPlus,
			Name:         "Plus",
			Description:  "See who liked you and more",
			PriceMonthly: 999,  // $9.99
			PriceYearly:  7999, // $79.99
			Features:     PlanFeatures[PlanPlus],
			Limits:       PlanLimits[PlanPlus],
			IsActive:     true,
			SortOrder:    1,
			CreatedAt:    time.Now(),
		},
		{
			Id:           PlanPro,
			Name:         "Pro",
			Description:  "Priority matching and unlimited AI",
			PriceMonthly: 1999,  // $19.99
			PriceYearly:  15999, // $159.99
			Features:     PlanFeatures[PlanPro],
			Limits:       PlanLimits[PlanPro],
			IsActive:     true,
			SortOrder:    2,
			CreatedAt:    time.Now(),
		},
		{
			Id:           PlanElite,
			Name:         "Elite",
			Description:  "All features unlocked",
			PriceMonthly: 2999,  // $29.99
			PriceYearly:  23999, // $239.99
			Features:     PlanFeatures[PlanElite],
			Limits:       PlanLimits[PlanElite],
			IsActive:     true,
			SortOrder:    3,
			CreatedAt:    time.Now(),
		},
	}

	for _, plan := range plans {
		// Check if exists
		existing, _ := ormcompat.GetByFieldEqualsSlice[models.SubscriptionPlan](planORM, "Id", plan.Id)
		if len(existing) > 0 {
			continue // Already exists
		}
		if err := planORM.Insert(&plan); err != nil {
			log.Printf("[Subscription] Failed to seed plan %s: %v", plan.Id, err)
		} else {
			log.Printf("[Subscription] Seeded plan %s", plan.Id)
		}
	}

	return nil
}
