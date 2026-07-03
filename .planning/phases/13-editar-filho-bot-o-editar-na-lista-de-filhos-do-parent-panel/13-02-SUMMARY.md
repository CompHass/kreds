---
phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel
plan: 02
subsystem: web
tags: [nextjs, server-components, server-actions, family-management, forms]

# Dependency graph
requires:
  - phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel
    plan: 01
    provides: updateChildAction Server Action, updateChildProfile accepting ageYears
provides:
  - EditChildForm client component (pre-filled visuals+age edit form)
  - /family/children/[childId]/edit SSR page with ownership/active guard
  - Editar link on every active child card in /family/children
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edit page reuses the exact auth+membership resolution block from page.tsx/actions.ts (session -> requireAuthenticatedIdentity -> resolveKredsIdentityId -> membership select -> redirect)"
    - "Single-child ownership guard: db.select(...).where(and(eq(id, childId), eq(familyId, membership.familyId))).limit(1), then if (!child || !child.active) redirect — no partial data ever assembled for cross-tenant/inactive access"
    - "New client form component (EditChildForm) instead of parametrizing ChildrenForm with a mode prop (D-01) — visual pickers copied verbatim, useState pre-seeded with initial values instead of empty string"

key-files:
  created:
    - src/app/family/children/[childId]/edit/EditChildForm.tsx
    - src/app/family/children/[childId]/edit/page.tsx
  modified:
    - src/app/family/children/page.tsx

key-decisions:
  - "Submit button label 'Salvar alterações' (not 'Atualizar') per CONTEXT.md discretion note recommending edit-context save wording"
  - "Editar link positioned between PIN and Desativar in the action-button row — groups profile-editing actions (PIN, Editar) before the destructive Desativar action"
  - "Edit page does not import 'success=1' query param handling — plain redirect('/family/children') on save (matches 13-01's updateChildAction, which does not append ?success=1 since that's reserved for the addChildAction 'add another?' decision screen)"

requirements-completed: [SPEC-3, SPEC-4, SPEC-5]

# Metrics
duration: 18min
completed: 2026-07-03
---

# Phase 13 Plan 02: Edit-Child UI (form, page, list link) Summary

**New /family/children/[childId]/edit SSR route with ownership/active guard, a pre-filled EditChildForm client component wired to Wave 1's updateChildAction, and an Editar link added to every active child card — end-to-end edit flow built, human verification pending.**

## Performance

- **Duration:** 18 min (Tasks 1-2; Task 3 is a human-verify checkpoint, not yet executed)
- **Started:** 2026-07-03
- **Tasks:** 2 of 3 completed (Task 3 is checkpoint:human-verify — paused, awaiting human)
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `EditChildForm.tsx` — new client component: hidden `childProfileId` input, name/age fields pre-filled via `defaultValue`, avatar grid + accent dot pickers pre-selected via `useState(initialAvatarPreset)`/`useState(initialAccentColor)`, `useActionState(updateChildAction, null)` with `role="alert"` error box, submit button "Salvar alterações" / "Salvando..." — no PIN or consent fields (D-01 scope boundary)
- `[childId]/edit/page.tsx` — new async Server Component: reuses the exact auth+membership resolution block from `page.tsx`/`actions.ts`, looks up the child scoped to `and(eq(childProfiles.id, childId), eq(childProfiles.familyId, membership.familyId))`, redirects to `/family/children` before rendering any data if the row is missing or `!active` (T-13-05/T-13-06 mitigation), renders a Cancelar link (D-02) and the pre-filled `EditChildForm` inside a card
- `page.tsx` (list) — added an "Editar" link (`href={/family/children/${child.id}/edit}`) inside the existing action-button row, positioned between "PIN" and the "Desativar" form; no active-filter conditional needed since `children` is already sourced from `listActiveChildProfiles`

## Task Commits

Each task was committed atomically:

1. **Task 1: EditChildForm component (contract-first)** - `5ff5c5b` (feat)
2. **Task 2: Edit SSR page with ownership/active guard + Editar link on list** - `26b6a38` (feat)
3. **Task 3: Verify edit-child flow end-to-end** - PAUSED (checkpoint:human-verify, not yet executed)

## Files Created/Modified

- `src/app/family/children/[childId]/edit/EditChildForm.tsx` (created) — pre-filled client form, submits to `updateChildAction`
- `src/app/family/children/[childId]/edit/page.tsx` (created) — SSR route with ownership/active guard, renders `EditChildForm`
- `src/app/family/children/page.tsx` (modified) — added Editar link to each active child's action-button row

## Decisions Made

- Reused `EditChildFormProps` shape exactly as specified in the plan: `childProfileId` + 4 initial values + `avatarOptions`/`accentOptions`
- No new imports needed in `page.tsx` — `Link` from `next/link` was already imported
- Kept the redirect target as plain `/family/children` (no `?success=1`), matching `updateChildAction`'s existing redirect from 13-01

## Deviations from Plan

### Verification note (not a code deviation)

**1. [Acceptance-criteria grep mismatch — verification tooling, not code] Two grep-based acceptance checks reported false negatives**
- **Found during:** Task 2 verification
- **Issue 1:** `grep -A 10 "db.select" ... | grep -c "schema.childProfiles.familyId, membership.familyId"` returned 0 — the plan's `-A 10` window is too short; the `familyId` filter line sits at offset 15 in the actual (Prettier-formatted, multi-line `and(...)`) query block. Manual inspection confirms the query correctly filters on both `childProfiles.id` and `childProfiles.familyId` (see `page.tsx` lines 40-56).
- **Issue 2:** `grep -A 12 "children/\${child.id}/edit" page.tsx | grep -c ">Editar<"` returned 0 — the plan's grep pattern assumes compact/minified JSX (`>Editar<` on one line), but the codebase's actual JSX formatting style (matching the adjacent "PIN" link) places the text node "Editar" on its own indented line between `>` and `</Link>` tokens, never adjacent on the same line. This matches the exact same structural pattern as the pre-existing "PIN" link one block above it.
- **Resolution:** No code change — both are grep-pattern limitations against the codebase's real formatting, not functional defects. Verified manually: the child lookup query includes the `familyId` guard (confirmed via direct read of `page.tsx`), and the Editar link renders "Editar" as its link text (confirmed via direct read of `page.tsx` lines 325-339, structurally identical to the adjacent PIN link).
- **Files:** No files modified for this deviation — informational only.
- **Commit:** N/A (no code change)

None of the automated task acceptance issues were caused by incorrect code — both are documented here per the deviation-tracking requirement for transparency, and the underlying TypeScript compile check (`pnpm exec tsc --noEmit`) passed cleanly for both new/modified files (pre-existing unrelated test-file errors are out of scope, see Issues Encountered).

## Issues Encountered

**Environment note (not a deviation):** `pnpm exec tsc --noEmit` reports 10 pre-existing errors across 6 test files (`tests/integration/family-audit-isolation.test.ts`, `tests/integration/family-invitations.test.ts`, `tests/unit/family-authorization.test.ts`, `tests/unit/family-constants.test.ts`, `tests/unit/family-invitations.test.ts`, `tests/unit/glossary.test.ts`) — all `TS2307: Cannot find module` (broken relative import paths) or unrelated type errors. None of these errors reference any file created/modified by this plan (`EditChildForm.tsx`, `edit/page.tsx`, `page.tsx`). Confirmed via `grep -i "EditChildForm\|edit/page"` on the tsc output returning zero matches. Out of scope per the deviation rules' scope boundary (pre-existing failures in unrelated files).

**Docker Compose unavailable in this environment (blocks Task 3 automation):** Per project CLAUDE.md conventions, the app runs via `docker compose up`, not `pnpm dev`. In this worktree/agent environment, `docker compose` is not a recognized command (`docker: unknown command: docker compose`) and the fallback `docker-compose`/`docker ps` fails with `unable to resolve docker endpoint: context "lima-docker": context not found`. Per user memory (`feedback_testing_after_deploy.md`), the user verifies GSD checkpoints against production (`kreds.hasslab.pro`), not local Docker — so this environment limitation does not block the intended verification path, but it does mean Task 3 cannot be automated/pre-verified from this agent session. The checkpoint is returned to the user for verification on their own terms (local Docker or prod).

## User Setup Required

None — no external service configuration required. The human-verify checkpoint (Task 3) requires the user to either start their local Docker Compose stack or verify against `kreds.hasslab.pro` after deploy, and manually walk through the 7-step verification script in `13-02-PLAN.md`.

## Next Phase Readiness

- Both UI pieces (`EditChildForm`, `edit/page.tsx`) and the list-link change are code-complete and pass `tsc --noEmit` with zero new errors
- Task 3 (human-verify checkpoint) is the only remaining step in this plan — blocks phase completion until the user confirms the flow end-to-end
- No architectural blockers identified; if the human-verify step surfaces a mismatch, fixes should land in `EditChildForm.tsx` / `edit/page.tsx` / `page.tsx` before re-attempting the checkpoint

---
*Phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel*
*Status: Tasks 1-2 complete, Task 3 (human-verify) pending*

## Self-Check: PASSED

All created/modified files found on disk (`src/app/family/children/[childId]/edit/EditChildForm.tsx`, `src/app/family/children/[childId]/edit/page.tsx`, `src/app/family/children/page.tsx`). Both task commits (`5ff5c5b`, `26b6a38`) found in git log.
