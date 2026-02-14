CREATE TABLE IF NOT EXISTS "reports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"target_id" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"additional_info" varchar NOT NULL,
	"media" json DEFAULT '[]'::json,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
