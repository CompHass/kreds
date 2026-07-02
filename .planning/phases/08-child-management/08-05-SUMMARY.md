---
phase: 08-child-management
plan: "05"
subsystem: children-ui
tags: [next.js, server-components, server-actions, react, drizzle, integration-testing]

# Dependency graph
requires:
  - phase: 08-02
    provides: "ParentSidebar/ParentTopbar layout shell, /family/[familyId]/tasks route pattern"
  - phase: 08-03
    provides: "createChild/resetChildPin/revealChildPin/toggleChildActive Server Actions, ChildProfileView type"
  - phase: 08-04
    provides: "ChildCard, ChildFormPanel, ChildPinResetPanel, ConfirmDeactivateDialog leaf components"
provides:
  - "/family/[familyId]/children SSR route (D-01) — familyId-scoped childProfiles query, no active filter"
  - "ChildrenPanelView client root wiring list + add + PIN reset + PIN reveal + deactivate confirmation to Plan 03 Server Actions"
  - "Integration test proving reveal gating (Pitfall 6) and dialog-gated deactivation (D-14 invariant)"
affects: [09-reports-and-notifications, any-future-phase-touching-child-profile-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client root state: editingId ('new'|id|null), confirmTargetId, resetTargetId, revealedPins cache — mirrors ParentPanelView optimistic + fire-and-forget convention"
    - "SSR page maps DB rows to a client-safe view type (ChildProfileView) — never serializes pinEncrypted/pinHash, only derived hasEncryptedPin boolean (T-08-14)"
    - "Deactivate/reactivate always routes through confirmTargetId + ConfirmDeactivateDialog — no direct mutation from ChildCard (D-14)"

key-files:
  created:
    - src/app/family/[familyId]/children/page.tsx
    - src/components/parent/children-panel-view.tsx
    - tests/unit/children-panel.test.tsx
  modified:
    - docker-compose.yml

key-decisions:
  - "08-05: PIN_ENCRYPTION_KEY added to docker-compose.yml app env (Rule 3 blocking auto-fix) — src/lib/env.ts requires it and the checkpoint's own precondition depends on it being set"
  - "08-05: human-verify checkpoint (Task 3) verification deferred to post-deploy against https://kreds.hasslab.pro per new project-wide preference — local docker compose verification was not behaving as expected for this checkpoint"

patterns-established:
  - "Checkpoint deferral pattern: when local browser verification is unreliable, implementation completes and commits normally, but the human-verify gate is marked 'pending post-deploy' rather than 'approved' until the user checks the deployed instance"

requirements-completed: [D-01, D-04, D-08, D-09, D-12, D-13, D-14, D-15]

# Metrics
duration: ~35min (implementation) + finalization session
completed: 2026-07-02
---

# Phase 08 Plan 05: Children Module Assembly Summary

**`/children` SSR page + `ChildrenPanelView` client root wiring list/add/PIN-reset/PIN-reveal/deactivate to Plan 03 Server Actions with optimistic + fire-and-forget updates; human-verify checkpoint implementation-complete but verification deferred to post-deploy.**

## Performance

- **Tasks:** 3/3 executed (2 `auto`, 1 `checkpoint:human-verify`)
- **Files modified:** 3 created, 1 modified (docker-compose.yml)

## Accomplishments

- New file-based route `/family/[familyId]/children` (D-01), SSR query against `childProfiles` scoped by `familyId` with **no** `active` filter so deactivated children still render (required for the D-14 reactivate flow).
- `ChildrenPanelView` client root composing `ParentSidebar` + `ParentTopbar` + child card list + right-side panel (add-child form / PIN reset keypad) + page-local `GuardianProfileDrawer` (D-04) + `ConfirmDeactivateDialog` gated by `confirmTargetId` (D-14).
- All four Plan 03 Server Actions wired with the established optimistic + fire-and-forget pattern from `ParentPanelView`: `createChild` (append real DB row, avoids UUID desync per Pitfall 6), `resetChildPin` (optimistic `hasEncryptedPin=true`), `revealChildPin` (client-side reveal cache, toggle show/hide), `toggleChildActive` (fires only after dialog confirm).
- Integration test (`tests/unit/children-panel.test.tsx`) proving 5 behaviors: list render, disabled "Mostrar" + "PIN ainda não definido" copy for NULL-encrypted children (Pitfall 6), reveal flow, dialog blocks `toggleChildActive` pre-confirm (D-14 invariant), confirm fires the mutation with correct args.
- Fixed a blocking runtime gap: `PIN_ENCRYPTION_KEY` was missing from `docker-compose.yml`'s app env, which would fail `src/lib/env.ts` validation for any PIN cipher path — including the checkpoint's own stated precondition.

## Task Commits

Each task was committed atomically:

1. **Task 1: children/page.tsx SSR query + ChildrenPanelView client root** - `9e6719c` (feat)
2. **Task 2: ChildrenPanelView integration component test** - `fee0e31` (test)
3. **Task 3: checkpoint:human-verify (full /children flow + /tasks parity)** - implementation prerequisites satisfied by `69fc47b` (fix); **checkpoint itself not yet approved — see below**

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/app/family/[familyId]/children/page.tsx` - Server Component: awaits params, parallel `childProfiles`/`families.name` queries, maps rows to `ChildProfileView` (no PIN material sent to client)
- `src/components/parent/children-panel-view.tsx` - `'use client'` root: list + add + PIN reset + PIN reveal + deactivate confirmation, all four Server Actions wired
- `tests/unit/children-panel.test.tsx` - integration-style component test, 5 cases green
- `docker-compose.yml` - added `PIN_ENCRYPTION_KEY` to the `app` service env (Rule 3 auto-fix)

## Decisions Made

- `PIN_ENCRYPTION_KEY` dev value generated via `openssl rand -base64 32` and hardcoded in `docker-compose.yml`, matching the existing pattern for `AUTH_SECRET`/`CHILD_SESSION_SECRET` dev secrets in this file.
- Checkpoint verification method changed mid-plan: the user established a new project-wide preference during this session — human-verify checkpoints are no longer exercised against `localhost:3000` via Docker Compose. Local verification for this checkpoint was not behaving as expected. Going forward, the user verifies against the deployed instance (`https://kreds.hasslab.pro`) after the GitOps CI pipeline (build-push-harbor -> iac manifest update -> ArgoCD sync) rolls out the change. This SUMMARY documents that decision; it is not yet reflected as a standing rule anywhere else in `.planning/` and should be captured explicitly if it is meant to apply to future phases too.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing PIN_ENCRYPTION_KEY to docker-compose.yml**
- **Found during:** Task 3 (human-verify checkpoint precondition check)
- **Issue:** `src/lib/env.ts` (from 08-01) requires `PIN_ENCRYPTION_KEY` as a base64-encoded 32-byte key; PIN reveal/reset Server Actions (08-03) depend on it at runtime, but `docker-compose.yml` never defined it, which would fail env validation for any request touching `pin-cipher.ts`.
- **Fix:** Added a dev-only key (generated via `openssl rand -base64 32`) to the `app` service env block, matching the existing hardcoded-dev-secret pattern already used for `AUTH_SECRET` and `CHILD_SESSION_SECRET`.
- **Files modified:** `docker-compose.yml`
- **Commit:** `69fc47b`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the checkpoint's own stated precondition to be satisfiable. No scope creep.

## Issues Encountered

Local Docker Compose browser verification for the Task 3 checkpoint was not behaving as expected during this session. Rather than continuing to debug the local environment, the user established a new verification approach for this plan: verify against the deployed production instance after the GitOps pipeline promotes the branch, instead of against `localhost:3000`. See "Checkpoint Verification Status" below.

## Checkpoint Verification Status: PENDING POST-DEPLOY (NOT APPROVED)

**Task 3 (`checkpoint:human-verify`, gate="blocking") is implementation-complete but has NOT been visually/functionally approved.** Do not treat this plan — or Phase 08 — as fully verified until the user confirms the checklist below against the deployed environment.

All code, wiring, and the auto-fixed `PIN_ENCRYPTION_KEY` env gap are in place and committed. What remains is the human verification pass itself, which the user will perform against `https://kreds.hasslab.pro` once this branch has gone through the GitOps CI pipeline (`.github/workflows/build-push-harbor.yml` -> `iac` manifest update -> ArgoCD sync).

### Deferred verification checklist (production URL)

Preconditions: the branch/commit containing `9e6719c`, `fee0e31`, and `69fc47b` has been built, pushed to Harbor/Docker Hub, and ArgoCD has synced the `kreds` Application in the `hasslab-k3s` cluster (namespace `kreds`). Log in as a guardian at `https://kreds.hasslab.pro` and open a family to obtain a `familyId` in the URL.

1. Visit `https://kreds.hasslab.pro/family/{familyId}/tasks` — confirm sidebar/topbar/task list render exactly as before the refactor (no visual regression); the "Tarefas" icon is active (green bg `#E7EFE8`, stroke `#3E6B4F`).
2. Click the "Crianças" (person) sidebar icon — confirm it navigates to `/family/{familyId}/children` and that icon is now the active one.
3. Confirm the existing child (e.g. "Ana") appears as a card with an initial+color avatar and a masked PIN `••••`.
4. "Adicionar filho" flow: enter a name, age, pick a color via the native color picker, submit — the new child card appears immediately without a full page reload.
5. On the new child, click "Redefinir PIN", enter a 4-digit PIN on the keypad — panel closes; then click "Mostrar" and confirm the PIN just set is revealed; click "Ocultar" to hide it.
6. On the pre-existing "Ana" (if her `pinEncrypted` is still NULL), confirm "Mostrar" is disabled and shows "PIN ainda não definido — use Redefinir PIN"; reset her PIN, then confirm "Mostrar" now works.
7. Click "Desativar" on a child — confirm the confirmation dialog appears ("Desativar {nome}?"); click "Cancelar" and confirm nothing changes; click "Desativar" again and confirm — the child card shows the deactivated state and the button now reads "Reativar".
8. Open the guardian profile drawer on `/children`, then navigate to `/tasks` — confirm the drawer is closed on `/tasks` (no cross-page state leak — D-04).

**Resume signal (when the user completes this checklist):** "approved" (all 8 steps pass on production) or a description of any visual/behavioral issue found, to be triaged as a follow-up fix.

## User Setup Required

None beyond the GitOps deploy itself (already the standing delivery mechanism for this project — no new manual steps introduced by this plan).

## Next Phase Readiness

- All Phase 8 ROADMAP success criteria (list, add, PIN, deactivate/reactivate) are implemented and unit/integration-tested.
- Full automated verification (`npm test`, `tsc --noEmit`, `npm run build`) was covered by the individual task-level automated checks in Tasks 1-2; the plan-level `<verification>` block's full-suite/build re-run was not independently re-executed in this finalization session — recommend confirming green in CI before merge if not already covered by the existing commits' checks.
- **Blocker for calling Phase 08 fully done:** the Task 3 human-verify checkpoint is outstanding. Recommend not advancing to Phase 09 planning/execution until the user confirms the production checklist above.

---
*Phase: 08-child-management*
*Completed: 2026-07-02 (implementation) — checkpoint verification pending*
