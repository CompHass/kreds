CREATE TABLE "guardian_signup_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_signup_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "guardian_signup_tokens" ADD CONSTRAINT "guardian_signup_tokens_identity_id_kreds_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guardian_signup_tokens_identity_id_idx" ON "guardian_signup_tokens" USING btree ("identity_id");