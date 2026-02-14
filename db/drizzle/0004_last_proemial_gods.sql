CREATE TABLE IF NOT EXISTS "swipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"action_type" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
