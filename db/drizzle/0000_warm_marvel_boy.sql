CREATE TABLE IF NOT EXISTS "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"messages" json DEFAULT '[]'::json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" varchar NOT NULL,
	"reply_to_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"she_id" varchar NOT NULL,
	"he_id" varchar NOT NULL,
	"score" integer NOT NULL,
	"post_unlock_rating" json DEFAULT '{}'::json,
	"is_unlocked" boolean DEFAULT false,
	"matched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"dob" timestamp NOT NULL,
	"gender" varchar NOT NULL,
	"pfp" varchar DEFAULT '',
	"bio" text NOT NULL,
	"hobbies" json DEFAULT '[]'::json,
	"interests" json DEFAULT '[]'::json,
	"user_prompts" json DEFAULT '[]'::json,
	"personality_traits" json DEFAULT '{}'::json,
	"photos" json DEFAULT '[]'::json,
	"is_verified" boolean DEFAULT false,
	"address" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
