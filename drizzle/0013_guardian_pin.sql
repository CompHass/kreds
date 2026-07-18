-- Phase 13: guardian PIN gate. bcrypt hash shared by all guardians of a family
-- (mirrors child_profiles.pin_hash). Null until first guardian-setup; while null,
-- /family/* routes redirect to the setup flow. See guardian-auth.ts + guardian-session.ts.
ALTER TABLE "families" ADD COLUMN "guardian_pin_hash" text;
