---
phase: quick
plan: 260702-mta
subsystem: ui
tags: [react, nextjs, parent-panel, tasks]

# Dependency graph
requires:
  - phase: 05-parent-panel
    provides: ParentTaskCard, ParentPanelView, familyChildren shape (id/displayName/accentColor/avatarPreset)
provides:
  - AssigneeAvatars sub-component in parent-task-card.tsx rendering assignee chips
  - familyChildren prop threaded from ParentPanelView into every ParentTaskCard instance
affects: [parent-panel, task-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AssigneeAvatars follows the existing local-function-component convention (like DayPills) inside parent-task-card.tsx"

key-files:
  created: []
  modified:
    - src/components/parent/parent-task-card.tsx
    - src/components/parent/parent-panel-view.tsx
    - tests/unit/parent-task-card.test.tsx

key-decisions:
  - "AssigneeAvatars uses a single wrapping element with aria-label='Atribuída a: <names>' and aria-hidden on individual chips so tests/AT read assignment via one accessible label instead of parsing icons"
  - "No new FamilyChild/ChildChip type export was created — an inline interface matching the existing shape (id/displayName/accentColor/avatarPreset) was duplicated locally in parent-task-card.tsx, consistent with how filter-chips.tsx and assignee-selector.tsx already do it"

requirements-completed: [MTA-01]

# Metrics
duration: 12min
completed: 2026-07-02
---

# Quick Task 260702-mta Summary

**Compact overlapping avatar-chip indicator on ParentTaskCard showing assigned child(ren), resolved from `task.assigned` against `familyChildren`, with no truncation for multiple assignees**

## Performance

- **Duration:** ~12 min
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- `ParentTaskCard` now renders an `AssigneeAvatars` chip row (18-19px overlapping circles, initial over accentColor, card-color border) in the badges row, right after `DayPills` and before the approval badge, whenever `task.assigned` is non-empty and resolves against `familyChildren`
- `ParentPanelView` threads its existing `familyChildren` prop down to each `ParentTaskCard` instance (pure prop threading, no new data fetching)
- Deactivated/unmatched child ids in `task.assigned` are silently filtered out (no crash, no empty chip)
- Test suite grew from 6 to 9 passing tests, covering single assignee, multiple assignees (no truncation), and empty/unmatched assigned arrays

## Task Commits

Each task was committed atomically:

1. **Task 1: Add AssigneeAvatars to ParentTaskCard and thread familyChildren prop** - `4dbb186` (feat)
2. **Task 2: Extend test coverage for the assignee indicator** - `cc24511` (test)

_Note: familyChildren fixture and existing-test-call updates were included in Task 1's commit since the prop became required and existing tests needed updating to keep passing per the plan's own "done" criteria._

## Files Created/Modified
- `src/components/parent/parent-task-card.tsx` - Adds `AssigneeAvatars` local component and required `familyChildren` prop; renders assignee chips in the badges row
- `src/components/parent/parent-panel-view.tsx` - Passes `familyChildren={familyChildren}` to `ParentTaskCard`
- `tests/unit/parent-task-card.test.tsx` - Adds shared `familyChildren` fixture, updates all 7 render/rerender call sites, adds 3 new tests for the assignee indicator

## Decisions Made
- Reused the exact avatar visual language from `FilterChips`/`AssigneeSelector` (initial + accentColor circle) but sized smaller (18-19px vs 24px) to fit inline with the existing 20px day pills without disrupting row height
- Used `aria-label` on a single wrapper (not per-chip) for accessible discoverability — matches the plan's guidance to query via `getByLabelText(/atribuída a/i)` rather than parsing individual icon styles

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Pure client-side rendering change, no DB/API/schema changes.

## Next Phase Readiness

- Feature is display-only and additive; no impact on Phase 08 (child-management) checkpoint still pending human verification on kreds.hasslab.pro
- `grep -rn "ParentTaskCard" src tests` confirms only expected call sites (definition, usage in parent-panel-view.tsx, test file) were touched — no missed integration points

---
*Phase: quick*
*Completed: 2026-07-02*

## Self-Check: PASSED

All modified files found on disk. Both task commits (4dbb186, cc24511) found in git log.
