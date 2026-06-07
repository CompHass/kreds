CREATE TYPE "public"."account_type" AS ENUM('available', 'firstfruits');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('task_earning', 'negative_adjustment', 'reversal', 'donation_match');--> statement-breakpoint
CREATE TABLE "ledger_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"account_type" "account_type" NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "non_zero_amount" CHECK ("ledger_lines"."amount" != 0)
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"command_id" uuid NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"initiated_by_identity_id" uuid,
	"corrects_transaction_id" uuid,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "no_self_correction" CHECK ("ledger_transactions"."corrects_transaction_id" IS NULL OR "ledger_transactions"."corrects_transaction_id" != "ledger_transactions"."id")
);
--> statement-breakpoint
DROP INDEX "unique_pending_invite";--> statement-breakpoint
ALTER TABLE "ledger_lines" ADD CONSTRAINT "ledger_lines_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_lines" ADD CONSTRAINT "ledger_lines_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_initiated_by_identity_id_kreds_identities_id_fk" FOREIGN KEY ("initiated_by_identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_lines_transaction_id_idx" ON "ledger_lines" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_lines_child_profile_id_idx" ON "ledger_lines" USING btree ("child_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_transactions_command_id_unique" ON "ledger_transactions" USING btree ("command_id");--> statement-breakpoint
CREATE INDEX "ledger_transactions_child_profile_id_idx" ON "ledger_transactions" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "ledger_transactions_family_id_idx" ON "ledger_transactions" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pending_invite" ON "guardian_invitations" USING btree ("family_id","email") WHERE "guardian_invitations"."status" = 'pending';