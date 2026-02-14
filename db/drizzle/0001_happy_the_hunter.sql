CREATE TABLE IF NOT EXISTS "user_files" (
	"id" varchar PRIMARY KEY NOT NULL,
	"uid" varchar NOT NULL,
	"key" varchar NOT NULL,
	"s3_path" varchar NOT NULL,
	"visibility" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
