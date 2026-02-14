ALTER TABLE "posts" ADD COLUMN "media" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "views" integer DEFAULT 0;