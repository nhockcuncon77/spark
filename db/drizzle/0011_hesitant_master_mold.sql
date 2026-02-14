CREATE TABLE IF NOT EXISTS "aichat_chats" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"messages" json DEFAULT '[]'::json,
	"title" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
