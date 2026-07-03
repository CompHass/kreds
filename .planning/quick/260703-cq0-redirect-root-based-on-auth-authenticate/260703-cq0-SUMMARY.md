---
phase: quick-260703-cq0
plan: 01
subsystem: auth
tags: [nextjs, server-component, redirect, drizzle, auth]

requires:
  - phase: quick-260702-pr6
    provides: child-session privilege escalation guard on /family/* and /guardian/*
provides:
  - Auth-aware root page redirect (unauthenticated -> /login, guardian -> /family/{familyId}/tasks)
affects: [family, auth]

tech-stack:
  added: []
  patterns:
    - "Root page mirrors /family/page.tsx session+membership resolution pattern, differing only in final redirect target"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Root redirects straight to /family/{familyId}/tasks (tasks dashboard), not /family/access/{familyId} (profile selection) — explicit product requirement to skip profile-selection screen for guardians landing on /"
  - "Missing identity/membership fallback to /login (not an error page) — mirrors existing /family/page.tsx fallback behavior for consistency"

patterns-established:
  - "Async Server Component root routing: auth() -> identity lookup -> active membership lookup -> redirect, no JSX render path"

requirements-completed: [CQ0-ROOT-REDIRECT]

duration: 5min
completed: 2026-07-03
---

# Quick Task 260703-cq0: Redirect Root Based On Auth State Summary

**Root `/` is now an async Server Component that resolves session + active family membership and redirects to `/login` or `/family/{familyId}/tasks`, replacing the static "Kreds v2.0" placeholder.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-03T12:07:00Z
- **Completed:** 2026-07-03T12:12:28Z
- **Tasks:** 1 (auto) + 1 checkpoint (pending human verification)
- **Files modified:** 1

## Accomplishments
- `src/app/page.tsx` rewritten as an `async` default-exported Server Component with no JSX render path
- Unauthenticated visitors, missing-identity sessions, and missing-active-membership sessions all redirect to `/login`
- Authenticated guardians with an active family membership redirect directly to their tasks dashboard at `/family/{familyId}/tasks`, skipping the profile-selection screen

## Task Commits

Each task was committed atomically:

1. **Task 1: Make root page redirect based on auth + family membership** - `4cb1f3d` (feat)

Task 2 is a `checkpoint:human-verify` (gate=blocking) — no code changes, pending human verification (see below).

## Files Created/Modified
- `src/app/page.tsx` - Converted from static placeholder to async Server Component resolving `auth()`, identity, and active family membership, redirecting to `/login` or `/family/{familyId}/tasks`

## Decisions Made
- Mirrored `src/app/family/page.tsx` resolution logic exactly (session -> identity by `zitadelSubject` -> active `familyMemberships` row), differing only in the final redirect target (`/family/{familyId}/tasks` instead of `/family/access/{familyId}`)
- Import path for `auth` from `src/app/page.tsx` is `'../../auth'` (one level shallower than `family/page.tsx`'s `'../../../auth'`) since `page.tsx` sits at `src/app/` not `src/app/family/`
- Did not touch `src/middleware.ts` — `/` is already a public pass-through (line 19), and the redirect logic belongs entirely in the page component, matching the existing `/family` architecture

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Pending Human Verification (Task 2 — checkpoint:human-verify, gate=blocking)

**This checkpoint was NOT approved during this execution run** and must be verified against the deployed environment, consistent with this project's established post-deploy verification pattern (see STATE.md 08-05 precedent).

**What was built:** Root `/` now redirects based on auth state instead of showing the static "Kreds v2.0" placeholder. Unauthenticated -> `/login`; authenticated guardian -> `/family/{familyId}/tasks`.

**How to verify (on https://kreds.hasslab.pro after deploy):**
1. In a private/incognito window (logged out), visit `https://kreds.hasslab.pro/` — should redirect to `/login`, not show the "Kreds v2.0" placeholder.
2. Log in as a guardian with an active family membership, then visit `https://kreds.hasslab.pro/` — should land directly on `/family/{yourFamilyId}/tasks` (the tasks dashboard), NOT the profile-selection screen at `/family/access/{familyId}`.
3. Confirm no redirect loop occurs on either path (address bar settles on a single final URL).

**Resume signal:** Type "approved" or describe what went wrong (e.g., redirect loop, landed on wrong page).

**Status:** BLOCKING — do not consider this quick task fully verified until the above is confirmed post-deploy.

## Next Phase Readiness
- Code change is complete, committed (`4cb1f3d`), and typechecks clean
- Blocked on human verification against the deployed environment before this quick task can be marked fully done
- No impact on Phase 09 planning — this is an independent quick task

---
*Phase: quick-260703-cq0*
*Completed: 2026-07-03*

## Self-Check: PASSED

- FOUND: src/app/page.tsx
- FOUND: .planning/quick/260703-cq0-redirect-root-based-on-auth-authenticate/260703-cq0-SUMMARY.md
- FOUND: 4cb1f3d
