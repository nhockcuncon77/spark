CREATE TABLE IF NOT EXISTS "user_profile_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
