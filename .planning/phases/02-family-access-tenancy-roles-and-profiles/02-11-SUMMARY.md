---
phase: 02-family-access-tenancy-roles-and-profiles
plan: 11
subsystem: child-access-auth
tags: [family, child-auth, jwt, rate-limit, public-access]
requires: [02-10, FAM-03, FAM-05]
provides: [child-session-jwt, child-auth-endpoint, public-child-access-page]
affects:
  - src/lib/families/child-session.ts
  - tests/unit/child-auth-endpoint.test.ts
  - src/app/api/families/[familyId]/child-auth/route.ts
  - src/app/family/access/[familyId]/page.tsx
  - src/app/family/access/[familyId]/ChildAccessForm.tsx
  - src/app/family/children/page.tsx
decisions:
  - Used jose HS256 child-session JWTs with an 8-hour cookie/session lifetime.
  - Kept brute-force protection in module memory at 5 attempts per 15 minutes per child profile for MVP scope.
  - Kept new user-facing copy in English to satisfy repo AGENTS.md even where the plan examples used Portuguese.
metrics:
  completed_at: 2026-06-08T11:30:00Z
  duration: unknown
---

# Phase 02 Plan 11: Child access entry and PIN auth Summary

Public child family access page with profile selection, PIN authentication endpoint, signed child-session JWT cookie, and in-memory brute-force protection.

## Completed Work

- Added `signChildSession`, `verifyChildSession`, `getChildSession`, and brute-force helpers in `src/lib/families/child-session.ts` using `jose` HS256.
- Added `tests/unit/child-auth-endpoint.test.ts` with 7 passing tests for JWT and brute-force behavior.
- Added `POST /api/families/[familyId]/child-auth` with profile lookup, PIN verification, audit events, `last_accessed_at` update, and secure `child-session` cookie issuance.
- Added public `/family/access/[familyId]` page plus `ChildAccessForm.tsx` to select a child profile and submit a PIN without guardian auth.
- Added a guardian-facing `Child access link` shortcut on `/family/children`.

## Deviations from Plan

### Auto-fixed Issues

1. [AGENTS.md adjustment] Child access page and endpoint copy kept in English
   - Found during: Tasks 2 and 3
   - Issue: Plan examples used Portuguese strings, but repo rules require new user-facing copy in English.
   - Fix: Returned English UI and most endpoint messages while preserving the planned 429 behavior.

2. [Rule 3 - Blocking issue] JWT tests required node runtime
   - Found during: Task 1 verification
   - Issue: `jose` signing failed under the default Vitest browser environment.
   - Fix: Marked the test file with `@vitest-environment node` and re-ran verification successfully.

## Known Stubs

- `src/app/family/access/[familyId]/ChildAccessForm.tsx`: successful auth redirects to `/child/{childProfileId}/dashboard`, which is expected to be finalized by plan 02-12.

## Threat Flags

None.

## Verification Evidence

- `DATABASE_URL="https://example.com" AUTH_SECRET="test-auth-secret" CHILD_SESSION_SECRET="0123456789abcdef0123456789abcdef" AUTH_ZITADEL_ID="test-id" AUTH_ZITADEL_SECRET="test-secret" pnpm vitest run tests/unit/child-auth-endpoint.test.ts` ✅
- `CHILD_SESSION_SECRET="0123456789abcdef0123456789abcdef" DATABASE_URL="https://example.com" AUTH_SECRET="test-auth-secret" AUTH_ZITADEL_ID="test-id" AUTH_ZITADEL_SECRET="test-secret" pnpm build` ✅

## Blockers

- `git` is currently on protected branch `main`, so per executor safety rules task commits and final docs/state commits were not allowed.
- `gsd-tools` is not installed in this environment, so automated `.planning/STATE.md` and roadmap updates could not run.

## Self-Check: PASSED

- Verified implementation files and this summary file exist.
- Verified fresh test and build commands passed in the current turn.
