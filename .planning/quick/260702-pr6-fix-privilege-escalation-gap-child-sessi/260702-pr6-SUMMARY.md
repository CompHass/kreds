---
phase: quick-260702-pr6
plan: 01
subsystem: auth
tags: [middleware, jwt, jose, next-auth, privilege-escalation, server-actions]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: child-session JWT signing/verification (CHILD_SESSION_SECRET, /child/* guard pattern)
provides:
  - child-session guard on /family/* and /guardian/* middleware branches, closing PR6 privilege-escalation gap
  - exitChildProfile server action + garden view UI trigger for guardians to reclaim a device
affects: [auth, family-management, child-garden]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reused existing /child/* jwtVerify + try/catch pattern for the /family/* + /guardian/* branch, keeping a single verification style across middleware"
    - "server-only mock convention (vi.mock('server-only', () => ({})) — established in 06-01) reapplied to garden-view.test.tsx once a client component transitively imports a server-only module via a server action"

key-files:
  created: []
  modified:
    - src/middleware.ts
    - tests/unit/middleware.test.ts
    - src/app/actions/child-auth.ts
    - src/components/garden/garden-view.tsx
    - tests/unit/garden-view.test.tsx

key-decisions:
  - "child-session guard runs before the next-auth presence check in the /family/* + /guardian/* branch — a verified role=child token always wins, even with a valid next-auth cookie present"
  - "Unverifiable child-session tokens (expired/malformed) are never trusted and fall through unchanged to the existing next-auth check — no payload field read before jwtVerify succeeds (CR-02 precedent)"
  - "exitChildProfile takes no arguments, does not call redirect(), and returns { success: true } — navigation is left to the client via useRouter().push('/')"

patterns-established:
  - "Middleware child-session guard is now applied uniformly on /child/*, /family/*, and /guardian/* branches using the same jwtVerify + try/catch shape"

requirements-completed: [PR6-FIX]

# Metrics
duration: 15min
completed: 2026-07-02
---

# Quick Task 260702-pr6 Summary

**Closed a privilege-escalation gap where a child's child-session JWT coexisting with a guardian's next-auth cookie let a child reach /family/* and /guardian/* routes; added a guardian "exit child profile" action.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-02T21:26:00Z
- **Completed:** 2026-07-02T21:41:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `src/middleware.ts` now verifies the `child-session` JWT (jose `jwtVerify`) before the next-auth cookie presence check on `/family/*` and `/guardian/*` — a verified `role=child` token redirects to `/family/access/{familyId}` even when a valid next-auth cookie is also present on the device.
- Expired/malformed child-session cookies are never trusted and fall through unchanged to the existing next-auth check, so a guardian is never blocked by a stale child token.
- New `exitChildProfile` server action clears the `child-session` cookie; `GardenView` exposes a "Sair do perfil da criança" trigger that calls it and routes back to `/`.
- Extended `tests/unit/middleware.test.ts` with 5 new test cases (Tests 13-17) covering the guard, its precedence over next-auth, and safe fall-through on invalid tokens — all 21 middleware tests pass.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing tests for child-session guard** - `b6b0925` (test)
2. **Task 1 (GREEN): child-session guard in middleware** - `9e5611b` (feat)
3. **Task 2: exitChildProfile action + garden view trigger** - `420052b` (feat)

**Plan metadata:** committed separately by orchestrator (docs, not part of this agent's scope)

_Note: Task 1 followed TDD (RED then GREEN); Task 2 was `type="auto"` without a `tdd="true"` flag but a supporting test fix was folded into its commit (see Deviations)._

## Files Created/Modified
- `src/middleware.ts` - Added child-session `jwtVerify` guard to the `/family/*` + `/guardian/*` branch, running before the next-auth cookie presence check
- `tests/unit/middleware.test.ts` - Added Tests 13-17 covering guard precedence, no-next-auth-cookie case, and expired/malformed fall-through
- `src/app/actions/child-auth.ts` - Added `exitChildProfile` server action that deletes the `child-session` cookie
- `src/components/garden/garden-view.tsx` - Added a "Sair do perfil da criança" button that calls `exitChildProfile` then `router.push('/')`
- `tests/unit/garden-view.test.tsx` - Added `vi.mock('server-only', ...)`, `vi.mock('@/app/actions/child-auth', ...)`, and `vi.mock('next/navigation', ...)` to keep the existing 3 tests passing after the new import chain was introduced

## Decisions Made
- Guard placement: child-session check placed as the first statement inside the existing `/family/*` + `/guardian/*` `if` block, reusing the same secret/verify pattern as the `/child/*` branch rather than extracting a shared helper — plan explicitly scoped the change to this block only, and the duplication is small (mirrors an already-duplicated pattern in this file).
- `exitChildProfile` intentionally does not call `redirect()` server-side, matching the plan's requirement to let the client decide navigation via `useRouter().push('/')`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed garden-view.test.tsx regression caused by new import chain**
- **Found during:** Task 2 (exitChildProfile + garden view trigger)
- **Issue:** `garden-view.tsx` (a `'use client'` component) now imports `exitChildProfile` from `child-auth.ts`, which imports `child-session.ts` marked `import 'server-only'`. In the Vitest/jsdom client-component test environment, this import chain throws `This module cannot be imported from a Client Component module` and failed all 3 existing `garden-view.test.tsx` tests (previously passing, verified via `git stash`).
- **Fix:** Added `vi.mock('server-only', () => ({}))` (existing project convention from 06-01, used for `engine.ts`), plus `vi.mock('@/app/actions/child-auth', ...)` and `vi.mock('next/navigation', ...)` so the test environment doesn't need to resolve the real server-only chain or a real router.
- **Files modified:** tests/unit/garden-view.test.tsx
- **Verification:** `npx vitest run tests/unit/garden-view.test.tsx` — 3/3 tests pass again.
- **Committed in:** 420052b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix, directly caused by this plan's own Task 2 change)
**Impact on plan:** Necessary to avoid leaving a regression in the test suite. No scope creep — fix is confined to the test file whose import graph this plan's own change altered.

## Issues Encountered
- `docker compose exec app npx vitest ...` fails (`npx not found` — production runner image has no devDependencies, per existing 08-03/08-04 STATE.md decisions). Ran tests locally via `npx vitest run` and `npx tsc --noEmit -p tsconfig.json` instead, consistent with the established project pattern.
- `npx tsc --noEmit -p tsconfig.json` reports pre-existing errors in `tests/integration/family-audit-isolation.test.ts`, `tests/integration/family-invitations.test.ts`, `tests/unit/family-authorization.test.ts`, `tests/unit/family-constants.test.ts`, `tests/unit/family-invitations.test.ts`, and `tests/unit/glossary.test.ts` (missing modules: `families/audit`, `families/invitations`, `auth/authorization`, `families/avatar-presets`, `modules/glossary/terms`). None of these files were touched by this plan and none reference `middleware.ts`, `child-auth.ts`, or `garden-view.tsx` — confirmed out of scope per the executor's scope-boundary rule, not fixed.
- `npx vitest run` (full suite) shows the same pre-existing failures plus e2e specs (require a running server) and integration tests (require Testcontainers/DB) — all pre-existing and unrelated to this plan's files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PR6 privilege-escalation gap is closed; `/family/*` and `/guardian/*` middleware branches now correctly resolve precedence when both a child-session and next-auth cookie are present on the same device.
- Guardians have a working device-reclaim path (`exitChildProfile` + garden view trigger) without needing to re-authenticate via Zitadel.
- Pre-existing missing-module test failures (see Issues Encountered) remain unresolved and are unrelated to this quick task — logged here for visibility, not deferred-items.md since no phase directory context applies to a quick task.
- 08-05 Task 3 checkpoint (human-verify against https://kreds.hasslab.pro) from the prior in-progress phase remains outstanding and is unaffected by this quick task.

---
*Phase: quick-260702-pr6*
*Completed: 2026-07-02*

## Self-Check: PASSED

All created/modified files verified present on disk; all 3 task commit hashes (b6b0925, 9e5611b, 420052b) verified present in git log.
