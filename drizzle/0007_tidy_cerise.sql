CREATE TYPE "public"."donation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."task_completion_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"target_label" text NOT NULL,
	"amount_kreds" integer NOT NULL,
	"status" "donation_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	CONSTRAINT "donation_amount_positive" CHECK ("donations"."amount_kreds" > 0)
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_template_id" uuid NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"cycle_start" text NOT NULL,
	"completed_at" timestamp,
	"status" "task_completion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_template_id_task_templates_id_fk" FOREIGN KEY ("task_template_id") REFERENCES "public"."task_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "donations_family_id_idx" ON "donations" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "donations_child_id_idx" ON "donations" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "task_completions_child_id_idx" ON "task_completions" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "task_completions_task_id_idx" ON "task_completions" USING btree ("task_template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_task_child_cycle" ON "task_completions" USING btree ("task_template_id","child_profile_id","cycle_start");