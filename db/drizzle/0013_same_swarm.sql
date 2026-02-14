CREATE TABLE IF NOT EXISTS "blocked_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"blocked_user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
