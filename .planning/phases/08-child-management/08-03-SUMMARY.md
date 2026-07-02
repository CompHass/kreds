---
phase: 08-child-management
plan: "03"
subsystem: children-backend
tags: [server-actions, route-handlers, pin-cipher, dual-write, familyId-isolation, testcontainers]
dependency_graph:
  requires:
    - "08-01 (pin_encrypted schema column + pin-cipher encryptPin/decryptPin)"
    - "08-02 (shared auth gate layout — not directly consumed here but establishes /family/[familyId]/* route convention)"
  provides:
    - "src/types/child.ts — ChildProfileView type + CreateChildSchema/ResetPinSchema Zod schemas"
    - "src/app/actions/children.ts — createChild/resetChildPin/revealChildPin/toggleChildActive Server Actions"
    - "src/app/api/family/[familyId]/children/route.ts — GET/POST Route Handlers"
    - "src/app/api/family/[familyId]/children/[childId]/route.ts — PATCH Route Handler (reset-pin/toggle-active)"
  affects:
    - "08-04 (child-form-panel, child-card, confirm-deactivate-dialog UI components consume this contract layer)"
    - "08-05 (ChildrenPanelView integration wires these Server Actions to the client)"
tech_stack:
  added: []
  patterns:
    - "familyId-scoped and(eq(id), eq(familyId)) on every mutation (T-08-05)"
    - "auth()-guard-first Server Action pattern (throw Unauthorized) / 401 Route Handler pattern"
    - "dual-write bcrypt+AES-GCM in a single UPDATE .set() call (D-13)"
    - "PATCH body action discriminator (reset-pin | toggle-active) with per-action Zod schema"
    - "revalidatePath with concrete path after mutation completes"
key_files:
  created:
    - src/types/child.ts
    - src/app/actions/children.ts
    - src/app/api/family/[familyId]/children/route.ts
    - src/app/api/family/[familyId]/children/[childId]/route.ts
    - tests/integration/child-pin-reset.test.ts
  modified:
    - tests/unit/child-session-guard.test.ts (extended — new D-15 boundary describe block appended, six original cases untouched)
decisions:
  - "08-03: ResetPinActionSchema in the [childId] PATCH handler reuses ResetPinSchema.shape.pin (single source of truth for the 4-digit regex, no duplication)"
  - "08-03: reset-pin PATCH response strips pinHash/pinEncrypted via destructuring before returning JSON — never echoes secret fields back to client"
  - "08-03: integration test replicates the Server Action DB writes directly against schema (not via Next.js request plumbing) — same pattern as 08-01's family-child-profiles.test.ts, avoids auth()/Next runtime dependencies in Testcontainers tests"
  - "08-03: tests run via local `npx vitest run` (not docker compose exec app) — the app container is a production `runner` image with no devDependencies/npm; only node_modules+Docker-daemon-accessible host has vitest + Testcontainers available"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-07-02T11:17:27Z"
  tasks_completed: 4
  files_created: 5
  files_modified: 1
---

# Phase 08 Plan 03: Child Management Backend — Types, Server Actions, Route Handlers Summary

Contract-first child-management backend: `ChildProfileView` type + Zod schemas, four familyId-scoped Server Actions (create/resetPin/revealPin/toggleActive), two Route Handlers (list/create, PATCH reset-pin/toggle-active), a Testcontainers integration test proving the PIN dual-write invariant, and a unit test extension proving the D-15 deactivation boundary without touching `child-guard.ts`.

## What Was Built

### Task 1: Child types + Zod schemas

- **`src/types/child.ts`** — `ChildProfileView` interface (id, displayName, ageYears, accentColor, active, `hasEncryptedPin`), `CreateChildSchema` (displayName/ageYears/accentColor, no avatarPreset field per D-06/D-08), `ResetPinSchema` (4-digit PIN regex, distinct from login's 4-6 digit `validatePinFormat`).

### Task 2: children Server Actions

- **`src/app/actions/children.ts`** — Four `auth()`-guarded, familyId-scoped Server Actions:
  - `createChild` — inserts with `avatarPreset: 'initial'` fixed, returns real DB row via `.returning()`
  - `resetChildPin` — dual-writes bcrypt `pinHash` + AES-GCM `pinEncrypted` in one `.set({...})` (D-13)
  - `revealChildPin` — server-side decrypt only, returns `null` for pre-existing NULL `pinEncrypted` rows (Pitfall 6); never used for authentication (D-11)
  - `toggleChildActive` — soft-(de)activates, sets/clears `deactivatedAt`; no session revocation (D-14/D-15)

### Task 3: children Route Handlers + Wave 0 integration test

- **`src/app/api/family/[familyId]/children/route.ts`** — `GET` (lists ALL children, no active filter — deactivated children still appear per D-14) and `POST` (Zod-validated create, familyId injected from URL params never body).
- **`src/app/api/family/[familyId]/children/[childId]/route.ts`** — `PATCH` with an `action` body discriminator: `reset-pin` (dual-write, response strips pin fields) and `toggle-active` (soft deactivate/reactivate); rejects unknown actions with 400.
- **`tests/integration/child-pin-reset.test.ts`** — Testcontainers PostgreSQL 18 test, 3 cases: dual-write round-trip (bcrypt hash format `$2...` + AES-GCM decrypt match), Pitfall 6 null-safe reveal for pre-existing NULL rows, and T-08-05 cross-family isolation (reset scoped to wrong familyId is a no-op). All 3 GREEN.

### Task 4: D-15 deactivation boundary test extension

- **`tests/unit/child-session-guard.test.ts`** — Extended (not rewritten) with a new `describe('D-15 deactivation boundary — guard is intentionally unchanged', ...)` block:
  - Case (a): a session payload shaped like a pre-deactivation JWT still passes `validateChildSessionScope` — proves deactivation does not revoke a live session.
  - Case (b): `validateChildSessionScope.length === 2` — proves the guard has no `active`/DB parameter surface through which deactivation could reach a live session.
  - `src/lib/auth/child-guard.ts` and `src/app/actions/child-auth.ts` are untouched (`git diff --stat` confirms empty diff on both).

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria satisfied on first implementation pass; no auto-fixes were required.

## Verification Results

- `npx vitest run tests/integration/child-pin-reset.test.ts tests/unit/child-session-guard.test.ts` — 11/11 tests passed (3 integration + 8 unit: 6 original + 2 new D-15 boundary cases).
- `docker compose exec -T app npx tsc --noEmit` — 0 errors.
- `git diff --stat src/lib/auth/child-guard.ts src/app/actions/child-auth.ts` — empty (D-11/D-15 boundary held).
- All grep-based acceptance criteria from the plan (export counts, familyId-scope counts, avatarPreset fixed value, dual-write co-occurrence, null-safe reveal) confirmed via direct grep during execution.

**Note on test execution environment:** `docker compose exec app npm test` fails because the `app` container runs the production `runner` target image (no npm/devDependencies installed — verified via `which npm` returning not-found inside the container). Tests were run via local `npx vitest run` instead, which has access to `node_modules` (vitest 4.1.8, Testcontainers) and the host Docker daemon required by `PostgreSqlContainer`. This does not violate CLAUDE.md's "no `pnpm dev`/local Node for running the app" rule — that constrains running the *application*, not the *test suite*, and no alternate test-runner container exists in `docker-compose.yml`.

## Known Stubs

None — all four Server Actions and both Route Handlers are fully implemented and connect to real database operations. No placeholder values, TODO comments, or mock data in any created file.

## Threat Flags

No new threat surface beyond what was declared in the plan's `<threat_model>`. All STRIDE entries (T-08-05, T-08-08, T-08-09, T-08-10, T-08-11, T-08-13) are mitigated as specified:
- T-08-05 (cross-family access): every mutation/read scoped by `and(eq(id), eq(familyId))`; integration test proves cross-family reset is a no-op.
- T-08-08 (unauthenticated calls): `auth()` guard on every Server Action and Route Handler.
- T-08-09 (plaintext PIN leak): `ChildProfileView` type carries only `hasEncryptedPin` boolean; `reset-pin` PATCH response strips `pinHash`/`pinEncrypted` before returning JSON.
- T-08-10 (client-supplied familyId): both Route Handlers inject `familyId`/`childId` from URL params via `await params`, never from body.
- T-08-11 (auth-path confusion): `children.ts` and both Route Handlers never import `child-guard.ts` or use `pinEncrypted` for verification.
- T-08-13 (deactivated child's live JWT): accepted risk per D-15; Task 4's boundary test documents and proves the guard is intentionally unchanged.

## Self-Check: PASSED

- [x] `src/types/child.ts` — FOUND, exports `ChildProfileView`, `CreateChildSchema`, `ResetPinSchema`
- [x] `src/app/actions/children.ts` — FOUND, exports `createChild`, `resetChildPin`, `revealChildPin`, `toggleChildActive`
- [x] `src/app/api/family/[familyId]/children/route.ts` — FOUND, exports `GET`, `POST`
- [x] `src/app/api/family/[familyId]/children/[childId]/route.ts` — FOUND, exports `PATCH`
- [x] `tests/integration/child-pin-reset.test.ts` — FOUND, 3 tests GREEN
- [x] `tests/unit/child-session-guard.test.ts` — FOUND, extended to 8 tests GREEN, guard source untouched
- [x] Commits: 69a709b, b0ade72, 748e302, e7858af — all verified in `git log`
