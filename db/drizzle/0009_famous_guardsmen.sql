CREATE INDEX IF NOT EXISTS "idx_comments_post_id" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_reply_to_id" ON "comments" USING btree ("reply_to_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_user_id" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "posts" USING btree ("created_at" DESC);
