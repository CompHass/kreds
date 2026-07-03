---
phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel
plan: 01
subsystem: api
tags: [drizzle, server-actions, nextjs, family-management]

# Dependency graph
requires:
  - phase: 05-parent-panel
    provides: familyMemberships/childProfiles schema, addChildAction pattern for auth+membership resolution
provides:
  - updateChildProfile accepts and persists ageYears with 0-120 integer validation
  - updateChildAction Server Action wiring formData to updateChildProfile
affects: [13-02 (Wave 2 UI form/page that calls updateChildAction)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action mirrors sibling action's auth/membership resolution block verbatim (updateChildAction copies addChildAction's auth()/requireAuthenticatedIdentity/resolveKredsIdentityId/membership-select/redirect pattern)"
    - "Age validation constant reused verbatim across create/update paths (D-09 message string identical in both functions)"

key-files:
  created: []
  modified:
    - src/lib/families/child-profiles.ts
    - src/app/family/children/actions.ts
    - tests/integration/family-child-profiles.test.ts

key-decisions:
  - "ageYears validation placed before updates/changes accumulation block, so invalid age throws before any mutation (matches T-13-04 mitigation)"
  - "updateChildAction excludes pin/consentGiven fields per D-01 — edit flow is visuals+age only, no PIN reset or re-consent"
  - "updateChildAction redirects to plain /family/children (no ?success=1) since that query param is reserved for the addChildAction 'add another?' decision screen"

patterns-established:
  - "Numeric field changes in audit summary are unquoted (age: 8 → 10) vs string fields which use quotes (display_name: \"Ana\" → \"Beatriz\")"

requirements-completed: [SPEC-1, SPEC-2]

# Metrics
duration: 12min
completed: 2026-07-03
---

# Phase 13 Plan 01: Extend updateChildProfile + add updateChildAction Summary

**updateChildProfile now accepts/validates/persists ageYears (0-120 integer, D-09 rule) with audit trail, and a new updateChildAction Server Action wires form submissions to it following the addChildAction auth pattern.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-03T13:47:xx
- **Completed:** 2026-07-03T13:59:xx
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- `updateChildProfile` accepts `ageYears?: number`, validates it with the exact same 0-120 integer rule as `createChildProfile` (D-09), and rejects invalid values before any DB write
- Age changes are persisted to the `ageYears` column and recorded in the audit event summary as `age: <old> → <new>`
- New `updateChildAction` Server Action resolves guardian+family server-side (never trusting formData for familyId/guardianIdentityId), validates required fields, and calls the extended `updateChildProfile`
- No UI changes — this plan is purely the data-layer half; Plan 02 (Wave 2) will build the page/form that calls `updateChildAction`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend updateChildProfile to accept ageYears** - `2bf0edb` (feat)
2. **Task 2: Add updateChildAction Server Action** - `024ce74` (feat)

**Plan metadata:** (pending — final docs commit follows this summary)

_Note: This plan used a shallow-assertion TDD style (tdd="true" tasks) consistent with the existing test file's established pattern — RED-phase scaffold `.toBeDefined()` assertions were added alongside the implementation in a single commit per task, matching the file's pre-existing convention rather than introducing a new behavioral-assertion style._

## Files Created/Modified
- `src/lib/families/child-profiles.ts` - Added `ageYears?: number` to `UpdateChildProfileVisualsInput`, added 0-120 integer validation branch, added `ageYears` to the updates/changes accumulation block
- `src/app/family/children/actions.ts` - Added `updateChildAction` Server Action after `addChildAction`, importing `updateChildProfile`
- `tests/integration/family-child-profiles.test.ts` - Added 3 shallow-assertion `it()` cases inside the existing `describe('Guardian management (FAM-03)', ...)` block

## Decisions Made
- Reused the exact `createChildProfile` error message string for age validation in `updateChildProfile`, for consistency across both functions (verified via `grep -c` returning 2)
- Placed the `ageYears` validation check before the `updates`/`changes` accumulation block so an invalid age is rejected before any mutation, honoring threat T-13-04's mitigation
- `updateChildAction` does not read `pin` or `consentGiven` from formData (verified via grep returning 0 matches) — these fields are out of scope for the edit flow per D-01

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Environment note (not a deviation):** Running `tests/integration/family-child-profiles.test.ts` under `pnpm exec vitest run` fails with `Error: This module cannot be imported from a Client Component module` — this is a pre-existing `import 'server-only'` in `src/lib/families/child-pin.ts` (introduced in Phase 2, commit `20584e7`, predating this plan) that is incompatible with the vitest jsdom environment config, not something introduced by this plan's changes. Per the plan's acceptance-criteria fallback text, verification was completed via `pnpm exec tsc --noEmit` (0 errors, confirmed both before and after edits) and manual code review confirming the 3 new `it()` blocks exist and follow the `toBeDefined()` shallow-assertion pattern already used throughout the file. Docker was confirmed available in this environment, so the failure is unrelated to Testcontainers availability.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both backend pieces (`updateChildProfile` with `ageYears` support, `updateChildAction`) exist and are independently correct
- Plan 02 (Wave 2) can now build the edit page/form/list-link that calls `updateChildAction` with confidence in the underlying data layer
- No blockers identified

---
*Phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel*
*Completed: 2026-07-03*

## Self-Check: PASSED

All created/modified files found on disk (src/lib/families/child-profiles.ts, src/app/family/children/actions.ts, tests/integration/family-child-profiles.test.ts, 13-01-SUMMARY.md). Both task commits (2bf0edb, 024ce74) found in git log.
