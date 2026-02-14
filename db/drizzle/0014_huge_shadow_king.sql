ALTER TABLE "matches" ADD COLUMN "she_messages" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "he_messages" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blurred_photos" json DEFAULT '[]'::json;