# Phase 1: Foundation, Privacy, and Delivery Skeleton - Pattern Map

**Mapped:** 2026-06-06
**Files analyzed:** 18
**Analogs found:** 0 / 18 (greenfield — patterns sourced from official documentation and RESEARCH.md excerpts)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | — | — | greenfield |
| `tsconfig.json` | config | — | — | greenfield |
| `next.config.ts` | config | — | — | greenfield |
| `postcss.config.mjs` | config | — | — | greenfield |
| `.env.example` | config | — | — | greenfield |
| `.npmrc` | config | — | — | greenfield |
| `drizzle.config.ts` | config | — | — | greenfield |
| `Dockerfile` | config | — | — | greenfield |
| `docker-compose.yml` | config | — | — | greenfield |
| `src/app/layout.tsx` | component | request-response | — | greenfield |
| `src/app/page.tsx` | component | request-response | — | greenfield |
| `src/app/globals.css` | config | — | — | greenfield |
| `src/app/api/health/route.ts` | route (Route Handler) | request-response | — | greenfield |
| `src/lib/db/index.ts` | service | CRUD | — | greenfield |
| `src/lib/db/schema/index.ts` | model | CRUD | — | greenfield |
| `src/lib/env.ts` | utility | request-response | — | greenfield |
| `src/lib/logger.ts` | utility | request-response | — | greenfield |
| `src/modules/glossary/terms.ts` | utility | — | — | greenfield |
| `src/middleware.ts` | middleware | request-response | — | greenfield |
| `vitest.config.ts` | config (test) | — | — | greenfield |
| `playwright.config.ts` | config (test) | — | — | greenfield |
| `tests/setup.ts` | test | — | — | greenfield |
| `tests/unit/glossary.test.ts` | test | — | — | greenfield |
| `tests/integration/db-connection.test.ts` | test | CRUD | — | greenfield |
| `tests/e2e/health.spec.ts` | test | request-response | — | greenfield |
| `docs/PRIVACY-INVENTORY.md` | documentation | — | — | greenfield |
| `docs/GLOSSARY.md` | documentation | — | — | greenfield |

## Pattern Assignments

### `package.json` (config)

**Source:** RESEARCH.md § Standard Stack + Installation commands

**Dependencies pattern** — all versions verified via `npm view` on 2026-06-06:
```json
{
  "name": "kreds",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Key dependencies** (from RESEARCH.md):
- `next@16.2.7`, `react@19.2.7`, `react-dom@19.2.7`
- `drizzle-orm@0.45.2`, `pg@8.21.0`, `zod@4.4.3`, `pino@10.3.1`, `pg-boss@12.18.2`
- `react-hook-form@7.77.0`, `@hookform/resolvers`, `lucide-react`, `@serwist/next@9.5.11`
- Dev: `drizzle-kit@0.31.10`, `typescript@6.0.3`, `@types/pg`, `tailwindcss@4.3.0`, `@tailwindcss/postcss`, `vitest@4.1.8`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `vite-tsconfig-paths`, `playwright@1.60.0`, `@testcontainers/postgresql@12.0.1`, `testcontainers@12.0.1`

**Package manager:** pnpm (use `corepack enable pnpm`)

---

### `next.config.ts` (config)

**Source:** RESEARCH.md § Pattern 3 (Docker standalone) + Pitfall 3

**Key configuration** — must enable standalone output for Docker and handle Serwist:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // outputFileTracingIncludes: { '/api/health': ['./src/lib/**/*'] }, // if dynamic requires needed
}

export default nextConfig
```

**Critical:** `output: 'standalone'` is required for the multi-stage Docker build. Without it, the Dockerfile runner stage fails.

---

### `src/lib/db/index.ts` (service, CRUD)

**Source:** RESEARCH.md § Pattern 1

**Drizzle client initialization** — server-only module:
```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

**Convention:** This file must never be imported from client components. Use `server-only` package as an import guard in Phase 2+.

---

### `src/lib/db/schema/index.ts` (model, CRUD)

**Source:** RESEARCH.md § Pattern 2

**Foundation schema** — Phase 1 creates a minimal `families` table stub to prove migration pipeline:
```typescript
import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Full relations (members, roles, ledger) deferred to Phase 2+
```

**Conventions to follow:**
- All monetary amounts in future tables: `integer` or `bigint` columns (never `float`/`double`)
- All family-scoped tables must include `family_id` for RLS policies (Phase 2+)
- Use `uuid` primary keys with `.defaultRandom()`
- Use `timestamp` with `.defaultNow()` for audit columns

---

### `src/lib/env.ts` (utility, request-response)

**Source:** RESEARCH.md § Pattern 1

**Environment validation with Zod** — fail fast on invalid config:
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

**Security rule:** Never prefix secrets with `NEXT_PUBLIC_`. Only `NEXT_PUBLIC_APP_URL` is safe for client bundle.

---

### `src/lib/logger.ts` (utility, request-response)

**Source:** RESEARCH.md § Standard Stack (Pino)

**Pino structured logger** — JSON output for Kubernetes:
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

---

### `src/app/layout.tsx` (component, request-response)

**Source:** RESEARCH.md § Recommended Project Structure

**Root layout** — must import globals.css for Tailwind v4, include SerwistProvider:
```typescript
import type { Metadata } from 'next'
import { SerwistProvider } from '@serwist/next/clients'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kreds',
  description: 'Christian stewardship and allowance management for families',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SerwistProvider>{children}</SerwistProvider>
      </body>
    </html>
  )
}
```

**Critical:** `globals.css` must be imported here for Tailwind CSS v4 automatic content detection to work.

---

### `src/app/page.tsx` (component, request-response)

**Source:** RESEARCH.md § Recommended Project Structure

**Home page** — Server Component, minimal landing or redirect:
```typescript
export default function HomePage() {
  return (
    <main>
      <h1>Kreds</h1>
      <p>Christian stewardship and allowance management for families.</p>
    </main>
  )
}
```

---

### `src/app/api/health/route.ts` (route handler, request-response)

**Source:** RESEARCH.md § Open Questions (Q4) + Validation Architecture

**Health check endpoint** — Phase 1 returns 200 OK with app version. Database connectivity check deferred to Phase 2:
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

---

### `src/app/globals.css` (config)

**Source:** RESEARCH.md § Pitfall 1 (Tailwind v4 content detection)

**Tailwind CSS v4 entry** — must use `@import "tailwindcss"`:
```css
@import "tailwindcss";
```

**Critical:** Tailwind v4 uses automatic content detection. Do NOT use `@tailwind base/components/utilities` (that's v3 syntax).

---

### `src/middleware.ts` (middleware, request-response)

**Source:** RESEARCH.md § Recommended Project Structure

**Next.js middleware** — Phase 1 is a placeholder for auth (ZITADEL OIDC integration in Phase 2):
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth placeholder — ZITADEL OIDC integration in Phase 2
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

### `src/modules/glossary/terms.ts` (utility)

**Source:** RESEARCH.md § Canonical Terminology Glossary (FND-05)

**Domain terminology constants** — single source of truth for Kreds domain terms:
```typescript
export const TERMS = {
  KREDS: 'Kreds',
  FIRSTFRUITS: 'Firstfruits',
  FIRSTFRUITS_TREASURY: 'Firstfruits Treasury',
  KREDS_DO_BEM: 'Kreds do Bem',
  DONATION_MATCH: 'Donation Match',
  TASK_TEMPLATE: 'Task Template',
  TASK_COMPLETION: 'Task Completion',
  WEEKLY_CYCLE: 'Weekly Cycle',
  WEEKLY_GRATITUDE_REPORT: 'Weekly Gratitude Report',
  WISHLIST_GOAL: 'Wishlist Goal',
  GUARDIAN: 'Guardian',
  CHILD: 'Child',
  FAMILY: 'Family',
  KREDS_ENGINE: 'Kreds Engine',
  NEGATIVE_ADJUSTMENT: 'Negative Adjustment',
  LEDGER_TRANSACTION: 'Ledger Transaction',
  SEVENTY_TWO_HOUR_RULE: '72-Hour Rule',
} as const

export type TermKey = keyof typeof TERMS
```

---

### `drizzle.config.ts` (config)

**Source:** RESEARCH.md § Code Examples — Drizzle Kit Configuration

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

### `Dockerfile` (config)

**Source:** RESEARCH.md § Pattern 3 (Official Next.js Standalone Docker Build)

**Three-stage multi-stage build** — dependencies → build → runner:
```dockerfile
ARG NODE_VERSION=24.13.0-slim
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN corepack enable pnpm && pnpm build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

**Critical rules:**
- Must copy `public/` and `.next/static/` separately (standalone output does not include them)
- Must use `USER node` (non-root for Kubernetes security)
- Must set `HOSTNAME="0.0.0.0"` (Kubernetes readiness probes)

---

### `docker-compose.yml` (config)

**Source:** RESEARCH.md § Code Examples — Docker Compose

**Local PostgreSQL service** — for development only:
```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: kreds
      POSTGRES_PASSWORD: kreds_dev
      POSTGRES_DB: kreds_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kreds"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

### `vitest.config.ts` (config, test)

**Source:** RESEARCH.md § Code Examples — Vitest Configuration

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

---

### `playwright.config.ts` (config, test)

**Source:** RESEARCH.md § Validation Architecture

**Playwright E2E configuration** — target local dev server:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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

---

### `tests/setup.ts` (test)

**Source:** RESEARCH.md § Validation Architecture

**Shared test setup** — env validation, cleanup hooks:
```typescript
// Shared setup for Vitest
import '@testing-library/jest-dom/vitest'

// Ensure test environment variables are set
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.NODE_ENV = 'test'
```

---

### `tests/integration/db-connection.test.ts` (test, CRUD)

**Source:** RESEARCH.md § Validation Architecture (FND-01 PostgreSQL connection)

**Testcontainers PostgreSQL integration test** — verifies real PostgreSQL connectivity:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

describe('PostgreSQL Connection', () => {
  let container: any
  let db: any

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine').start()
    const pool = new Pool({ connectionString: container.getConnectionUri() })
    db = drizzle(pool)
  })

  afterAll(async () => {
    await container.stop()
  })

  it('should connect and execute a query', async () => {
    const result = await db.execute('SELECT 1 as value')
    expect(result.rows[0].value).toBe(1)
  })
})
```

**Note:** Requires Docker daemon running. Document as prerequisite.

---

### `tests/e2e/health.spec.ts` (test, request-response)

**Source:** RESEARCH.md § Validation Architecture (FND-01 smoke test)

**Playwright health check E2E** — verifies app serves requests:
```typescript
import { test, expect } from '@playwright/test'

test('health endpoint returns 200', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe('ok')
})
```

---

### `.env.example` (config)

**Source:** RESEARCH.md § Code Examples — Environment Variable Template

```env
DATABASE_URL=postgresql://kreds:kreds_dev@localhost:5432/kreds_dev
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ZITADEL_ISSUER=https://auth.hasslab.pro
```

---

### `docs/PRIVACY-INVENTORY.md` (documentation)

**Source:** RESEARCH.md § Child Privacy Data Inventory (FND-04)

**Structure** (from RESEARCH.md):
1. Data categories table (child display name, role, avatar, task completions, earnings, wishlist, gratitude)
2. COPPA compliance checklist
3. Parental consent flow description
4. Data retention and deletion policy
5. Third-party data sharing policy (none in v1)
6. Contact information for privacy inquiries

**What Phase 1 should NOT collect:** No child profile data, no child authentication, no personal identifiers beyond display name, no location data, no behavioral tracking.

---

### `docs/GLOSSARY.md` (documentation)

**Source:** RESEARCH.md § Canonical Terminology Glossary (FND-05)

**Content:** Use all terms from RESEARCH.md § Domain Terms table (Kreds, Firstfruits, Firstfruits Treasury, Kreds do Bem, Donation Match, Task Template, Task Completion, 72-Hour Rule, Weekly Cycle, Weekly Gratitude Report, Wishlist Goal, Guardian, Child, Family, Kreds Engine, Negative Adjustment, Ledger Transaction).

---

## Shared Patterns

### Server-Only Module Boundary
**Apply to:** `src/lib/db/index.ts`, `src/lib/db/schema/index.ts`, all future domain modules
**Pattern:** Use `server-only` npm package as an import guard to prevent client-side bundling of server logic:
```typescript
import 'server-only'
// ... server-only code follows
```

### Environment Validation (Fail Fast)
**Apply to:** All files that read `process.env`
**Source:** `src/lib/env.ts`
**Pattern:** Use Zod schema to validate environment at startup. Never access `process.env` directly in business logic — always go through the validated `env` export.

### Kreds Amount Storage
**Apply to:** All future database schema files
**Rule:** Store all Kreds amounts as `integer` or `bigint` columns. Never use `float`, `double`, or `decimal` for currency values. This is a non-negotiable financial integrity requirement.

### Family Data Isolation
**Apply to:** All future database schema files
**Rule:** Every family-scoped table must include a `family_id` foreign key. Row-Level Security policies (Phase 2+) will enforce this at the database level.

### Tailwind CSS v4 Import
**Apply to:** `src/app/globals.css`
**Rule:** Use `@import "tailwindcss"` (v4 syntax). Do NOT use `@tailwind base/components/utilities` (v3 syntax).

### Docker Non-Root User
**Apply to:** `Dockerfile`
**Rule:** Always use `USER node` in the runner stage. Kubernetes security best practice.

## No Analog Found

All files in this phase have no internal analog — this is a greenfield project. Patterns are sourced from:

| File Category | Pattern Source |
|---------------|----------------|
| Next.js config, app shell, layout | Official Next.js 16 App Router documentation |
| Drizzle ORM schema, migrations | Official Drizzle ORM PostgreSQL documentation |
| Docker multi-stage build | Official Next.js Docker example (`vercel/next.js/examples/with-docker`) |
| Test infrastructure (Vitest, Playwright, Testcontainers) | Official documentation for each framework |
| Pino logger | Official Pino documentation |
| Serwist PWA | Official Serwist Next.js documentation |
| Tailwind CSS v4 | Official Tailwind CSS v4 release notes |
| Privacy inventory | COPPA official guidance (coppa.org) |

## Metadata

**Analog search scope:** N/A — greenfield project, no application code exists
**Files scanned:** 0 (no source files to scan)
**Pattern extraction date:** 2026-06-06
**Pattern sources:** RESEARCH.md code examples, official documentation for Next.js 16, Drizzle ORM, Docker, Vitest, Playwright, Testcontainers, Pino, Serwist, Tailwind CSS v4, COPPA
