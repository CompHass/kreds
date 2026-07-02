---
phase: 08-child-management
plan: "01"
subsystem: crypto-and-schema
tags: [aes-256-gcm, pin-encryption, child-profiles, drizzle-migration, server-only]
dependency_graph:
  requires: []
  provides:
    - encryptPin/decryptPin (src/lib/crypto/pin-cipher.ts)
    - createChildProfile/deactivateChildProfile/updateChildProfile (src/lib/families/child-profiles.ts)
    - pin_encrypted column in child_profiles table (drizzle/0009_tricky_living_mummy.sql)
    - PIN_ENCRYPTION_KEY env validation (src/lib/env.ts)
  affects:
    - plans 08-02 through 08-05 (all depend on pin_encrypted column and encryptPin/decryptPin)
tech_stack:
  added: []
  patterns:
    - AES-256-GCM with 12-byte random IV and 16-byte auth tag per encryption call
    - server-only import guard on crypto module (prevents client bundle inclusion)
    - Eager env validation at module load (fails fast at boot)
    - iv:authTag:ciphertext base64-serialized format
    - familyId-scoped domain commands (defense-in-depth isolation)
key_files:
  created:
    - src/lib/crypto/pin-cipher.ts
    - src/lib/families/child-profiles.ts
    - tests/unit/pin-cipher.test.ts
    - drizzle/0009_tricky_living_mummy.sql
    - drizzle/meta/0009_snapshot.json
  modified:
    - src/lib/env.ts (added PIN_ENCRYPTION_KEY field)
    - src/lib/db/schema/index.ts (added pinEncrypted column to childProfiles)
    - tests/integration/family-child-profiles.test.ts (added vi.mock('server-only') + try/catch pattern)
    - vitest.config.ts (exclude .claude worktrees from test discovery)
    - .env.example (added PIN_ENCRYPTION_KEY documentation)
    - drizzle/meta/_journal.json (registered idx 9)
decisions:
  - "AES-256-GCM with explicit authTagLength=16 on both cipher and decipher (Node v22+ deprecation requirement)"
  - "getKey() helper reads PIN_ENCRYPTION_KEY once per call — no module-level key caching"
  - "pin_encrypted nullable with no default — existing seeded child (Ana) has pinHash but no recoverable plaintext"
  - "Migration applied via direct psql (drizzle push completed schema sync — project uses push not migrate for dev)"
  - "Exclude .claude worktrees from vitest to prevent duplicate test suite runs"
metrics:
  duration: 8 minutes
  completed_date: "2026-07-02T03:16:50Z"
  tasks_completed: 3
  files_created: 5
  files_modified: 6
---

# Phase 08 Plan 01: PIN Cipher + Schema Foundation Summary

AES-256-GCM reversible PIN cipher with fresh random IV per call, eager env validation, pin_encrypted nullable column migration, and familyId-scoped child-profile domain commands satisfying the pre-existing RED integration scaffold.

## What Was Built

### Task 1: AES-256-GCM PIN cipher + env validation + Wave 0 cipher test

- **`src/lib/crypto/pin-cipher.ts`** — Server-only AES-256-GCM utility. `encryptPin(pin)` generates a 12-byte random IV, encrypts via `createCipheriv('aes-256-gcm', key, iv, {authTagLength:16})`, serializes as `base64(iv):base64(authTag):base64(ciphertext)`. `decryptPin(stored)` deserializes, calls `setAuthTag()`, and verifies the GCM auth tag on decrypt. No bcrypt, no pinHash, no child-guard references.

- **`src/lib/env.ts`** — Added `PIN_ENCRYPTION_KEY: z.string().refine(v => Buffer.from(v,'base64').length === 32, ...)` inside the existing `envSchema` object. Eager parse at module load fails boot if the key is missing or malformed.

- **`.env.example`** — Added `PIN_ENCRYPTION_KEY=` with generation command comment.

- **`tests/unit/pin-cipher.test.ts`** — 4 tests: round-trip, IV uniqueness, tamper rejection, 3-segment format. All GREEN.

### Task 2: pinEncrypted schema column + child-profiles domain commands

- **`src/lib/db/schema/index.ts`** — Added `pinEncrypted: text('pin_encrypted')` after `pinHash` in the `childProfiles` table. No `.notNull()`, no `.default()` — nullable for pre-existing rows.

- **`src/lib/families/child-profiles.ts`** — Three exported domain commands:
  - `createChildProfile(input)` — inserts with `avatarPreset: 'initial'` fixed (D-08), returns created row
  - `deactivateChildProfile(childId, familyId)` — soft deactivation with `active: false`, `deactivatedAt`, both familyId-scoped
  - `updateChildProfile(childId, familyId, patch)` — updates provided fields + `updatedAt`, familyId-scoped

- **`tests/integration/family-child-profiles.test.ts`** — Fixed pre-existing RED scaffold: added `vi.mock('server-only', () => ({}))` + try/catch pattern in `beforeAll` (mirrors ledger-engine.test.ts). All 23 tests GREEN.

### Task 3: Migration 0009 generated + applied

- **`drizzle/0009_tricky_living_mummy.sql`** — `ALTER TABLE "child_profiles" ADD COLUMN "pin_encrypted" text;`. No NOT NULL, no DEFAULT.
- Column live in `kreds-postgres-1` as nullable text (verified via `information_schema.columns`).
- `drizzle/meta/_journal.json` updated with idx 9 entry.
- Orphaned `0008_abandoned_scourge.sql` left untouched per Pitfall 5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added vi.mock('server-only') to RED scaffold**
- **Found during:** Task 2
- **Issue:** Pre-existing `tests/integration/family-child-profiles.test.ts` lacked `vi.mock('server-only', () => ({}))`, causing the test suite to fail when importing `child-profiles.ts` which starts with `import 'server-only'`
- **Fix:** Added `vi.mock('server-only', () => ({}))` and updated `import` to include `vi` — mirrors the `ledger-engine.test.ts` pattern
- **Files modified:** `tests/integration/family-child-profiles.test.ts`
- **Commit:** 4304675

**2. [Rule 1 - Bug] Added try/catch to beforeAll in family-child-profiles.test.ts**
- **Found during:** Task 2
- **Issue:** `beforeAll` had no error handling; when testcontainers Ryuk container fails (Podman environment), `pool` remained `undefined` causing `TypeError: Cannot read properties of undefined (reading 'end')` in `afterAll`
- **Fix:** Wrapped container startup in try/catch, added null guards in `afterAll` — identical to `ledger-engine.test.ts` pattern
- **Files modified:** `tests/integration/family-child-profiles.test.ts`
- **Commit:** 4304675

**3. [Rule 2 - Missing config] Excluded .claude worktrees from vitest**
- **Found during:** Task 2
- **Issue:** Vitest was discovering and running test files inside `.claude/worktrees/` (parallel agent worktrees), causing duplicate test runs and false failures from a stale worktree with an older copy of the test file still missing `vi.mock('server-only')`
- **Fix:** Added `exclude: ['node_modules', '.claude/**', 'dist']` to `vitest.config.ts`
- **Files modified:** `vitest.config.ts`
- **Commit:** 4304675

**4. [Rule 3 - Blocking] Migration applied via psql instead of drizzle-kit migrate**
- **Found during:** Task 3
- **Issue:** `drizzle-kit migrate` hanged indefinitely when connecting to `localhost:5432` (no migration tracking table exists in DB — project uses `drizzle push` for dev). Direct psql via `docker exec` applied the column; `drizzle push` completed the schema sync and confirmed no further drift.
- **Fix:** Applied `ALTER TABLE "child_profiles" ADD COLUMN "pin_encrypted" text;` directly via `docker exec kreds-postgres-1 psql`, confirmed with `information_schema.columns` query. Generated file and journal entry are correct.
- **Files modified:** None (DB state change)
- **Note:** The 0009 migration file and journal entry are committed and will be applied correctly in fresh environments via `drizzle-kit migrate` (drizzle-kit generate correctly produced the file; the issue was only with the live dev DB which has no migration tracking table).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `64b1237` | AES-256-GCM PIN cipher + eager env validation + Wave 0 cipher test |
| Task 2 | `4304675` | Add pinEncrypted schema column + child-profiles domain commands |
| Task 3 | `349c80e` | Generate + apply pin_encrypted migration (drizzle/0009) |

## Known Stubs

None — all exported functions are fully implemented and connect to real database operations. No placeholder values or TODO comments in created files.

## Threat Flags

No new threat surface beyond what was declared in the plan's threat model. The `pin-cipher.ts` module is server-only isolated, `PIN_ENCRYPTION_KEY` never leaves the server, and all domain commands enforce familyId scoping.

## Self-Check: PASSED

- [x] `src/lib/crypto/pin-cipher.ts` — FOUND, line 1 is `import 'server-only'`
- [x] `src/lib/families/child-profiles.ts` — FOUND, exports 3 domain commands
- [x] `src/lib/db/schema/index.ts` — FOUND, `pinEncrypted` column added (nullable, no notNull/default)
- [x] `src/lib/env.ts` — FOUND, `PIN_ENCRYPTION_KEY` in envSchema
- [x] `drizzle/0009_tricky_living_mummy.sql` — FOUND, contains `ADD COLUMN "pin_encrypted" text`
- [x] `tests/unit/pin-cipher.test.ts` — FOUND, 4 tests GREEN
- [x] `tests/integration/family-child-profiles.test.ts` — FOUND, fixed RED scaffold, 23 tests GREEN
- [x] `drizzle/meta/_journal.json` — FOUND, idx 9 registered
- [x] `pin_encrypted` column live in `kreds-postgres-1` as nullable text (verified)
- [x] All 27 tests (4 unit + 23 integration) pass
- [x] Commits: 64b1237, 4304675, 349c80e — all verified in git log
