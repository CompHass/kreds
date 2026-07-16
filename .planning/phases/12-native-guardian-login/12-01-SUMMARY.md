---
phase: 12-native-guardian-login
plan: 01
status: complete
requirements: [R1, R2, R3, R4, R10, R12]
completed: 2026-07-16
---

# Phase 12 Plan 01 — Summary

## Delivered

- Added fail-closed parsing for the server-only `IAM_LOGIN_CLIENT` JWT-profile key.
- Added `src/lib/zitadel/login-client.ts` with RS256 assertion signing, OAuth token exchange, Session API login, user lookup, grants lookup, and safe error normalization.
- Added `src/lib/auth/guardian-sync.ts` to upsert `kreds_identities` and bootstrap an active guardian family/membership when absent.
- Added Auth.js Credentials provider alongside the existing Zitadel OIDC provider.
- Native credentials login now forwards email/password to `signIn('credentials')`; social and passkey actions remain on OIDC.
- Native login detects unverified email and returns the existing `/login?error=email-not-verified` route.
- Added focused tests for Zitadel error normalization, profile/grant mapping, and role extraction.

## Verification

- `npx vitest run tests/unit/zitadel-login-client.test.ts tests/unit/guardian-sync.test.ts` — 2 files, 3 tests passed.
- Targeted TypeScript check has no errors in Phase 12 files.
- `git diff --check` passed.
- Full Vitest run: 37 files passed / 235 tests passed; remaining failures are pre-existing missing modules, Testcontainers/Podman environment errors, and Playwright files being included in Vitest.

## Notes

- The live-documented `POST /v2/sessions` response may omit `userId`; the client falls back to Management API user search by login name before loading the profile.
- No real service-account secret was added. Tests use a synthetic RSA key through `tests/setup.ts`.
- Existing unrelated working-tree changes were preserved and not staged or committed.
