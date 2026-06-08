CREATE TYPE "public"."wishlist_goal_status" AS ENUM('active', 'achieved', 'archived');--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'goal_allocation';--> statement-breakpoint
CREATE TABLE "wishlist_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"target_amount" integer NOT NULL,
	"allocated_amount" integer DEFAULT 0 NOT NULL,
	"status" "wishlist_goal_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "target_amount_positive" CHECK ("wishlist_goals"."target_amount" > 0),
	CONSTRAINT "allocated_non_negative" CHECK ("wishlist_goals"."allocated_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "wishlist_goals" ADD CONSTRAINT "wishlist_goals_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_goals" ADD CONSTRAINT "wishlist_goals_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wishlist_goals_child_profile_id_idx" ON "wishlist_goals" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "wishlist_goals_family_id_idx" ON "wishlist_goals" USING btree ("family_id");