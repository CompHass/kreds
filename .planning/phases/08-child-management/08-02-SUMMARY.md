---
phase: 08-child-management
plan: 02
subsystem: parent-panel
tags: [auth-gate, layout, routing, navigation, sidebar, testing]
dependency_graph:
  requires:
    - "08-01 (pin_encrypted schema + pin-cipher utility)"
    - "07-01 (GuardianProfileDrawer + signOut)"
    - "05-02 (ParentPanelView + ParentSidebar initial implementation)"
  provides:
    - "src/app/family/[familyId]/layout.tsx — shared auth gate for /family/* routes"
    - "ParentSidebar with familyId + activeRoute props for route-conditional styling"
    - "tests/unit/parent-sidebar.test.tsx — first ParentSidebar unit test"
  affects:
    - "08-05 (children/page.tsx will rely on this layout for auth gate)"
tech_stack:
  added: []
  patterns:
    - "Next.js shared layout auth gate (auth() + redirect before children render)"
    - "Route-conditional active styling via activeRoute prop"
    - "useRouter navigation pattern for client sidebar buttons"
    - "vi.mock('next/navigation') pattern for jsdom component tests"
key_files:
  created:
    - path: "src/app/family/[familyId]/layout.tsx"
      role: "Shared async Server Component — auth() gate + redirect('/login') for all /family/[familyId]/* routes"
    - path: "tests/unit/parent-sidebar.test.tsx"
      role: "First sidebar unit test — 3 cases: Crianças push, stroke active, Tarefas push"
  modified:
    - path: "src/app/family/[familyId]/tasks/page.tsx"
      role: "Removed redundant redirect('/login'); auth() kept for session.user props; session?.user optional chaining"
    - path: "src/components/parent/parent-sidebar.tsx"
      role: "Added familyId + activeRoute props; useRouter navigation; conditional active bg/stroke"
    - path: "src/components/parent/parent-panel-view.tsx"
      role: "Updated ParentSidebar call to pass familyId={_familyId} and activeRoute='tasks'"
    - path: "tests/unit/parent-panel.test.tsx"
      role: "Added vi.mock('next/navigation') to fix useRouter invariant after sidebar change"
decisions:
  - "08-02: layout.tsx minimal — auth gate only, NO ParentSidebar/ParentTopbar (D-04/Pitfall 1: drawer state stays page-local)"
  - "08-02: /tasks/page.tsx keeps auth() call for session.user?.name/email props, session?.user with optional chaining"
  - "08-02: vi.mock('next/navigation') added to parent-panel.test.tsx after ParentSidebar gained useRouter"
metrics:
  duration: "5min"
  completed_date: "2026-07-02"
  tasks_completed: 2
  files_changed: 5
---

# Phase 08 Plan 02: Shared Auth Gate Layout + Route-Aware ParentSidebar Summary

Shared auth gate in `layout.tsx` + ParentSidebar route-aware nav with `activeRoute`/`familyId` props for Tarefas/Crianças conditional styling and navigation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Shared layout.tsx auth gate + de-duplicate /tasks | 0fcf0e2 | layout.tsx (new), tasks/page.tsx |
| 2 | Route-aware ParentSidebar + first sidebar test | 4a39002 | parent-sidebar.tsx, parent-panel-view.tsx, parent-sidebar.test.tsx, parent-panel.test.tsx |

## What Was Built

**Task 1 — Shared Auth Gate:**
- Created `src/app/family/[familyId]/layout.tsx` as a minimal async Server Component
- Performs `auth()` + `redirect('/login')` for all routes under `/family/[familyId]/`
- Satisfies T-08-06 (Elevation of Privilege threat mitigation)
- D-04 respected: no `ParentSidebar`/`ParentTopbar`/`GuardianProfileDrawer` in layout (drawer state stays page-local per Pitfall 1)
- Refactored `/tasks/page.tsx`: removed redundant `redirect('/login')`; kept `auth()` for reading `session.user?.name`/`email`; added optional chaining `session?.user?.name`

**Task 2 — Route-Aware ParentSidebar:**
- Extended `ParentSidebarProps` with `familyId: string` and `activeRoute: 'tasks' | 'children'`
- Added `useRouter` from `next/navigation`; Tarefas and Crianças buttons use `router.push` for navigation
- Tarefas and Crianças buttons now have conditional `background` (#E7EFE8 when active, `'none'` otherwise) and conditional SVG `stroke` (#3E6B4F when active, #9AA092 otherwise)
- Updated `ParentPanelView` to pass `familyId={_familyId}` and `activeRoute="tasks"` to `ParentSidebar`
- Created `tests/unit/parent-sidebar.test.tsx` with 3 test cases verifying: (1) Crianças push, (2) Crianças active stroke, (3) Tarefas push

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added next/navigation mock to parent-panel.test.tsx**
- **Found during:** Task 2 verification
- **Issue:** `ParentSidebar` now uses `useRouter()` which throws "invariant expected app router to be mounted" in jsdom environment. `parent-panel.test.tsx` renders `ParentPanelView` → `ParentSidebar`, so it inherited the issue.
- **Fix:** Added `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))` to `tests/unit/parent-panel.test.tsx`
- **Files modified:** `tests/unit/parent-panel.test.tsx`
- **Commit:** 4a39002

## Verification Results

- `tests/unit/parent-sidebar.test.tsx` — 3/3 tests passed
- `tests/unit/parent-panel.test.tsx` — 13/13 tests passed
- TypeScript: no new errors introduced (pre-existing `.next/types/` + future-phase module errors unchanged)

## Known Stubs

None — all props are wired; no placeholder data.

## Threat Flags

No new security surface introduced. `layout.tsx` closes the T-08-06 threat (unauthenticated access to `/family/*` routes).

## Self-Check: PASSED
