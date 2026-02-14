package models

import (
	"time"

	"github.com/MelloB1989/karma/models"
)

type User struct {
	TableName         string         `karma_table:"users" json:"-"`
	Id                string         `json:"id" karma:"primary"`
	FirstName         string         `json:"first_name"`
	LastName          string         `json:"last_name"`
	Email             string         `json:"email"`
	PasswordHash      string         `json:"-" db:"password_hash"` // bcrypt hash for native auth; empty when using WorkOS
	Dob               time.Time      `json:"dob"`
	Pfp               string         `json:"pfp"`
	Bio               string         `json:"bio"`
	Gender            string         `json:"gender"`
	Hobbies           []string       `json:"hobbies" db:"hobbies"`
	Interests         []string       `json:"interests" db:"interests"`
	UserPrompts       []string       `json:"user_prompts" db:"user_prompts"`
	PersonalityTraits map[string]int `json:"personality_traits" db:"personality_traits"` // 1-5
	Photos            []string       `json:"photos" db:"photos"`
	BlurredPhotos     []string       `json:"blurred_photos" db:"blurred_photos"`
	IsVerified        bool           `json:"is_verified"`
	Address           Address        `json:"address" db:"address"`
	Extra             ExtraMetadata  `json:"extra" db:"extra"`
	// Admin & subscription fields
	Role               string    `json:"role"` // "user", "admin", "moderator"
	IsBanned           bool      `json:"is_banned"`
	SubscriptionPlanId string    `json:"subscription_plan_id"`
	// AI usage tracking
	AiRepliesUsedToday int       `json:"ai_replies_used_today"`
	LastAiReset        time.Time `json:"last_ai_reset"`
	// Swipe tracking
	SwipesToday    int       `json:"swipes_today"`
	LastSwipeReset time.Time `json:"last_swipe_reset"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Match struct {
	TableName        string           `karma_table:"matches" json:"-"`
	Id               string           `json:"id" karma:"primary"`
	SheId            string           `json:"she_id"`
	HeId             string           `json:"he_id"`
	Score            int              `json:"score"`
	PostUnlockRating PostUnlockRating `json:"post_unlock_rating" db:"post_unlock_rating"`
	IsUnlocked       bool             `json:"is_unlocked"`
	SheMessages      int              `json:"she_messages"`
	HeMessages       int              `json:"he_messages"`
	// Unlock request flow
	UnlockRequestedBy string     `json:"unlock_requested_by"`
	UnlockRequestedAt *time.Time `json:"unlock_requested_at"`
	UnlockAcceptedAt  *time.Time `json:"unlock_accepted_at"`
	// Date status
	IsDate     bool      `json:"is_date"`     // both rated >= 8
	IsArchived bool      `json:"is_archived"` // one rated < 8 or blocked
	MatchedAt  time.Time `json:"matched_at"`
}

type Chat struct {
	TableName string    `karma_table:"chats" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	MatchId   string    `json:"match_id"`
	CreatedAt time.Time `json:"created_at"`
	Messages  []Message `json:"messages" db:"messages"`
}

type Post struct {
	TableName string    `karma_table:"posts" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	UserId    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Content   string    `json:"content"`
	Media     []Media   `json:"media" db:"media"`
	Likes     int       `json:"likes"`
	IsLiked   bool      `json:"is_liked" karma:"ignore"` // Not stored in DB
	Comments  int       `json:"comments"`
	Views     int       `json:"views"`
}

type Comment struct {
	TableName string    `karma_table:"comments" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	PostId    string    `json:"post_id"`
	ReplyToId string    `json:"reply_to_id"`
	UserId    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Content   string    `json:"content"`
	Likes     int       `json:"likes"`
	IsLiked   bool      `json:"is_liked" karma:"ignore"` // Not stored in DB
}

type UserFiles struct {
	TableName  struct{}  `karma_table:"user_files"`
	Id         string    `json:"id" karma:"primary"`
	Uid        string    `json:"uid"`
	Key        string    `json:"key"`
	S3Path     string    `json:"s3_path"`
	Visibility string    `json:"visibility"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type UserProfileActivity struct {
	TableName string       `karma_table:"user_profile_activities" json:"-"`
	Id        string       `json:"id" karma:"primary"`
	UserId    string       `json:"user_id"`
	Type      ActivityType `json:"type"`
	TargetId  string       `json:"target_id"`
	CreatedAt time.Time    `json:"created_at"`
}

type Swipe struct {
	TableName  string    `karma_table:"swipes" json:"-"`
	Id         string    `json:"id" karma:"primary"`
	UserId     string    `json:"user_id"`
	TargetId   string    `json:"target_id"`
	ActionType SwipeType `json:"action_type"` // "like", "superlike", "dislike"
	CreatedAt  time.Time `json:"created_at"`
}

type Report struct {
	TableName      struct{}  `karma_table:"reports"`
	Id             string    `json:"id" karma:"primary"`
	UserId         string    `json:"user_id"`
	TargetId       string    `json:"target_id"`
	Reason         string    `json:"reason"`
	AdditionalInfo string    `json:"additional_info"`
	Media          []Media   `json:"media" db:"media"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type AIChat struct {
	TableName string             `karma_table:"aichat_chats" json:"-"`
	Id        string             `json:"id" karma:"primary"`
	UserId    string             `json:"user_id"`
	Messages  []models.AIMessage `json:"messages" db:"messages"`
	Title     string             `json:"title"`
	CreatedAt time.Time          `json:"created_at"`
}

type UserVerification struct {
	TableName string    `karma_table:"user_verifications" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	UserId    string    `json:"user_id"`
	Media     []Media   `json:"media" db:"media"`
	Status    string    `json:"status"` // "pending", "verified", "failed"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type BlockedUser struct {
	TableName     string    `karma_table:"blocked_users" json:"-"`
	Id            string    `json:"id" karma:"primary"`
	UserId        string    `json:"user_id"`
	BlockedUserId string    `json:"blocked_user_id"`
	CreatedAt     time.Time `json:"created_at"`
}

// ==================== Push Notifications ====================

type UserPushToken struct {
	TableName string    `karma_table:"user_push_tokens" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	UserId    string    `json:"user_id"`
	Token     string    `json:"token"`
	Platform  string    `json:"platform"` // "ios", "android", "web"
	DeviceId  string    `json:"device_id"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ==================== Subscriptions ====================

type SubscriptionFeatures struct {
	SeeWhoLiked       bool `json:"see_who_liked"`
	PriorityMatching  bool `json:"priority_matching"`
	ProfileBoost      bool `json:"profile_boost"`
	AdvancedFilters   bool `json:"advanced_filters"`
	VerifiedPriority  bool `json:"verified_priority"`
	UnlimitedRewinds  bool `json:"unlimited_rewinds"`
	ReadReceipts      bool `json:"read_receipts"`
	IncognitoMode     bool `json:"incognito_mode"`
}

type SubscriptionLimits struct {
	SwipesPerDay   int `json:"swipes_per_day"`   // -1 for unlimited
	AiRepliesPerDay int `json:"ai_replies_per_day"` // -1 for unlimited
	SuperlikesPerDay int `json:"superlikes_per_day"`
	BoostsPerMonth  int `json:"boosts_per_month"`
}

type SubscriptionPlan struct {
	TableName       string               `karma_table:"subscription_plans" json:"-"`
	Id              string               `json:"id" karma:"primary"` // "free", "plus", "pro", "elite"
	Name            string               `json:"name"`
	Description     string               `json:"description"`
	PriceMonthly    int                  `json:"price_monthly"` // cents
	PriceYearly     int                  `json:"price_yearly"`  // cents
	Features        SubscriptionFeatures `json:"features" db:"features"`
	Limits          SubscriptionLimits   `json:"limits" db:"limits"`
	DodoProductId   string               `json:"dodo_product_id"`
	RevcatOfferingId string              `json:"revcat_offering_id"`
	IsActive        bool                 `json:"is_active"`
	SortOrder       int                  `json:"sort_order"`
	CreatedAt       time.Time            `json:"created_at"`
}

type UserSubscription struct {
	TableName              string     `karma_table:"user_subscriptions" json:"-"`
	Id                     string     `json:"id" karma:"primary"`
	UserId                 string     `json:"user_id"`
	PlanId                 string     `json:"plan_id"`
	Status                 string     `json:"status"` // "active", "cancelled", "expired", "paused"
	Provider               string     `json:"provider"` // "dodo", "revcat", "manual"
	ProviderSubscriptionId string     `json:"provider_subscription_id"`
	ProviderCustomerId     string     `json:"provider_customer_id"`
	CurrentPeriodStart     time.Time  `json:"current_period_start"`
	CurrentPeriodEnd       time.Time  `json:"current_period_end"`
	CancelAtPeriodEnd      bool       `json:"cancel_at_period_end"`
	CancelledAt            *time.Time `json:"cancelled_at"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

// ==================== Streaks ====================

type MatchStreak struct {
	TableName       string     `karma_table:"match_streaks" json:"-"`
	Id              string     `json:"id" karma:"primary"`
	MatchId         string     `json:"match_id"`
	CurrentStreak   int        `json:"current_streak"`
	LongestStreak   int        `json:"longest_streak"`
	LastMessageDate *time.Time `json:"last_message_date"`
	StreakStartDate *time.Time `json:"streak_start_date"`
	SheLastMessage  *time.Time `json:"she_last_message"`
	HeLastMessage   *time.Time `json:"he_last_message"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
