CREATE TYPE "public"."family_role" AS ENUM('guardian', 'child');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked', 'declined');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"age_years" integer NOT NULL,
	"avatar_preset" text NOT NULL,
	"accent_color" text NOT NULL,
	"identity_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"actor_identity_id" uuid,
	"event_type" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"identity_id" uuid,
	"child_profile_id" uuid,
	"role" "family_role" NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "one_member_target" CHECK (("family_memberships"."identity_id" IS NOT NULL AND "family_memberships"."child_profile_id" IS NULL) OR ("family_memberships"."identity_id" IS NULL AND "family_memberships"."child_profile_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "guardian_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"email" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_identity_id" uuid,
	"accepted_by_identity_id" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kreds_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zitadel_subject" text NOT NULL,
	"email" text,
	"email_verified" boolean DEFAULT false,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kreds_identities_zitadel_subject_unique" UNIQUE("zitadel_subject")
);
--> statement-breakpoint
CREATE TABLE "parental_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"guardian_identity_id" uuid NOT NULL,
	"consent_type" text NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"source" text
);
--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "created_by_identity_id" uuid;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "deactivated_at" timestamp;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_audit_events" ADD CONSTRAINT "family_audit_events_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_audit_events" ADD CONSTRAINT "family_audit_events_actor_identity_id_kreds_identities_id_fk" FOREIGN KEY ("actor_identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_identity_id_kreds_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_invitations" ADD CONSTRAINT "guardian_invitations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_invitations" ADD CONSTRAINT "guardian_invitations_invited_by_identity_id_kreds_identities_id_fk" FOREIGN KEY ("invited_by_identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_invitations" ADD CONSTRAINT "guardian_invitations_accepted_by_identity_id_kreds_identities_id_fk" FOREIGN KEY ("accepted_by_identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_guardian_identity_id_kreds_identities_id_fk" FOREIGN KEY ("guardian_identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "child_profiles_family_id_idx" ON "child_profiles" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_audit_events_family_id_idx" ON "family_audit_events" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_memberships_family_id_idx" ON "family_memberships" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_guardian" ON "family_memberships" USING btree ("family_id","identity_id");--> statement-breakpoint
CREATE INDEX "guardian_invitations_family_id_idx" ON "guardian_invitations" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pending_invite" ON "guardian_invitations" USING btree ("family_id","email") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "parental_consents_family_id_idx" ON "parental_consents" USING btree ("family_id");--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_created_by_identity_id_kreds_identities_id_fk" FOREIGN KEY ("created_by_identity_id") REFERENCES "public"."kreds_identities"("id") ON DELETE no action ON UPDATE no action;