---
phase: 07-guardian-profile
plan: "02"
subsystem: parent-panel
tags:
  - guardian-profile
  - drawer
  - parent-panel
  - auth-session
  - next-auth
dependency_graph:
  requires:
    - "07-01: GuardianProfileDrawer component"
    - "06: ParentPanelView + server actions"
  provides:
    - guardianEmail propagation from SSR session
    - profileOpen state + GuardianProfileDrawer wiring
    - sidebar profile button (D-08) + topbar badge trigger (D-09)
  affects:
    - src/app/family/[familyId]/tasks/page.tsx
    - src/components/parent/parent-panel-view.tsx
    - src/components/parent/parent-sidebar.tsx
    - src/components/parent/parent-topbar.tsx
    - tests/unit/parent-panel.test.tsx
    - auth.ts
tech_stack:
  added: []
  patterns:
    - SSR→props pattern for guardianEmail (Pitfall 3 confirmed: no useSession)
    - parent-panel-view state pattern (profileOpen follows editingId pattern)
    - vi.mock for next-auth/react + next-auth (server action test isolation)
    - within() scoping for drawer assertions (avoids topbar/drawer text collision)
key_files:
  created: []
  modified:
    - auth.ts
    - src/app/family/[familyId]/tasks/page.tsx
    - src/components/parent/parent-panel-view.tsx
    - src/components/parent/parent-sidebar.tsx
    - src/components/parent/parent-topbar.tsx
    - tests/unit/parent-panel.test.tsx
decisions:
  - "07-02: token.email explicitly persisted in jwt callback — removes dependency on next-auth default email propagation"
  - "07-02: vi.mock('next-auth') required in parent-panel tests — NextAuth initializes and imports next/server (not available in jsdom)"
  - "07-02: PTASK-02 fixed to use getAllByText + within(header) — drawer always in DOM causes getByText('João') collision"
  - "07-02: PTASK-09 fixed to use waitFor — createTask is async, state update occurs after promise resolves"
metrics:
  duration: "~9 minutes"
  completed_date: "2026-07-01"
  tasks_completed: 3
  files_modified: 6
---

# Phase 07 Plan 02: Wire Drawer into Parent Panel — Summary

**One-liner:** `guardianEmail` propagated from OIDC token via SSR, `profileOpen` state added to `ParentPanelView`, sidebar circle (D-08) and topbar badge (D-09) both open `GuardianProfileDrawer` with real session data.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Propagate guardianEmail from SSR session | 9719f6c | auth.ts, page.tsx |
| 2 | profileOpen state + mount drawer + wire sidebar/topbar | 6e2089c | parent-panel-view.tsx, parent-sidebar.tsx, parent-topbar.tsx |
| 3 | Extend parent-panel.test.tsx | 36225ea | tests/unit/parent-panel.test.tsx |
| 4 | Visual checkpoint | ⏸ Awaiting human | — |

## What Was Built

The `GuardianProfileDrawer` (built in Plan 01) is now fully integrated into the parent panel:

1. **`auth.ts`** — `token.email` is now explicitly persisted from `profile.email` in the `jwt` callback, and `session.user.email` is explicitly set from `token.email` in the `session` callback. This resolves Open Question 2 (Assumption A2) and makes email stable across token refreshes.

2. **`page.tsx`** — Passes `guardianEmail={session.user?.email ?? ''}` to `ParentPanelView`, immediately after `currentUserName` (same nullish coalescing pattern).

3. **`parent-panel-view.tsx`** — Added `guardianEmail: string` to `ParentPanelViewProps`, `const [profileOpen, setProfileOpen] = useState(false)`, and `const guardianInitial = currentUserName.charAt(0).toUpperCase()`. `<ParentSidebar>` and `<ParentTopbar>` receive `onOpenProfile`. `<GuardianProfileDrawer>` is mounted as a sibling to `<main>` (position:fixed safe — outer wrapper is flex-only, no transform).

4. **`parent-sidebar.tsx`** — Added `ParentSidebarProps` interface with `guardianInitial` and `onOpenProfile`. The static `<div>P</div>` avatar at the footer was replaced by an accessible `<button aria-label="Abrir perfil">` displaying `{guardianInitial}`.

5. **`parent-topbar.tsx`** — Added `onOpenProfile: () => void` to `ParentTopbarProps`. The badge `<div>` became interactive with `onClick`, `role="button"`, `aria-label="Abrir perfil"`, `tabIndex={0}`, and `onKeyDown` (Enter).

6. **`parent-panel.test.tsx`** — Added `vi.mock('next-auth/react')`, `vi.mock('next-auth')`, `vi.mock('@/app/actions/tasks')`, updated `renderPanel()` with `guardianEmail` prop, and added 3 new cases (D-08/D-03, D-09/D-03, D-05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PTASK-02 broken by drawer mounting**
- **Found during:** Task 3
- **Issue:** `screen.getByText('João')` threw "Found multiple elements" — the `GuardianProfileDrawer` (always in DOM even when closed) also renders guardianName="João" in a centered `<div>`. The original PTASK-02 used `getByText` which is single-match only.
- **Fix:** Changed PTASK-02 to use `getAllByText('João')` and verify `header.textContent` contains 'João' instead.
- **Files modified:** tests/unit/parent-panel.test.tsx
- **Commit:** 36225ea

**2. [Rule 1 - Bug] PTASK-09 async state update not awaited**
- **Found during:** Task 3
- **Issue:** `createTask` in `handleSave` is async (`await createTask(...)` + `setTasks`). Before Task 3's mocks, the test file failed to even import (next-auth issue). When mocks fixed the import, PTASK-09 revealed a pre-existing React act() warning — `screen.getByText('Tarefa Nova')` was called synchronously after `fireEvent.click` but the state update only lands after the mocked promise resolves.
- **Fix:** Changed test to `async`, added `waitFor(() => screen.getByText('Tarefa Nova')...)` to wait for the async state update.
- **Files modified:** tests/unit/parent-panel.test.tsx
- **Commit:** 36225ea

**3. [Rule 1 - Bug] Pre-existing: next-auth imported transitively broke parent-panel tests**
- **Found during:** Task 3
- **Issue:** `parent-panel.test.tsx` imports `ParentPanelView` which imports `@/app/actions/tasks`, which imports `auth.ts`, which calls `NextAuth(...)` — `next-auth` internally imports `next/server` (not `next/server.js`) which is not resolvable in vitest/jsdom. This caused ALL parent-panel tests to fail to load (0 tests ran). This was pre-existing before Plan 07-02 but was hidden because the suite-level error masked everything.
- **Fix:** Added `vi.mock('next-auth', ...)` and `vi.mock('@/app/actions/tasks', ...)` to the test file. The server actions mock returns minimal valid data so existing PTASK tests continue to function correctly.
- **Files modified:** tests/unit/parent-panel.test.tsx
- **Commit:** 36225ea

## Threat Model Compliance

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-07-04 | Mitigated | `guardianEmail` passed server-side as prop; not in URL, querystring, or localStorage |
| T-07-05 | Mitigated | `signOut({ redirectTo: '/login' })` implemented in GuardianProfileDrawer (Plan 01) |
| T-07-06 | Accepted | Acionadores apenas alteram estado client-side; page.tsx já protege com `auth()` |
| T-07-07 | Accepted | Drawer no DOM com translateX(100%); conteúdo é apenas nome/email do próprio usuário |

## Test Results

```
tests/unit/parent-panel.test.tsx — 13 passed (13 tests)
  PTASK-01 through PTASK-10: all passing
  D-08/D-03: sidebar button opens drawer ✓
  D-09/D-03: topbar badge opens drawer ✓
  D-05: drawer shows name + email ✓

tests/unit/guardian-profile-drawer.test.tsx — 4 passed (from Plan 01)
```

Note: The `.claude/worktrees/admiring-elion-6b8f05/tests/unit/parent-panel.test.tsx` copy fails in the test runner (worktree artifact — same file resolved via a different path where vi.mock hoisting doesn't apply). This is an environment-level issue, not a code issue.

## Known Stubs

None — all data flows are wired: `guardianEmail` comes from real session, `guardianName` comes from real session, `signOut` calls next-auth.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| SUMMARY.md created | FOUND |
| Commit 9719f6c (Task 1: auth.ts + page.tsx) | FOUND |
| Commit 6e2089c (Task 2: panel-view, sidebar, topbar) | FOUND |
| Commit 36225ea (Task 3: tests) | FOUND |
| Task 4 checkpoint pending | Awaiting human verification |
