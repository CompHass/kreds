---
phase: 01-foundation
reviewed: 2026-06-20T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/sw.ts
  - src/lib/db/index.ts
  - src/lib/db/schema/index.ts
  - src/lib/db/schema/ledger.ts
  - src/lib/env.ts
  - src/types/next-auth.d.ts
findings:
  critical: 4
  warning: 5
  info: 2
  total: 11
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This is the foundation phase for the Kreds v2 application — database schema, environment validation, Next.js layout/page skeleton, service-worker bootstrap, and NextAuth type augmentation. The implementation is structurally sound but carries four blocker-level defects: (1) the database connection bypasses validated environment variables; (2) `env.ts` runs its Zod parse at module import time, including on the browser/edge where `process.env` is stripped; (3) the `familyMemberships.uniqueActiveGuardian` unique index is missing a partial filter, making it incorrect for multi-membership scenarios; and (4) `ledger_transactions.corrects_transaction_id` lacks a self-referencing foreign key constraint, allowing dangling reversal pointers. Five warnings cover type-safety gaps in the NextAuth session augmentation, a missing constraint ensuring `allocated_amount <= target_amount` on wishlist goals, missing `server-only` guards on server-only modules, an `updatedAt` field that is never auto-updated by the database, and a `cycleStart` field stored as plain text instead of a typed date.

---

## Critical Issues

### CR-01: Database pool bypasses validated environment — raw `process.env` read

**File:** `src/lib/db/index.ts:5`
**Issue:** `new Pool({ connectionString: process.env.DATABASE_URL })` reads `process.env.DATABASE_URL` directly, bypassing the Zod-validated `env` object defined in `src/lib/env.ts`. If `DATABASE_URL` is missing or malformed, `pg` receives `undefined` as the connection string and throws a cryptic runtime error at query time rather than at startup. The validated `env.DATABASE_URL` already guarantees a valid URL format — it should be used here.
**Fix:**
```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { env } from '@/lib/env'  // import the validated object

const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

---

### CR-02: `env.ts` runs Zod parse at module import — crashes on browser/edge bundles

**File:** `src/lib/env.ts:15`
**Issue:** `export const env = envSchema.parse(process.env)` executes unconditionally at module load time. In Next.js 16, `process.env` on the client side is a stripped object; required server-side secrets (`AUTH_SECRET`, `CHILD_SESSION_SECRET`, `AUTH_ZITADEL_SECRET`, etc.) will be `undefined`. If any component or route accidentally imports `env` into a client bundle — directly or transitively — the Zod parse will throw, breaking the entire page. The module also contains no `server-only` sentinel (see WR-03), meaning Next.js tree-shaking cannot prevent the import.
**Fix:**
```typescript
// src/lib/env.ts
import 'server-only'  // prevents accidental client-side import
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  ZITADEL_ISSUER: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  CHILD_SESSION_SECRET: z.string().min(32),
  AUTH_ZITADEL_ID: z.string().min(1),
  AUTH_ZITADEL_SECRET: z.string().min(1),
  AUTH_ZITADEL_ISSUER: z.string().url().default('https://auth.hasslab.pro'),
})

export const env = envSchema.parse(process.env)
```

---

### CR-03: `uniqueActiveGuardian` unique index lacks a partial filter — enforces uniqueness for ALL statuses

**File:** `src/lib/db/schema/index.ts:95-98`
**Issue:** The index `unique_active_guardian` is defined as a plain `uniqueIndex` on `(family_id, identity_id)` with no `WHERE` clause. This means a guardian who leaves a family (`status = 'inactive'`) can never re-join the same family, because the old row's `(familyId, identityId)` pair would still be unique-indexed. The name "uniqueActiveGuardian" implies the intent was to enforce uniqueness only among active memberships — a partial index filtering on `status = 'active'`.
**Fix:**
```typescript
uniqueActiveGuardian: uniqueIndex('unique_active_guardian')
  .on(table.familyId, table.identityId)
  .where(sql`${table.status} = 'active'`),
```
A corresponding database migration must be generated and applied after this change.

---

### CR-04: `corrects_transaction_id` has no foreign key back to `ledger_transactions`

**File:** `src/lib/db/schema/ledger.ts:38`
**Issue:** `correctsTransactionId: uuid('corrects_transaction_id')` is declared with no `.references(() => ledgerTransactions.id)`. The column is intended to point to the transaction being reversed, but without a FK constraint the database will happily store any arbitrary UUID, including UUIDs that do not exist in `ledger_transactions`. Corrupt reversal chains cannot be detected at the DB level. The `no_self_correction` CHECK constraint on line 51 attempts to guard one case but cannot enforce referential integrity.
**Fix:**
```typescript
correctsTransactionId: uuid('corrects_transaction_id')
  .references(() => ledgerTransactions.id),
```
Because `ledger_transactions` is append-only (enforced by trigger from migration `0003`), this FK is safe — the referenced row can never be deleted.

---

## Warnings

### WR-01: `Session.user` type extension drops optionality of base fields

**File:** `src/types/next-auth.d.ts:5-8`
**Issue:** The module augmentation intersects `{ systemRoles: string[] }` (required, non-optional) with `DefaultSession['user']`. In NextAuth v5 beta, `DefaultSession['user']` defines `name`, `email`, and `image` as `string | null | undefined`. The intersection does not break type safety, but `systemRoles` is declared as `string[]` (non-optional), meaning TypeScript will require it even when reading a session that was created before the field was populated (e.g., during initial login callbacks before roles are resolved). This will cause runtime-vs-type mismatches.

In `next-auth/jwt`, `JWT.systemRoles` is correctly typed as `string[] | undefined`, but `Session.user.systemRoles` is not. This asymmetry means the JWT-to-session callback will have a type error when assigning `token.systemRoles` (possibly undefined) to `session.user.systemRoles` (required array).
**Fix:**
```typescript
interface Session {
  user: {
    systemRoles: string[]  // safe here if session callback always populates it
  } & DefaultSession['user']
}
```
If the session callback guarantees this field, the type is correct. If not, change to `systemRoles?: string[]` and add a runtime guard wherever the array is consumed.

---

### WR-02: `wishlistGoals` has no constraint preventing `allocatedAmount > targetAmount`

**File:** `src/lib/db/schema/index.ts:226-228`
**Issue:** The schema enforces `target_amount > 0` and `allocated_amount >= 0` individually, but there is no constraint ensuring `allocated_amount <= target_amount`. A goal could reach a state where more than the target amount is allocated, which would be a data integrity error (a child "over-saving" toward a goal). This invariant must be enforced at the DB level because application code alone is insufficient in concurrent scenarios.
**Fix:**
```typescript
allocatedNotExceedsTarget: check(
  'allocated_not_exceeds_target',
  sql`${table.allocatedAmount} <= ${table.targetAmount}`,
),
```

---

### WR-03: `src/lib/db/index.ts` and `src/lib/env.ts` lack `server-only` guard

**File:** `src/lib/db/index.ts:1`, `src/lib/env.ts:1`
**Issue:** Both modules contain server-only code (PostgreSQL pool, secret environment variables). Neither imports `server-only`. In Next.js, any client component (or a shared utility imported by one) that transitively imports these files will bundle server secrets into the client bundle. The `server-only` package causes a build-time error if such an import occurs, making it a mandatory guard for modules containing DB connections and secrets. This is especially critical given that `AUTH_SECRET`, `CHILD_SESSION_SECRET`, and `AUTH_ZITADEL_SECRET` are in scope.
**Fix:**
```typescript
// First line of both files:
import 'server-only'
```

---

### WR-04: `updatedAt` timestamp fields use `defaultNow()` but never auto-update on row modification

**File:** `src/lib/db/schema/index.ts` (all tables), `src/lib/db/schema/ledger.ts`
**Issue:** Every table defines `updatedAt: timestamp('updated_at').defaultNow().notNull()`. The `.defaultNow()` only sets the value on `INSERT`. On `UPDATE`, Drizzle ORM does NOT automatically refresh `updated_at` — the application must explicitly include `updatedAt: new Date()` in every update query, or a database trigger must maintain it. There are no triggers for this in the migrations directory. If application-layer updates omit this field, `updated_at` will silently retain the insertion timestamp, making it useless for change tracking and cache invalidation.

Note: ledger tables are append-only and exempt, but all mutable tables (identities, families, childProfiles, familyMemberships, guardianInvitations, taskTemplates, wishlistGoals, taskCompletions) are affected.
**Fix:** Add a PostgreSQL trigger function and per-table triggers in a migration, or ensure every Drizzle `update()` call explicitly sets `updatedAt: new Date()`. The trigger approach is more reliable:
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each mutable table, e.g.:
CREATE TRIGGER families_set_updated_at
BEFORE UPDATE ON families
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### WR-05: `cycleStart` stored as plain `text` — no format validation at DB level

**File:** `src/lib/db/schema/index.ts:244`
**Issue:** `cycleStart: text('cycle_start').notNull()` stores an ISO date string with the comment `-- ISO date string: 'YYYY-MM-DD'`. Storing dates as text loses all DB-level type safety: invalid strings like `'2024-13-99'`, `'not-a-date'`, or empty strings are accepted. It also prevents date arithmetic queries and range comparisons from working correctly. PostgreSQL has a native `date` type.
**Fix:**
```typescript
import { date } from 'drizzle-orm/pg-core'

// In taskCompletions table:
cycleStart: date('cycle_start').notNull(),
```
A migration is required to change the column type.

---

## Info

### IN-01: `drizzle.config.ts` uses non-null assertion (`!`) on `DATABASE_URL` — no validated fallback

**File:** `/Users/hass/repos/github/comphass/kreds/drizzle.config.ts:6`
**Issue:** `url: process.env.DATABASE_URL!` uses a TypeScript non-null assertion to suppress the "possibly undefined" error. This silences the compiler but does not add runtime safety. If `DATABASE_URL` is not set when running `drizzle-kit` commands, the error will come from the pg driver with a non-obvious message.
**Fix:** This is a CLI-only config file, so a simple check is sufficient:
```typescript
dbCredentials: {
  url: process.env.DATABASE_URL ?? (() => { throw new Error('DATABASE_URL is required') })(),
},
```

---

### IN-02: `src/app/layout.tsx` imports `React.ReactNode` without importing React

**File:** `src/app/layout.tsx:19`
**Issue:** The type annotation `children: React.ReactNode` uses the `React` namespace but there is no `import React from 'react'` or `import type { ReactNode } from 'react'`. This works with the current TypeScript JSX configuration because `React` is in scope globally via JSX transform, but the type reference `React.ReactNode` is technically an unqualified global namespace access. For clarity and portability, it is better to use an explicit named import.
**Fix:**
```typescript
import type { ReactNode } from 'react'

// Then:
export default function RootLayout({ children }: { children: ReactNode }) {
```

---

_Reviewed: 2026-06-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
