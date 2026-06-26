---
phase: 06-api-integration
plan: 03
subsystem: api
tags: [harvest, route-handler, child-auth, idempotency, ledger, zod, drizzle, security]

# Dependency graph
requires:
  - phase: 06-01
    provides: calculateFirstfruits() — 10% ceiling math; ledger Drizzle schema (ledgerTransactions + ledgerLines)
  - phase: 02-authentication
    provides: verifyChildSession() JWT verification; validateChildSessionScope() ownership guard; child-session cookie
provides:
  - POST /api/child/[childId]/harvest — auth-guarded, idempotent harvest endpoint
  - commandId unique-index idempotency at DB level (23505 → 409)
  - firstfruits split via calculateFirstfruits() applied before atomic write
  - session.familyId used for ledger insert (body.familyId rejected — T-06-13)
affects: [06-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Child session cookie auth: verifyChildSession() + validateChildSessionScope() before any DB write"
    - "23505 PG unique violation caught OUTSIDE db.transaction() call — catches transaction-level unique violations correctly"
    - "session.familyId used for insert instead of body.familyId — prevents cross-family ledger forgery"
    - "await params in Next.js 15+ Route Handlers — params is a Promise<{ childId: string }>"
    - "Zod z.number().int().positive() rejects floats, zero, and negative totalAmount before calculateFirstfruits is called"

key-files:
  created:
    - src/app/api/child/[childId]/harvest/route.ts

key-decisions:
  - "06-03: 23505 caught outside db.transaction() — if caught inside, the transaction has already aborted and catching there would swallow the error silently"
  - "06-03: session.familyId used for DB insert (not body.familyId) — signed JWT cannot be forged; body familyId validated by Zod schema but not used in insert (T-06-13)"
  - "06-03: validateChildSessionScope() returns false when session.role !== 'child' — guards against token type confusion (e.g. guardian token used on child route)"

patterns-established:
  - "Harvest idempotency: commandId unique index + 23505 catch outside transaction = safe replay"
  - "Child endpoint auth: cookie → verifyChildSession → validateChildSessionScope(session, childId from URL)"

requirements-completed: [API-03]

# Metrics
duration: 8min
completed: 2026-06-26
---

# Phase 06 Plan 03: Harvest Route Handler Summary

**POST /api/child/[childId]/harvest — child session auth + Zod validation + atomic ledger write with 23505 idempotency guard (API-03)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-26T23:54:00Z
- **Completed:** 2026-06-26T23:59:00Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments

- Created `POST /api/child/[childId]/harvest` route handler — the most security-critical endpoint in Phase 6
- Auth guard: reads `child-session` cookie, verifies JWT via `verifyChildSession()`, enforces ownership via `validateChildSessionScope(session, childId)` — prevents child A harvesting for child B
- Zod `HarvestBodySchema` rejects: non-UUID `commandId`, float `totalAmount`, zero/negative `totalAmount`, missing `familyId`
- Calculates firstfruits split via `calculateFirstfruits(totalAmount)` — 10% ceiling (e.g. 7 → firstfruits=1, available=6)
- Atomic write in `db.transaction()`: inserts one `ledgerTransactions` header + two `ledgerLines` (available + firstfruits)
- Idempotency: `commandId` unique index enforces no duplicates at DB level; 23505 error caught OUTSIDE transaction → 409 `{error: 'Already harvested'}`
- Security: uses `session.familyId` for DB insert (not `body.familyId`) — prevents cross-family ledger writes (T-06-13 mitigated)
- TypeScript clean: `pnpm tsc --noEmit` — no errors in `src/`
- All 9 success criteria from the plan verified

## Task Commits

1. **Task 1: Harvest Route Handler** — `0d4b715`

## Files Created/Modified

- `src/app/api/child/[childId]/harvest/route.ts` — POST handler with full auth, Zod validation, atomic write, 409 idempotency

## Decisions Made

- `23505` is caught OUTSIDE the `db.transaction()` call. If caught inside the callback, the transaction has already been aborted by PostgreSQL and the catch would suppress the error — the outer catch is the correct interception point for unique constraint violations in Drizzle.
- `session.familyId` is used for the `ledgerTransactions.familyId` column, not `result.data.familyId` from the parsed body. The JWT is signed with `CHILD_SESSION_SECRET` and cannot be forged; the body's `familyId` field is validated by Zod (UUID format) but intentionally ignored for the insert to prevent cross-family forgery.
- `validateChildSessionScope()` also checks `session.role !== 'child'` — a guardian token with a matching `childProfileId` would still be rejected, preventing token type confusion attacks.

## Deviations from Plan

None — plan executed exactly as written. All security constraints from the threat model were applied as specified.

## Threat Surface Scan

New network endpoint introduced in this plan:

| Flag | File | Description |
|------|------|-------------|
| POST endpoint | `src/app/api/child/[childId]/harvest/route.ts` | Writes to ledger — all 6 threat mitigations implemented (T-06-09 through T-06-14) |

**STRIDE threat mitigations verified:**

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-06-09 | `verifyChildSession()` validates JWT signature; missing/expired token → 401 | Implemented |
| T-06-10 | `validateChildSessionScope()` checks `session.childProfileId === childId` from URL | Implemented |
| T-06-11 | Unique index on `commandId` + catch 23505 outside transaction → 409 | Implemented |
| T-06-12 | `z.number().int().positive()` rejects floats before `calculateFirstfruits` | Implemented |
| T-06-13 | `session.familyId` used for insert — body.familyId ignored | Implemented |
| T-06-14 | `z.number().positive()` rejects zero and negative values | Implemented |

## Known Stubs

None — this is a pure backend endpoint. No UI wiring in this plan (Plan 06-04 will wire the GardenView harvest button).

## Next Phase Readiness

- `POST /api/child/[childId]/harvest` ready for Plan 06-04 to wire the `HarvestButton` in `GardenView`
- Idempotency contract established: client must generate a `commandId` UUID before POSTing and may retry with the same UUID safely (409 on replay = success from client perspective)
- Session cookie auth pattern (`child-session`) matches what Phase 02 established

## Self-Check

- [x] `src/app/api/child/[childId]/harvest/route.ts` — FOUND
- [x] Commit `0d4b715` — FOUND in git log
- [x] TypeScript clean in `src/` — VERIFIED (no errors in route file)
- [x] `await params` pattern — VERIFIED (line 22)
- [x] `23505` catch outside transaction — VERIFIED (lines 63, 104)
- [x] `session.familyId` used for insert — VERIFIED (line 72)
- [x] `validateChildSessionScope` called — VERIFIED (line 40)

## Self-Check: PASSED

---
*Phase: 06-api-integration*
*Completed: 2026-06-26*
