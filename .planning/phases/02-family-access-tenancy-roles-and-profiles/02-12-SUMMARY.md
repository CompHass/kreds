---
phase: 02-family-access-tenancy-roles-and-profiles
plan: 12
subsystem: child-session-surfaces
tags: [family, child-auth, child-home, audit]
requires: [02-10, 02-11, FAM-05, FAM-07]
provides: [require-child-session, child-home-page, child-logout-route, child-login-audit-visibility]
affects:
  - src/lib/auth/child-guard.ts
  - src/app/child/home/page.tsx
  - src/app/api/child/logout/route.ts
  - src/app/family/audit/page.tsx
  - tests/unit/child-session-guard.test.ts
decisions:
  - Added a server-only child session guard that redirects unauthenticated child access to `/`.
  - Scoped child home data reads strictly by `childProfileId` and avoided family-wide enumeration.
  - Kept the new child home copy in English to satisfy repo AGENTS.md while preserving the existing Portuguese guardian audit UI.
metrics:
  completed_at: 2026-06-08T11:35:00Z
  duration: unknown
---

# Phase 02 Plan 12: Child session gating and guardian audit summary

Child session guard, first authenticated child home page, logout route, and guardian audit visibility for child login activity and last access timestamps.

## Completed Work

- Added `requireChildSession`, `validateChildSessionScope`, `extractChildProfileId`, and `extractFamilyId` in `src/lib/auth/child-guard.ts`.
- Added `tests/unit/child-session-guard.test.ts` with 6 passing unit tests for scope enforcement helpers.
- Added `/child/home` as a gated server-rendered child page that loads only the authenticated child's profile by `childProfileId`.
- Added `GET` and `POST` `/api/child/logout` handlers that clear the `child-session` cookie and redirect to `/`.
- Updated the guardian audit page to label `child_login_success` and `child_login_failed` events and show `lastAccessedAt` for active child profiles.

## Deviations from Plan

### Auto-fixed Issues

1. [Rule 3 - Blocking issue] Unit test env bootstrap was required
   - Found during: Task 1 verification
   - Issue: `child-session` imports env validation eagerly, so the new test file failed before running assertions.
   - Fix: Seeded the required env vars at the top of `tests/unit/child-session-guard.test.ts` before dynamic imports.

2. [AGENTS.md adjustment] New child-facing copy was kept in English
   - Found during: Task 2
   - Issue: The plan examples used Portuguese copy, but repo rules require new user-facing copy to default to English.
   - Fix: The new `/child/home` labels and actions use English; the existing guardian audit surface remains in Portuguese.

## Known Stubs

- `src/app/child/home/page.tsx`: `/child/{childProfileId}/tasks` is linked as planned future functionality and depends on a later phase implementing the child tasks route.

## Threat Flags

None.

## Verification Evidence

- `pnpm vitest run tests/unit/child-session-guard.test.ts` ✅
- `CHILD_SESSION_SECRET="0123456789abcdef0123456789abcdef" DATABASE_URL="https://example.com" AUTH_SECRET="test-auth-secret" AUTH_ZITADEL_ID="test-id" AUTH_ZITADEL_SECRET="test-secret" pnpm build` ✅

## Blockers

- `git` is currently on protected branch `main`, so executor safety rules prevented per-task commits and the final docs commit.
- `gsd-tools` is not installed in this environment, so automated `.planning/STATE.md`, roadmap, and requirements updates could not run.

## Self-Check: PASSED

- Verified all implementation files and this summary file exist in the current worktree.
- Verified fresh unit test and build commands passed in the current turn.
