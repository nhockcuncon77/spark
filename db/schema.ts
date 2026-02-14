import {
  pgTable,
  varchar,
  timestamp,
  integer,
  text,
  json,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  first_name: varchar("first_name").notNull(),
  last_name: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  /** Bcrypt hash for native email/password auth; null when using WorkOS */
  password_hash: varchar("password_hash"),
  username: varchar("username"),
  phone: varchar("phone").notNull(),
  dob: timestamp("dob").notNull(),
  gender: varchar("gender").notNull(),
  pfp: varchar("pfp").default(""),
  bio: text("bio").notNull(),
  hobbies: json("hobbies").default([]),
  interests: json("interests").default([]),
  user_prompts: json("user_prompts").default([]),
  personality_traits: json("personality_traits").default({}),
  photos: json("photos").default([]),
  blurred_photos: json("blurred_photos").default([]),
  is_verified: boolean("is_verified").default(false),
  address: json("address").notNull().default({}),
  extra: json("extra").default({}),
  // Admin & subscription fields
  role: varchar("role").default("user"), // "user", "admin", "moderator"
  is_banned: boolean("is_banned").default(false),
  subscription_plan_id: varchar("subscription_plan_id").default("free"),
  // AI usage tracking
  ai_replies_used_today: integer("ai_replies_used_today").default(0),
  last_ai_reset: timestamp("last_ai_reset").defaultNow(),
  // Swipe tracking
  swipes_today: integer("swipes_today").default(0),
  last_swipe_reset: timestamp("last_swipe_reset").defaultNow(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().notNull(),
  she_id: varchar("she_id").notNull(),
  he_id: varchar("he_id").notNull(),
  score: integer("score").notNull(),
  post_unlock_rating: json("post_unlock_rating").default({}), // { she_rating: 0, he_rating: 0 }
  is_unlocked: boolean("is_unlocked").default(false),
  she_messages: integer("she_messages").default(0),
  he_messages: integer("he_messages").default(0),
  // Unlock request flow
  unlock_requested_by: varchar("unlock_requested_by"), // user_id who requested
  unlock_requested_at: timestamp("unlock_requested_at"),
  unlock_accepted_at: timestamp("unlock_accepted_at"),
  // Date status
  is_date: boolean("is_date").default(false), // both rated >= 8
  is_archived: boolean("is_archived").default(false), // one rated < 8 or blocked
  matched_at: timestamp("matched_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().notNull(),
  match_id: varchar("match_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  messages: json("messages").default([]),
});

export const posts = pgTable(
  "posts",
  {
    id: varchar("id").primaryKey().notNull(),
    user_id: varchar("user_id").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    content: text("content").notNull(),
    media: json("media").default([]),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    views: integer("views").default(0),
  },
  (table) => ({
    postsUserIdIdx: index("idx_posts_user_id").on(table.user_id),
    postsCreatedAtIdx: index("idx_posts_created_at").on(table.created_at),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: varchar("id").primaryKey().notNull(),
    post_id: varchar("post_id").notNull(),
    reply_to_id: varchar("reply_to_id").notNull(),
    user_id: varchar("user_id").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    content: text("content").notNull(),
    likes: integer("likes").default(0),
  },
  (table) => ({
    commentsPostIdIdx: index("idx_comments_post_id").on(table.post_id),
    commentsReplyToIdIdx: index("idx_comments_reply_to_id").on(
      table.reply_to_id,
    ),
  }),
);

export const user_files = pgTable("user_files", {
  id: varchar("id").primaryKey().notNull(),
  uid: varchar("uid").notNull(),
  key: varchar("key").notNull(),
  s3_path: varchar("s3_path").notNull(),
  visibility: varchar("visibility").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const user_profile_activities = pgTable("user_profile_activities", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // "poke", "view", "superlike"
  target_id: varchar("target_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const swipes = pgTable("swipes", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  target_id: varchar("target_id").notNull(),
  action_type: varchar("action_type").notNull(), // "like", "superlike", "dislike"
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  target_id: varchar("target_id").notNull(), // user_id, post_id, comment_id
  reason: varchar("reason").notNull(),
  additional_info: varchar("additional_info").notNull(),
  media: json("media").default([]),
  status: varchar("status").notNull(), // "pending", "resolved", "rejected"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const aichat_chats = pgTable("aichat_chats", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  messages: json("messages").default([]),
  title: varchar("title").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const user_verifications = pgTable("user_verifications", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  media: json("media").default([]),
  status: varchar("status").notNull(), // "pending", "verified", "failed"
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const blocked_users = pgTable("blocked_users", {
  id: varchar("id").primaryKey().notNull(),
  user_id: varchar("user_id").notNull(),
  blocked_user_id: varchar("blocked_user_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ==================== Push Notifications ====================

export const user_push_tokens = pgTable(
  "user_push_tokens",
  {
    id: varchar("id").primaryKey().notNull(),
    user_id: varchar("user_id").notNull(),
    token: varchar("token").notNull(),
    platform: varchar("platform").notNull(), // "ios", "android", "web"
    device_id: varchar("device_id"),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_push_tokens_user_id").on(table.user_id),
    tokenIdx: index("idx_push_tokens_token").on(table.token),
    userActiveIdx: index("idx_push_tokens_user_active").on(
      table.user_id,
      table.is_active,
    ),
  }),
);

// ==================== Subscriptions ====================

export const subscription_plans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().notNull(), // "free", "plus", "pro", "elite"
  name: varchar("name").notNull(),
  description: text("description"),
  price_monthly: integer("price_monthly").default(0), // cents
  price_yearly: integer("price_yearly").default(0), // cents
  features: json("features").default({}), // { see_who_liked: true, priority_matching: false, ... }
  limits: json("limits").default({}), // { swipes_per_day: 10, ai_replies_per_day: 0, ... }
  dodo_product_id: varchar("dodo_product_id"),
  revcat_offering_id: varchar("revcat_offering_id"),
  is_active: boolean("is_active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const user_subscriptions = pgTable(
  "user_subscriptions",
  {
    id: varchar("id").primaryKey().notNull(),
    user_id: varchar("user_id").notNull(),
    plan_id: varchar("plan_id").notNull(), // references subscription_plans.id
    status: varchar("status").notNull().default("active"), // "active", "cancelled", "expired", "paused"
    provider: varchar("provider").notNull(), // "dodo", "revcat", "manual"
    provider_subscription_id: varchar("provider_subscription_id"),
    provider_customer_id: varchar("provider_customer_id"),
    current_period_start: timestamp("current_period_start").notNull(),
    current_period_end: timestamp("current_period_end").notNull(),
    cancel_at_period_end: boolean("cancel_at_period_end").default(false),
    cancelled_at: timestamp("cancelled_at"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_subscriptions_user_id").on(table.user_id),
    statusIdx: index("idx_user_subscriptions_status").on(table.status),
    userActiveIdx: index("idx_user_subscriptions_user_active").on(
      table.user_id,
      table.status,
    ),
  }),
);

// ==================== Streaks ====================

export const match_streaks = pgTable(
  "match_streaks",
  {
    id: varchar("id").primaryKey().notNull(),
    match_id: varchar("match_id").notNull(),
    current_streak: integer("current_streak").default(0),
    longest_streak: integer("longest_streak").default(0),
    last_message_date: timestamp("last_message_date"),
    streak_start_date: timestamp("streak_start_date"),
    she_last_message: timestamp("she_last_message"),
    he_last_message: timestamp("he_last_message"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    matchIdIdx: index("idx_match_streaks_match_id").on(table.match_id),
  }),
);
