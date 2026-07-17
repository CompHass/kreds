---
phase: 12-native-guardian-login
plan: 02
status: complete
requirements: [R5, R6, R7, R9, R12]
completed: 2026-07-17
---

# Phase 12 Plan 02 — Summary

## Delivered

- Added native `/signup` page and client form with server-side action wiring.
- Added Zitadel human-user creation and generic duplicate/error handling.
- Added transactional identity/family/guardian-membership bootstrap with `'Família'` fallback.
- Added pending `guardianInvitations` lookup and idempotent acceptance/update.
- Linked the existing login form's “Criar conta” action to `/signup`.
- Kept password values out of persistence and logs; Postgres failures return a generic result so the next Credentials login can self-heal.

## Verification

- Focused Vitest run passed for the existing Phase 12 client/sync tests; no signup test fixture existed before this plan.
- `npx tsc --noEmit` reports only pre-existing missing modules in older family/glossary tests; no errors in Phase 12 source files.

## Post-completion correction — 2026-07-17

- Corrected the Zitadel v2 human-user payload to use root-level `username`, `profile`, `email`, and `password` fields.
- Added a five-minute, one-time provisional-signup capability stored only as a SHA-256 hash so the newly created unverified guardian can establish exactly the first session.
- Normal unverified Credentials logins remain blocked; invitation-aware recovery no longer creates a duplicate family.
- Added migration `0012_gray_doctor_faustus.sql` for `guardian_signup_tokens`.
