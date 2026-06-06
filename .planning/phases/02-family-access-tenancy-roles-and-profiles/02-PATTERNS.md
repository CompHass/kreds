# Phase 02: Family Access, Tenancy, Roles, and Profiles - Pattern Map

**Mapped:** 2026-06-06
**Files analyzed:** 24 new/modified file targets
**Analogs found:** 24 / 24

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `auth.ts` | config | request-response | `src/lib/env.ts` | partial-match |
| `src/app/api/auth/[...nextauth]/route.ts` | route | request-response | `src/app/api/health/route.ts` | role-match |
| `src/lib/auth/session.ts` | service | request-response | `src/lib/db/index.ts` | partial-match |
| `src/lib/auth/authorization.ts` | service | request-response | `src/lib/db/index.ts` | partial-match |
| `src/lib/db/schema/index.ts` | model | CRUD | `src/lib/db/schema/index.ts` | exact-existing |
| `src/lib/db/index.ts` | config | CRUD | `src/lib/db/index.ts` | exact-existing |
| `src/lib/families/commands.ts` | service | CRUD | `src/lib/db/index.ts` | partial-match |
| `src/lib/families/invitations.ts` | service | CRUD | `src/lib/db/index.ts` | partial-match |
| `src/lib/families/child-profiles.ts` | service | CRUD | `src/lib/db/index.ts` | partial-match |
| `src/lib/families/audit.ts` | service | CRUD | `src/lib/db/index.ts` | partial-match |
| `src/lib/families/timezones.ts` | utility | transform | `src/modules/glossary/terms.ts` | role-match |
| `src/lib/families/avatar-presets.ts` | utility | transform | `src/modules/glossary/terms.ts` | role-match |
| `src/modules/glossary/terms.ts` | utility | transform | `src/modules/glossary/terms.ts` | exact-existing |
| `src/app/api/families/route.ts` | route | request-response | `src/app/api/families/route.ts` | exact-existing |
| `src/app/page.tsx` | component | request-response | `src/app/page.tsx` | exact-existing |
| `src/app/family/onboarding/page.tsx` | component | request-response | `src/app/page.tsx` | role-match |
| `src/app/family/children/page.tsx` | component | request-response | `src/app/page.tsx` | role-match |
| `src/app/family/invitations/page.tsx` | component | request-response | `src/app/page.tsx` | role-match |
| `src/app/family/audit/page.tsx` | component | request-response | `src/app/page.tsx` | role-match |
| `tests/unit/family-authorization.test.ts` | test | request-response | `tests/unit/glossary.test.ts` | role-match |
| `tests/unit/family-constants.test.ts` | test | transform | `tests/unit/glossary.test.ts` | exact-role |
| `tests/integration/family-tenancy.test.ts` | test | CRUD | `tests/integration/db-connection.test.ts` | exact-role |
| `tests/e2e/family-access.spec.ts` | test | request-response | `tests/e2e/health.spec.ts` | role-match |
| `docs/PRIVACY-INVENTORY.md` | docs | transform | `docs/PRIVACY-INVENTORY.md` | exact-existing |

## Pattern Assignments

### `auth.ts` (config, request-response)

**Analog:** `src/lib/env.ts` and `src/lib/logger.ts`

**Imports/config validation pattern** (`src/lib/env.ts` lines 1-10):
```typescript
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ZITADEL_ISSUER: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
```

**Logger export style** (`src/lib/logger.ts` lines 1-9):
```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
})
```

**Apply:** Keep `auth.ts` as a small root-level config export. Add required Auth.js/ZITADEL env keys to `src/lib/env.ts` using the existing Zod object pattern before reading them in auth config.

---

### `src/app/api/auth/[...nextauth]/route.ts` (route, request-response)

**Analog:** `src/app/api/health/route.ts`

**Route handler export pattern** (lines 1-9):
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.npm_package_version || 'dev',
    timestamp: new Date().toISOString(),
  })
}
```

**Apply:** Use App Router route module exports. For Auth.js, export `GET` and `POST` handlers from `auth.ts`; do not introduce Pages Router API files.

---

### `src/lib/auth/session.ts` and `src/lib/auth/authorization.ts` (service, request-response)

**Analog:** `src/lib/db/index.ts`, `src/lib/env.ts`, `src/app/api/families/route.ts`

**DB import/access pattern** (`src/lib/db/index.ts` lines 1-6):
```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

**Alias import from Route Handlers** (`src/app/api/families/route.ts` lines 1-3):
```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
```

**Core existing DB read pattern** (`src/app/api/families/route.ts` lines 5-8):
```typescript
export async function GET() {
  const rows = await db.select().from(schema.families)
  return NextResponse.json(rows)
}
```

**Apply:** New auth/authorization helpers should be server-only modules that import `db` and `schema` through `@/lib/*` aliases from app routes, then constrain every query by authenticated identity and `family_id`. Replace the unscoped `db.select().from(schema.families)` pattern with membership-checked queries.

---

### `src/lib/db/schema/index.ts` (model, CRUD)

**Analog:** `src/lib/db/schema/index.ts`

**Imports pattern** (line 1):
```typescript
import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'
```

**Current table pattern** (lines 3-9):
```typescript
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Apply:** Extend this single schema barrel rather than creating a parallel tenancy schema. Keep camelCase TS property names mapped to snake_case database columns. Add identities, memberships, invitations, child profiles, consents, and audit events here or in files re-exported by this index.

---

### `src/lib/db/index.ts` (config, CRUD)

**Analog:** `src/lib/db/index.ts`

**Database singleton pattern** (lines 1-6):
```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

**Apply:** Reuse this exported `db` for all Phase 02 domain commands. If tests need isolated databases, follow the integration-test pattern below instead of mutating the app singleton.

---

### Family domain command modules (service, CRUD)

Targets: `src/lib/families/commands.ts`, `src/lib/families/invitations.ts`, `src/lib/families/child-profiles.ts`, `src/lib/families/audit.ts`

**Analog:** `src/lib/db/index.ts`, `tests/integration/db-connection.test.ts`

**Transaction-ready import style** (`tests/integration/db-connection.test.ts` lines 1-7):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../../src/lib/db/schema'
```

**DB operation style** (`tests/integration/db-connection.test.ts` lines 30-34):
```typescript
it('should have families table queryable after migration', async () => {
  const rows = await db.select().from(schema.families)
  expect(Array.isArray(rows)).toBe(true)
  expect(rows.length).toBe(0)
})
```

**Apply:** Domain commands should group state mutation and audit insert in one Drizzle transaction. Tests should assert the tables are queryable and constraints work using the same `schema.*` object.

---

### `src/lib/families/timezones.ts` and `src/lib/families/avatar-presets.ts` (utility, transform)

**Analog:** `src/modules/glossary/terms.ts`

**Constants pattern** (lines 1-21):
```typescript
export const TERMS = {
  KREDS: 'Kreds',
  FIRSTFRUITS: 'Firstfruits',
  FIRSTFRUITS_TREASURY: 'Firstfruits Treasury',
  KREDS_DO_BEM: 'Kreds do Bem',
  DONATION_MATCH: 'Donation Match',
  TASK_TEMPLATE: 'Task Template',
  TASK_COMPLETION: 'Task Completion',
  SEVENTY_TWO_HOUR_RULE: '72-Hour Rule',
  WEEKLY_CYCLE: 'Weekly Cycle',
  WEEKLY_GRATITUDE_REPORT: 'Weekly Gratitude Report',
  WISHLIST_GOAL: 'Wishlist Goal',
  GUARDIAN: 'Guardian',
  CHILD: 'Child',
  FAMILY: 'Family',
  KREDS_ENGINE: 'Kreds Engine',
  NEGATIVE_ADJUSTMENT: 'Negative Adjustment',
  LEDGER_TRANSACTION: 'Ledger Transaction',
} as const

export type TermKey = keyof typeof TERMS
```

**Apply:** Define closed sets with `as const` and exported derived union types, e.g. `export type AvatarPreset = keyof typeof AVATAR_PRESETS` or value unions. Do not allow arbitrary photo upload identifiers.

---

### `src/modules/glossary/terms.ts` (utility, transform)

**Analog:** `src/modules/glossary/terms.ts`

**Existing role terms** (lines 13-15):
```typescript
  GUARDIAN: 'Guardian',
  CHILD: 'Child',
  FAMILY: 'Family',
```

**Apply:** Reuse these constants in UI/tests where canonical product language is needed. Add new terms only if the phase introduces durable terminology such as `Family Invitation`, `Child Profile`, or `Audit Timeline`.

---

### `src/app/api/families/route.ts` (route, request-response)

**Analog:** `src/app/api/families/route.ts` and `src/app/api/health/route.ts`

**Current unsafe proof-point pattern** (`src/app/api/families/route.ts` lines 5-8):
```typescript
export async function GET() {
  const rows = await db.select().from(schema.families)
  return NextResponse.json(rows)
}
```

**Simple response pattern** (`src/app/api/health/route.ts` lines 3-9):
```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.npm_package_version || 'dev',
    timestamp: new Date().toISOString(),
  })
}
```

**Apply:** Keep `NextResponse.json(...)`, but replace all-family enumeration with authenticated family-scoped behavior. For unauthorized access, return a structured JSON error and 401/403; do not leak family counts or IDs.

---

### Server-rendered pages (component, request-response)

Targets: `src/app/page.tsx`, `src/app/family/onboarding/page.tsx`, `src/app/family/children/page.tsx`, `src/app/family/invitations/page.tsx`, `src/app/family/audit/page.tsx`

**Analog:** `src/app/page.tsx`, `src/app/layout.tsx`

**Server-rendered DB-backed page pattern** (`src/app/page.tsx` lines 1-15):
```typescript
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const families = await db.select().from(schema.families)
  return (
    <main>
      <h1>Kreds</h1>
      <p>Christian stewardship and allowance management for families.</p>
      <p>{families.length} families registered</p>
    </main>
  )
}
```

**Root layout/provider pattern** (`src/app/layout.tsx` lines 1-22):
```typescript
import type { Metadata } from 'next'
import { SerwistProvider } from '@serwist/next/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kreds',
  description: 'Christian stewardship and allowance management for families',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SerwistProvider swUrl="/sw.js">{children}</SerwistProvider>
      </body>
    </html>
  )
}
```

**Apply:** Keep pages as async Server Components with `dynamic = 'force-dynamic'` for auth/DB-backed views. Replace public family count with auth-aware branching: public sign-in, authenticated no-family onboarding, authenticated family dashboard/child-profile setup.

---

### Unit tests (test, request-response/transform)

Targets: `tests/unit/family-authorization.test.ts`, `tests/unit/family-constants.test.ts`

**Analog:** `tests/unit/glossary.test.ts`

**Vitest import and describe pattern** (lines 1-4):
```typescript
import { describe, it, expect } from 'vitest'
import { TERMS } from '../../src/modules/glossary/terms'

describe('Glossary terms', () => {
```

**Constant assertions pattern** (lines 10-16):
```typescript
  it('should have all required terms', () => {
    expect(TERMS.KREDS).toBe('Kreds')
    expect(TERMS.FIRSTFRUITS).toBe('Firstfruits')
    expect(TERMS.KREDS_DO_BEM).toBe('Kreds do Bem')
    expect(TERMS.WEEKLY_CYCLE).toBe('Weekly Cycle')
    expect(TERMS.SEVENTY_TWO_HOUR_RULE).toBe('72-Hour Rule')
  })
```

**Collection assertions pattern** (lines 18-24):
```typescript
  it('should have all non-empty string values', () => {
    const values = Object.values(TERMS)
    values.forEach(value => {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    })
  })
```

**Apply:** Use Vitest `describe/it/expect`, relative imports for unit tests, and direct behavior assertions. Cover role predicates, invitation lifecycle predicates, allowed avatar/accent constants, and denied unauthenticated/child-role actions.

---

### Integration tests (test, CRUD)

Target: `tests/integration/family-tenancy.test.ts`

**Analog:** `tests/integration/db-connection.test.ts`

**Testcontainers setup pattern** (lines 1-18):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../../src/lib/db/schema'

describe('PostgreSQL Connection with Migrations', () => {
  let container: any
  let pool: any
  let db: any

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine').start()
    pool = new Pool({ connectionString: container.getConnectionUri() })
    db = drizzle(pool)
    await migrate(db, { migrationsFolder: './drizzle' })
  }, 60000)
```

**Cleanup pattern** (lines 20-23):
```typescript
  afterAll(async () => {
    await pool.end()
    await container.stop()
  })
```

**Migration/query assertion pattern** (lines 25-34):
```typescript
  it('should connect and execute a query', async () => {
    const result = await db.execute('SELECT 1 as value')
    expect(result.rows[0].value).toBe(1)
  })

  it('should have families table queryable after migration', async () => {
    const rows = await db.select().from(schema.families)
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBe(0)
  })
```

**Apply:** Extend this pattern for migration-backed constraints: family-scoped indexes, duplicate membership prevention, no child profile without active guardian, invitation status constraints, soft deactivation, and audit-event creation in transactions.

---

### E2E tests (test, request-response)

Target: `tests/e2e/family-access.spec.ts`

**Analog:** `tests/e2e/health.spec.ts` and `playwright.config.ts`

**Playwright request smoke pattern** (`tests/e2e/health.spec.ts` lines 1-8):
```typescript
import { test, expect } from '@playwright/test'

test('health endpoint returns 200', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe('ok')
})
```

**E2E config pattern** (`playwright.config.ts` lines 3-17):
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 15'] } },
  ],
})
```

**Apply:** Keep E2E smoke tests focused unless auth session seeding exists. Add request-level tests for unauthenticated `/api/families` no longer enumerating data, and UI smoke for public landing/onboarding where feasible.

---

### `docs/PRIVACY-INVENTORY.md` (docs, transform)

**Analog:** `docs/PRIVACY-INVENTORY.md`

**Data category table pattern** (lines 11-26):
```markdown
## Data Categories

| Data Category | Collected In | Requirement | Purpose | Legal Basis | Retention |
|---------------|-------------|-------------|---------|-------------|-----------|
| Child display name | Phase 2 | FAM-03 | Profile identification | Parental consent (parent creates profile) | Until family account deleted |
| Child role assignment | Phase 2 | FAM-04 | Authorization and UI gating | Parental consent | Until family account deleted |
| Child avatar / visual identifier | Phase 2 | FAM-06 | Profile customization and visual recognition | Parental consent | Until changed or account deleted |
```

**Consent flow pattern** (lines 39-48):
```markdown
## Parental Consent Flow Description

In Kreds v1, children are not independent account holders. Instead:

1. A parent/guardian authenticates through ZITADEL OIDC (Phase 2).
2. The parent creates a family account and child profiles within that family.
3. All child data is managed under the parent's authenticated session.
4. Parental consent is established through the parent's deliberate action of creating a child profile and configuring family settings.
5. No child-facing registration flow exists — children cannot self-register or create accounts.
```

**Apply:** Update the existing Phase 2 rows for child age in years, explicit auditable consent evidence, and optional future child identity linkage. Keep markdown tables and numbered flow style.

## Shared Patterns

### Import and formatting conventions

**Source:** `src/app/page.tsx`, `src/lib/db/index.ts`, `tests/unit/glossary.test.ts`

**Apply to:** All TypeScript files

```typescript
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
```

Project code omits semicolons and uses single quotes. App code uses `@/` aliases; tests currently use relative imports into `src`.

### Drizzle schema and DB access

**Source:** `src/lib/db/schema/index.ts` and `src/lib/db/index.ts`

**Apply to:** Schema, services, integration tests

```typescript
export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

```typescript
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

### Route handler JSON responses

**Source:** `src/app/api/health/route.ts` and `src/app/api/families/route.ts`

**Apply to:** Auth-protected API routes and family endpoints

```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.npm_package_version || 'dev',
    timestamp: new Date().toISOString(),
  })
}
```

### Server-rendered DB-backed pages

**Source:** `src/app/page.tsx`

**Apply to:** Family onboarding, child profile, invitations, audit pages

```typescript
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const families = await db.select().from(schema.families)
  return (
    <main>
      <h1>Kreds</h1>
      <p>Christian stewardship and allowance management for families.</p>
      <p>{families.length} families registered</p>
    </main>
  )
}
```

Important: copy the async Server Component shape and `force-dynamic`; do not copy the unscoped family enumeration behavior.

### Constants and canonical terminology

**Source:** `src/modules/glossary/terms.ts`

**Apply to:** Role constants, avatar presets, timezone display constants, UI/test wording

```typescript
export const TERMS = {
  KREDS: 'Kreds',
  GUARDIAN: 'Guardian',
  CHILD: 'Child',
  FAMILY: 'Family',
} as const

export type TermKey = keyof typeof TERMS
```

### Test infrastructure

**Source:** `vitest.config.ts`, `tests/integration/db-connection.test.ts`, `tests/e2e/health.spec.ts`

**Apply to:** Unit, integration, E2E tests

```typescript
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

```typescript
container = await new PostgreSqlContainer('postgres:18-alpine').start()
pool = new Pool({ connectionString: container.getConnectionUri() })
db = drizzle(pool)
await migrate(db, { migrationsFolder: './drizzle' })
```

## No Analog Found

All planned file roles have at least a partial in-repo analog. Gaps are functional rather than structural:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `auth.ts` | config | request-response | No Auth.js/ZITADEL file exists yet; use `src/lib/env.ts` for env validation style and Auth.js docs from research for provider shape. |
| `src/lib/auth/authorization.ts` | service | request-response | No authorization service exists yet; use DB access/import patterns and implement new family-membership checks. |
| `src/lib/families/*` | service | CRUD | No domain command service exists yet; use Drizzle access/test patterns and research transaction guidance. |

## Metadata

**Analog search scope:** `src/**/*.ts`, `src/**/*.tsx`, `tests/**/*.ts`, `docs/**/*.md`, root config files
**Files scanned:** 24
**Pattern extraction date:** 2026-06-06
