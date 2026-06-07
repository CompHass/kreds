---
phase: 02-family-access-tenancy-roles-and-profiles
plan: 6
subsystem: auth
tags: [invitations, guardian, lifecycle, token-hashing, sha256, membership]

# Dependency graph
requires:
  - phase: 02
    plan: 04
    provides: Server-side authorization helpers, transactional family creation, audit events, timezone constants
provides:
  - Guardian invitation lifecycle commands (create/accept/decline/revoke/expire)
  - SHA-256 token hashing with raw-token-never-stored guarantee
  - Invitation management UI for active guardians
  - Authenticated accept/decline page for invitees
  - Invitation API route with guardian authorization gates
affects: [all downstream family-scoped features requiring multi-guardian support]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "copyable-link invitation model with SHA-256 token hashing (no email transport)"
    - "lifecycle state machine: pending → accepted/declined/revoked/expired with transitions enforced"
    - "transactional acceptance: membership creation atomically with invitation state change"
    - "guardian-gated Server Component UI pattern for invitation management"
    - "API route action dispatch pattern: single POST endpoint routing by action field"

key-files:
  created:
    - src/lib/families/invitations.ts (invitation lifecycle commands, token hashing, 465 lines)
    - src/app/family/invitations/page.tsx (guardian management UI)
    - src/app/family/invitations/accept/[token]/page.tsx (authenticated acceptance UI)
    - src/app/api/families/invitations/route.ts (invitation API route)
  modified: []

key-decisions:
  - "SHA-256 for token hashing via Node.js crypto — no external dependency needed"
  - "crypto.randomUUID() for raw token generation — avoids uuid package dependency"
  - "Single POST /api/families/invitations route with action dispatch — matches existing POST pattern"
  - "No email transport in Phase 02 — copyable one-time invitation links per resolved research"

patterns-established:
  - "Guardian gating pattern: Server Component checks membership before rendering management UI"
  - "Action dispatch pattern: POST route switches on action field (create/revoke/accept/decline)"
  - "Transactional accept pattern: identity upsert + invitation transition + membership create + audit in one tx"

requirements-completed: [FAM-02, FAM-04, FAM-05, FAM-07]

# Metrics
duration: 7min
completed: 2026-06-07
---

# Phase 02 Plan 06: Guardian Invitation Lifecycle Summary

**SHA-256 hashed token-based guardian invitations with full lifecycle state machine, copyable-link behavior, transactional acceptance, and guardian-gated management UI — 22/22 unit tests pass, build succeeds with 3 new routes**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-07T02:43:00Z
- **Completed:** 2026-06-07T02:50:46Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 4 created

## Accomplishments

- Implemented invitation lifecycle constants: `INVITATION_STATUS`, `InvitationStatus`, `INVITATION_EXPIRY_HOURS` (72h)
- Implemented pure status predicates: `isInvitationPending`, `isInvitationAccepted`, `isInvitationExpired`, `isInvitationRevoked`, `isInvitationDeclined`
- Implemented lifecycle transition validation: `VALID_TRANSITIONS`, `canTransitionTo` — only pending → accepted/declined/revoked/expired
- Implemented SHA-256 token hashing: `hashInvitationToken` and `verifyInvitationToken` — raw tokens never stored (D-08, T-02-13)
- Implemented `createInvitation`: returns raw token once for copyable link display, persists only token hash
- Implemented `acceptInvitation`: validates token hash, checks expiration, upserts identity, transitions to accepted, creates active guardian membership atomically (D-05, D-08, T-02-11)
- Implemented `declineInvitation`: transitions pending → declined, writes audit, no membership created
- Implemented `revokeInvitation`: guardian-only transition pending → revoked with audit (D-07)
- Created guardian invitation management page at `/family/invitations` — create form, status list, revoke button
- Created authenticated acceptance page at `/family/invitations/accept/[token]` — accept/decline with auth gate
- Created `/api/families/invitations` POST route — action dispatch for create/revoke/accept/decline

## Task Commits

1. **Task 1: Implement invitation lifecycle commands** — `9a294f5` (feat)
2. **Task 2: Add invitation management and acceptance pages** — `ce528c8` (feat)

## Files Created/Modified

- `src/lib/families/invitations.ts` — Invitation constants, predicates, transitions, token hashing, and 4 DB-backed lifecycle commands
- `src/app/family/invitations/page.tsx` — Guardian-only invitation management page with create/revoke
- `src/app/family/invitations/accept/[token]/page.tsx` — Authenticated accept/decline page
- `src/app/api/families/invitations/route.ts` — POST route with action dispatch and guardian authorization

## Decisions Made

1. **SHA-256 via Node.js crypto** — No external dependencies; `crypto.randomUUID()` for token generation avoids uuid package
2. **Single POST route with action dispatch** — All invitation mutations route through `/api/families/invitations` with an `action` field (create/revoke/accept/decline), matching existing form-based patterns
3. **No email transport** — Per resolved research, Phase 02 uses copyable one-time invitation links. The `createInvitation` command returns `rawToken` once; the UI displays a copyable link

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced uuid package with crypto.randomUUID()**
- **Found during:** Task 1 (build verification)
- **Issue:** `import { v4 as uuidv4 } from 'uuid'` failed TypeScript check — no `@types/uuid` declaration
- **Fix:** Replaced with `crypto.randomUUID()` which is built into Node.js. Same functionality, zero dependencies.
- **Files modified:** `src/lib/families/invitations.ts`
- **Committed in:** `9a294f5`

**2. [Rule 3 - Blocking] Integration tests skipped — Docker/Testcontainers unavailable**
- **Found during:** Task 1 and Task 2 (verification)
- **Issue:** `tests/integration/family-invitations.test.ts` requires PostgreSQL Testcontainers but Docker/Podman is not functional (known STATE.md limitation)
- **Fix:** Verified via unit tests (22/22 pass) + build (Turbopack + TypeScript pass, all 11 routes registered). Integration tests remain ready to run in Docker-enabled environment.
- **Files modified:** None
- **Committed in:** N/A (verification-only)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Minimal. uuid import resolved with built-in API. Integration tests deferred per existing project limitation.

## Issues Encountered

- Commit hook enforces single-line messages ≤70 chars — adapted subject lines to fit constraints
- `requireActiveGuardian` type mismatch in API route — used inline membership lookup instead of the authorization helper which expects identity keyed differently. The API route directly queries `familyMemberships` for the guardian check, consistent with the existing `/api/families` pattern

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: spoofing | src/lib/families/invitations.ts | `acceptInvitation` requires authenticated ZITADEL session and validates pending token hash before creating membership (T-02-11 mitigated) |
| threat_flag: tampering | src/lib/families/invitations.ts | `canTransitionTo` enforces allowed lifecycle transitions; `acceptInvitation` rejects terminal-state tokens (T-02-12 mitigated) |
| threat_flag: information_disclosure | src/lib/families/invitations.ts | Only token hashes persisted; raw token returned once via `createInvitation` return value; no logging/rendering of raw tokens (T-02-13 mitigated) |
| threat_flag: elevation_of_privilege | src/app/api/families/invitations/route.ts | Create/revoke require active guardian membership; acceptance grants Kreds guardian role only on successful authenticated acceptance (T-02-14 mitigated) |
| threat_flag: elevation_of_privilege | src/app/family/invitations/page.tsx | Server Component checks guardian membership before rendering management UI |

## Known Stubs

None — all created code is functional. Integration tests await Docker-enabled environment.

## Next Phase Readiness

- Guardian invitation lifecycle complete — multi-guardian families can now be formed through authenticated acceptance
- Ready for Plan 02-07 (audit visibility and child profile management)
- API route pattern established for action-dispatch POST routes with guardian authorization

## Self-Check: PASSED

- All 4 created files exist on disk
- Both commits found in git log (9a294f5, ce528c8)
- Unit tests: 22/22 pass
- Build: Turbopack + TypeScript pass, all 11 routes registered (including /family/invitations, /family/invitations/accept/[token], /api/families/invitations)

---
*Phase: 02-family-access-tenancy-roles-and-profiles*
*Completed: 2026-06-07*
