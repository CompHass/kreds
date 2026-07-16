CREATE TABLE "notification_preferences" (
	"family_id" uuid PRIMARY KEY NOT NULL,
	"task_completed" boolean DEFAULT true NOT NULL,
	"goal_achieved" boolean DEFAULT true NOT NULL,
	"weekly_report_ready" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "cycle_start_day" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "cycle_start_day_range" CHECK ("families"."cycle_start_day" >= 0 AND "families"."cycle_start_day" <= 6);