CREATE TABLE "bible_verses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_templates" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "task_templates" ADD COLUMN "days" jsonb;--> statement-breakpoint
ALTER TABLE "task_templates" ADD COLUMN "approval" boolean DEFAULT false NOT NULL;