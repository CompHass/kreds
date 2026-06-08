CREATE TABLE "task_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"assigned_child_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kreds_value" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kreds_value_positive" CHECK ("task_templates"."kreds_value" > 0)
);
--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_assigned_child_id_child_profiles_id_fk" FOREIGN KEY ("assigned_child_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_templates_family_id_idx" ON "task_templates" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "task_templates_child_id_idx" ON "task_templates" USING btree ("assigned_child_id");