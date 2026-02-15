CREATE TABLE IF NOT EXISTS "subscription_plans" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price_monthly" integer DEFAULT 0,
	"price_yearly" integer DEFAULT 0,
	"features" json DEFAULT '{}'::json,
	"limits" json DEFAULT '{}'::json,
	"dodo_product_id" varchar,
	"revcat_offering_id" varchar,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_subscriptions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"status" varchar NOT NULL DEFAULT 'active',
	"provider" varchar NOT NULL,
	"provider_subscription_id" varchar,
	"provider_customer_id" varchar,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_user_id" ON "user_subscriptions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_status" ON "user_subscriptions" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_user_active" ON "user_subscriptions" USING btree ("user_id","status");
