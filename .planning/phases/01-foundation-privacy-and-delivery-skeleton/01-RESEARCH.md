# Phase 1: Foundation, Privacy, and Delivery Skeleton - Research

**Researched:** 2026-06-06
**Domain:** Next.js 16 + TypeScript + PostgreSQL + Docker/Kubernetes bootstrap
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield bootstrap phase for the Kreds project. No application code exists yet — only planning artifacts (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STACK.md) and design assets (Stitch UI direction files). The phase must establish: (1) a working Next.js 16 TypeScript PWA shell backed by PostgreSQL, (2) database migration tooling with Drizzle ORM, (3) Docker multi-stage build producing a Kubernetes-ready image, (4) a child-privacy data inventory document, and (5) a canonical terminology glossary for the domain.

The stack is already decided by prior research: Node.js/TypeScript, Next.js 16 with App Router, PostgreSQL 18 with Drizzle ORM, pnpm as package manager, Tailwind CSS 4, Serwist for PWA, Vitest + Testcontainers + Playwright for testing, and Pino for structured logging. This research focuses on the practical implementation patterns for each.

**Primary recommendation:** Use `create-next-app` with TypeScript + App Router + src directory, then layer Drizzle ORM schema/migrations, Docker standalone build, test infrastructure, and privacy documentation in parallel waves.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Next.js App Router shell | Frontend Server (SSR) | — | Next.js handles both SSR and client rendering; App Router is the entry point |
| PostgreSQL schema + migrations | Database / Storage | API / Backend | Drizzle ORM defines schema; migrations run against Postgres directly |
| Docker build + K8s delivery | CDN / Static (container) | API / Backend | Multi-stage Dockerfile produces a container image for K8s deployment |
| Child privacy inventory | Documentation | — | Non-code artifact; requires legal/product analysis |
| Terminology glossary | Documentation | — | Non-code artifact; domain terminology definition |
| Test infrastructure (Vitest + Testcontainers + Playwright) | Database / Storage | API / Backend | Testcontainers spins up Postgres; Vitest runs unit/domain tests; Playwright runs E2E |
| Environment configuration | Frontend Server (SSR) | — | Next.js `.env` loading, DATABASE_URL, ZITADEL config placeholders |

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. The following constraints come from PROJECT.md, AGENTS.md, and STACK.md:

### Locked Decisions
- **Node.js/TypeScript** over Go for v1 backend (STACK.md executive recommendation)
- **PostgreSQL** as the database (required by PRD)
- **Drizzle ORM** for typed SQL and migrations (STACK.md recommendation)
- **ZITADEL OIDC** at `https://auth.hasslab.pro` for authentication (project decision)
- **Family data isolation by `family_id`** is a core architectural requirement
- **Kreds amounts stored as integers**, never floats
- **Append-only ledger tables** for audit trail
- **Kubernetes + ArgoCD + Docker + Harbor** as target deployment platform

### the agent's Discretion
- Exact project directory structure within Next.js conventions
- Whether to use pnpm workspaces now or defer until worker package is needed
- Which foundation tables to create in Phase 1 vs. Phase 2
- Privacy inventory format and scope
- Glossary format and content

### Deferred Ideas (OUT OF SCOPE)
- Go backend (deferred to later if ever needed)
- Microservices architecture (deferred to later)
- Real payment integrations (v2+)
- Push notifications (v2+)
- AI-generated Bible teaching (explicitly out of scope)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Developer can run a Next.js TypeScript PWA shell locally with a PostgreSQL-backed configuration. | Next.js 16 App Router + Drizzle ORM + PostgreSQL setup patterns documented below |
| FND-02 | Developer can run database migrations and automated tests from documented commands. | Drizzle Kit migration commands + Vitest/Testcontainers/Playwright setup patterns documented below |
| FND-03 | Developer can build and package the app with Docker for the target Kubernetes delivery path. | Official Next.js standalone Docker multi-stage build pattern documented below |
| FND-04 | Maintainer can review a child-privacy data inventory before any child profile data is collected. | COPPA requirements and privacy inventory structure documented below |
| FND-05 | Maintainer can use a canonical terminology glossary for Kreds, firstfruits, giving, tasks, and weekly reports. | Glossary structure and domain terms documented below |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **next** | 16.2.7 [VERIFIED: npm registry] | Full-stack React framework | App Router, Server Components, Route Handlers, Server Actions, standalone output for Docker |
| **react** | 19.2.7 [VERIFIED: npm registry] | UI runtime | Standard pairing with Next.js 16 |
| **typescript** | 6.0.3 [VERIFIED: npm registry] | Type system | Single type system across UI, API, domain, tests |
| **drizzle-orm** | 0.45.2 [VERIFIED: npm registry] | Typed SQL ORM | Lightweight, explicit SQL, transactions, PostgreSQL-first |
| **drizzle-kit** | 0.31.10 [VERIFIED: npm registry] | Migration generator | Generates SQL migrations from Drizzle schema definitions |
| **pg** | 8.21.0 [VERIFIED: npm registry] | PostgreSQL driver | Standard node-postgres driver; Drizzle sits on top |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | 4.4.3 [VERIFIED: npm registry] | Runtime validation | Forms, server actions, route handlers, test fixtures |
| **pino** | 10.3.1 [VERIFIED: npm registry] | Structured logging | JSON logging for Kubernetes/OpenTelemetry pipelines |
| **@serwist/next** | 9.5.11 [VERIFIED: npm registry] | PWA service worker | Next.js-compatible service worker, manifest, offline support |
| **tailwindcss** | 4.3.0 [VERIFIED: npm registry] | Styling | CSS-first config, automatic content detection, v4 architecture |
| **vitest** | 4.1.8 [VERIFIED: npm registry] | Unit/domain tests | Fast tests for domain logic, weekly cycle rules, ledger invariants |
| **playwright** | 1.60.0 [VERIFIED: npm registry] | E2E tests | Browser-level E2E for onboarding, role-gated navigation |
| **@testcontainers/postgresql** | 12.0.1 [VERIFIED: npm registry] | Integration test Postgres | Real PostgreSQL containers for RLS/transaction tests |
| **pg-boss** | 12.18.2 [VERIFIED: npm registry] | Postgres-backed jobs | Weekly cycle close, gratitude report jobs (deferred setup, install now) |
| **lucide-react** | Current [VERIFIED: npm registry] | Icons | Consistent icon set for tasks, giving, savings, reports |
| **react-hook-form** | 7.77.0 [VERIFIED: npm registry] | Form state | Parent setup, task completion, wishlist forms |
| **@testing-library/react** | 16.3.2 [VERIFIED: npm registry] | Component tests | UI behavior tests that don't need full E2E |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma is heavier; Drizzle gives explicit SQL control needed for ledger work |
| Serwist | next-pwa | next-pwa is less maintained for modern Next.js App Router; Serwist is the current recommendation |
| Vitest | Jest | Vitest is faster, native ESM, better TS support; Jest has larger ecosystem but slower |

**Installation:**
```bash
# Bootstrap Next.js
pnpm create next-app@latest kreds --ts --eslint --app --src-dir --import-alias "@/*"

# Core domain and data
pnpm add drizzle-orm pg zod pino pg-boss
pnpm add -D drizzle-kit typescript @types/pg

# UI and PWA
pnpm add react-hook-form @hookform/resolvers lucide-react @serwist/next
pnpm add -D serwist tailwindcss @tailwindcss/postcss

# Testing
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom vite-tsconfig-paths playwright @testcontainers/postgresql testcontainers
```

**Version verification:** All versions confirmed via `npm view` on 2026-06-06.

## Package Legitimacy Audit

> slopcheck was not available at research time. All packages are tagged `[ASSUMED]` — the planner must gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| next | npm | 10+ yrs | 8M+/wk | github.com/vercel/next.js | [ASSUMED] | Flagged — planner must add checkpoint |
| react | npm | 10+ yrs | 10M+/wk | github.com/facebook/react | [ASSUMED] | Flagged — planner must add checkpoint |
| typescript | npm | 10+ yrs | 15M+/wk | github.com/microsoft/TypeScript | [ASSUMED] | Flagged — planner must add checkpoint |
| drizzle-orm | npm | 3+ yrs | 500K+/wk | github.com/drizzle-team/drizzle-orm | [ASSUMED] | Flagged — planner must add checkpoint |
| drizzle-kit | npm | 3+ yrs | 400K+/wk | github.com/drizzle-team/drizzle-kit | [ASSUMED] | Flagged — planner must add checkpoint |
| pg | npm | 10+ yrs | 2M+/wk | github.com/brianc/node-postgres | [ASSUMED] | Flagged — planner must add checkpoint |
| zod | npm | 4+ yrs | 10M+/wk | github.com/colinhacks/zod | [ASSUMED] | Flagged — planner must add checkpoint |
| pino | npm | 8+ yrs | 5M+/wk | github.com/pinojs/pino | [ASSUMED] | Flagged — planner must add checkpoint |
| @serwist/next | npm | 2+ yrs | 5K+/wk | github.com/serwist/serwist | [ASSUMED] | Flagged — planner must add checkpoint |
| tailwindcss | npm | 6+ yrs | 5M+/wk | github.com/tailwindlabs/tailwindcss | [ASSUMED] | Flagged — planner must add checkpoint |
| vitest | npm | 3+ yrs | 3M+/wk | github.com/vitest-dev/vitest | [ASSUMED] | Flagged — planner must add checkpoint |
| playwright | npm | 5+ yrs | 3M+/wk | github.com/microsoft/playwright | [ASSUMED] | Flagged — planner must add checkpoint |
| @testcontainers/postgresql | npm | 5+ yrs | 100K+/wk | github.com/testcontainers/testcontainers-node | [ASSUMED] | Flagged — planner must add checkpoint |
| pg-boss | npm | 8+ yrs | 50K+/wk | github.com/timgit/pg-boss | [ASSUMED] | Flagged — planner must add checkpoint |
| react-hook-form | npm | 5+ yrs | 3M+/wk | github.com/react-hook-form/react-hook-form | [ASSUMED] | Flagged — planner must add checkpoint |
| lucide-react | npm | 3+ yrs | 3M+/wk | github.com/lucide-icons/lucide | [ASSUMED] | Flagged — planner must add checkpoint |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (slopcheck unavailable — all flagged for human verification)

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (PWA)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  UI Pages│  │  Forms   │  │  Service Worker (Serwist)│  │
│  │  (RSC)   │  │  (RHF)   │  │  - Shell caching         │  │
│  └────┬─────┘  └────┬─────┘  │  - Manifest              │  │
│       │              │        └──────────────────────────┘  │
│       ▼              ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Next.js App Router                         │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │Server Compts│  │Route Handlers│  │Server Acts │  │   │
│  │  │  (read)     │  │  (API)       │  │(mutations) │  │   │
│  │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  └─────────┼────────────────┼────────────────┼─────────┘   │
└────────────┼────────────────┼────────────────┼─────────────┘
             │                │                │
             ▼                ▼                ▼
┌────────────────────────────────────────────────────────────┐
│                    Server-Only Domain Layer                │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ Drizzle DB │  │ Zod Schemas│  │ Pino Logger        │   │
│  │ Client     │  │ Validation │  │ (JSON structured)  │   │
│  └─────┬──────┘  └────────────┘  └────────────────────┘   │
│        │                                                   │
│        ▼                                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Drizzle Schema (families, members, roles - Phase 2+)│  │
│  │  + Drizzle Kit migrations                           │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│                    PostgreSQL 18                           │
│  - RLS policies (family_id isolation)                      │
│  - Append-only ledger tables (Phase 3+)                    │
│  - Integer minor units for Kreds amounts                   │
└────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
kreds/
├── .planning/                    # GSD planning artifacts
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (SerwistProvider, fonts, metadata)
│   │   ├── page.tsx              # Home page (landing or redirect)
│   │   ├── globals.css           # Tailwind CSS entry
│   │   └── api/                  # Route handlers (API endpoints)
│   │       └── health/           # Health check endpoint
│   │           └── route.ts
│   ├── components/               # UI components
│   │   └── ui/                   # shadcn/ui base components (future)
│   ├── lib/
│   │   ├── db/                   # Database layer
│   │   │   ├── index.ts          # Drizzle client initialization
│   │   │   └── schema/           # Drizzle schema definitions
│   │   │       └── index.ts      # Schema exports
│   │   ├── logger.ts             # Pino logger configuration
│   │   └── env.ts                # Environment variable validation (Zod)
│   ├── modules/                  # Domain modules (server-only)
│   │   └── glossary/             # Canonical terminology (FND-05)
│   │       └── terms.ts
│   └── middleware.ts             # Next.js middleware (auth placeholder)
├── drizzle/                      # Drizzle migrations output
│   └── meta/
├── public/                       # Static assets
│   ├── manifest.webmanifest      # PWA manifest
│   └── icons/                    # PWA icons
├── tests/
│   ├── unit/                     # Vitest unit tests
│   │   └── glossary.test.ts
│   ├── integration/              # Testcontainers integration tests
│   │   └── db-connection.test.ts
│   └── e2e/                      # Playwright E2E tests
│       └── health.spec.ts
├── docs/
│   ├── PRIVACY-INVENTORY.md      # Child privacy data inventory (FND-04)
│   └── GLOSSARY.md               # Canonical terminology (FND-05)
├── drizzle.config.ts             # Drizzle Kit configuration
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── next.config.ts                # Next.js config (standalone output, Serwist)
├── tsconfig.json
├── postcss.config.mjs            # PostCSS config (Tailwind v4)
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Local dev: PostgreSQL + app
├── .env.example                  # Environment variable template
├── .env.local                    # Local development (gitignored)
├── package.json
└── pnpm-lock.yaml
```

### Pattern 1: Next.js App Router with Server-Only Domain Modules
**What:** Separate server-only domain logic from React components using `"use server"` directive and `server-only` npm package import guards.
**When to use:** All domain logic (ledger rules, weekly cycles, role checks) must never ship to the client bundle.
**Example:**
```typescript
// src/lib/db/index.ts — Server-only Drizzle client
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

```typescript
// src/lib/env.ts — Environment validation with Zod
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
```

### Pattern 2: Drizzle ORM Schema with PostgreSQL Relations
**What:** Define typed PostgreSQL tables with Drizzle's `pgTable`, foreign keys, and `relations` API.
**When to use:** All database schema definitions for families, members, roles, and future ledger tables.
**Example:**
```typescript
// src/lib/db/schema/index.ts
import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const families = pgTable('families', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  zitadelId: text('zitadel_id').notNull().unique(),
  role: varchar('role', { length: 20 }).notNull(), // 'guardian' | 'child'
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(members),
}))

export const membersRelations = relations(members, ({ one }) => ({
  family: one(families, { fields: [members.familyId], references: [families.id] }),
}))
```

### Pattern 3: Official Next.js Standalone Docker Build
**What:** Three-stage Dockerfile (dependencies → build → runner) using Next.js `output: 'standalone'` for minimal production image.
**When to use:** All production Docker builds targeting Kubernetes.
**Example:**
```dockerfile
# Stage 1: Dependencies
ARG NODE_VERSION=24.13.0-slim
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN corepack enable pnpm && pnpm build

# Stage 3: Runner
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

### Anti-Patterns to Avoid
- **Putting domain logic in React components:** Ledger rules, weekly cycle calculations, and role checks must be in server-only modules. Use `server-only` package as an import guard.
- **Using `output: 'standalone'` without copying static assets:** The standalone output does not include `public/` or `.next/static/` — these must be copied manually in the Dockerfile.
- **Floating-point amounts for Kreds:** Store all monetary values as integers (minor units). Use `integer` or `bigint` columns in PostgreSQL.
- **Skipping RLS because app code checks authorization:** RLS is defense-in-depth. App checks can be bypassed; RLS cannot.
- **Running PostgreSQL inside the app cluster casually:** Use managed PostgreSQL or a deliberately operated Postgres platform. The Dockerfile/docker-compose is for development only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database migrations | Custom SQL migration scripts | Drizzle Kit | Type-safe schema diffing, snapshot tracking, rollback support |
| Environment validation | Manual `process.env` checks | Zod schema validation | Single source of truth, type inference, early failure |
| PWA service worker | Manual Workbox configuration | Serwist (`@serwist/next`) | Next.js integration, automatic precaching, revision management |
| Structured logging | `console.log` | Pino | Fast JSON logging, Kubernetes-compatible, child object support |
| Test database | Mock database or SQLite for PG tests | Testcontainers PostgreSQL | Real PostgreSQL behavior, RLS policies, transaction semantics |
| Docker image for Next.js | Single-stage `npm install && npm run build` | Multi-stage standalone build | 90%+ smaller image, no dev dependencies, non-root user |
| Form state management | Manual `useState` for forms | React Hook Form + Zod resolver | Performance, validation integration, accessibility |

**Key insight:** Each of these problems has well-tested solutions with edge cases that are expensive to discover through custom implementation. For a family finance product where trust matters, using established patterns reduces the risk of subtle bugs.

## Common Pitfalls

### Pitfall 1: Next.js 16 + Tailwind CSS 4 Content Detection
**What goes wrong:** Tailwind CSS v4 uses automatic content detection, but if the project structure doesn't match what Tailwind expects, classes are purged.
**Why it happens:** Tailwind v4 changed from explicit `content` config to automatic detection based on CSS file imports.
**How to avoid:** Use `@import "tailwindcss"` in `globals.css` and ensure the CSS file is imported from the root layout. Verify with `@tailwindcss/postcss` in PostCSS config.
**Warning signs:** UI renders without any Tailwind styles; build succeeds but classes are missing.

### Pitfall 2: Drizzle Kit Migration Generation Without Database Connection
**What goes wrong:** `drizzle-kit generate` fails or generates incorrect migrations when `DATABASE_URL` is not set or points to a non-existent database.
**Why it happens:** Drizzle Kit needs to read the current database state to generate diffs.
**How to avoid:** Use `docker-compose up -d` to start a local PostgreSQL before running migrations. Set `DATABASE_URL` in `.env.local`.
**Warning signs:** `drizzle-kit generate` errors with connection refused or generates empty migrations.

### Pitfall 3: Next.js Standalone Output Missing Dependencies
**What goes wrong:** The standalone build omits native dependencies (like `pg`'s native bindings) or files referenced at runtime.
**Why it happens:** Next.js traces only files that are statically importable; dynamic requires are missed.
**How to avoid:** Use `outputFileTracingIncludes` in `next.config.ts` for any dynamically loaded files. Test the standalone build locally before Dockerizing.
**Warning signs:** `MODULE_NOT_FOUND` errors when running `node server.js` from the standalone directory.

### Pitfall 4: Testcontainers Requires Docker Daemon
**What goes wrong:** Integration tests fail because Docker is not running or the user lacks permissions.
**Why it happens:** Testcontainers spins up real PostgreSQL containers; it requires a running Docker daemon.
**How to avoid:** Document Docker as a prerequisite for running integration tests. Provide a skip mechanism via `TESTCONTAINERS_HOST_OVERRIDE` for CI environments.
**Warning signs:** `Connection refused` or `Docker not found` errors when running `pnpm test`.

### Pitfall 5: pnpm + Next.js with `node_modules` Resolution
**What goes wrong:** Next.js build fails because pnpm's strict dependency resolution hides transitive dependencies that Next.js expects.
**Why it happens:** pnpm does not hoist all dependencies to the root `node_modules`; only declared dependencies are accessible.
**How to avoid:** Use `public-hoist-pattern[]` in `.npmrc` for Next.js-related packages if needed. Or ensure all required packages are explicitly declared in `package.json`.
**Warning signs:** `Cannot find module` errors during `next build` that don't occur with npm or yarn.

## Code Examples

### Drizzle Kit Configuration
```typescript
// drizzle.config.ts
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

### Vitest Configuration for Next.js
```typescript
// vitest.config.ts
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

### Docker Compose for Local Development
```yaml
# docker-compose.yml
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

### Environment Variable Template
```env
# .env.example
DATABASE_URL=postgresql://kreds:kreds_dev@localhost:5432/kreds_dev
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ZITADEL_ISSUER=https://auth.hasslab.pro
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pages/` directory routing | App Router (`app/`) with Server Components | Next.js 13.4+ (stable in 14) | Server-side rendering by default, nested layouts, streaming |
| `next-pwa` for PWA | Serwist (`@serwist/next`) | 2024-2025 | Better Next.js App Router compatibility, active maintenance |
| `next.config.js` (CommonJS) | `next.config.ts` (TypeScript) | Next.js 15+ | Type-safe configuration, better IDE support |
| Prisma as default ORM | Drizzle ORM for explicit SQL | 2023-2025 | Lighter abstraction, better for ledger/RLS/transaction work |
| Jest for testing | Vitest for unit tests | 2022-2025 | Faster, native ESM, better TypeScript support |
| Manual Docker builds | Next.js `output: 'standalone'` + multi-stage | Next.js 12+ | 90%+ smaller images, no node_modules in production |

**Deprecated/outdated:**
- **`next-pwa`**: Historically common but less compelling for modern Next.js App Router/Turbopack-era work. Use Serwist instead.
- **`pages/` API routes**: Route Handlers in `app/api/` are the current standard.
- **`getServerSideProps` / `getStaticProps`**: Server Components and Route Handlers replace these in App Router.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Node.js 24 LTS is the recommended runtime version | Standard Stack | Medium — Node 22 LTS is also acceptable; planner should allow both |
| A2 | Serwist works with Next.js 16 without compatibility issues | Standard Stack | Medium — Serwist docs show Next.js setup but v16-specific compatibility not verified |
| A3 | Tailwind CSS 4 automatic content detection works with `src/` directory structure | Common Pitfalls | Low — v4 docs confirm CSS-first config; may need manual content config if detection fails |
| A4 | Drizzle Kit 0.31.x supports PostgreSQL 18 | Standard Stack | Low — Drizzle supports PostgreSQL broadly; version-specific issues unlikely |
| A5 | Testcontainers Node works with Docker Desktop on macOS | Common Pitfalls | Low — Well-documented; macOS support is standard |

## Open Questions (RESOLVED)

1. **Should pnpm workspaces be set up in Phase 1 or deferred?**
   - What we know: STACK.md recommends pnpm for "better monorepo ergonomics if app/worker packages split later."
   - What's unclear: Whether the worker package (pg-boss) is needed in Phase 1 or can be deferred.
   - RESOLVED: Start as a single package. Add pnpm workspace structure when the worker package is created (Phase 4+). This avoids unnecessary complexity in Phase 1.

2. **Which foundation database tables should Phase 1 create?**
   - What we know: Phase 2 needs `families`, `members`, `roles` tables. Phase 3 needs ledger tables.
   - What's unclear: Whether Phase 1 should pre-create the schema structure or leave it for Phase 2.
   - RESOLVED: Phase 1 should establish the Drizzle ORM configuration, migration tooling, and a minimal `families` table schema stub. The full schema with relations belongs in Phase 2. This proves the migration pipeline works without building Phase 2's features.

3. **What PostgreSQL instance should developers use for local development?**
   - What we know: docker-compose.yml can spin up PostgreSQL 18. Testcontainers can do the same for tests.
   - What's unclear: Whether developers should also be able to use a system-installed PostgreSQL.
   - RESOLVED: Document docker-compose as the primary method. Allow system PostgreSQL as an alternative with documented `DATABASE_URL` format.

4. **Should the health check endpoint return database connectivity status?**
   - What we know: FND-01 requires "PostgreSQL-backed configuration."
   - What's unclear: Whether the health endpoint should verify database connectivity or just return 200 OK.
   - RESOLVED: Phase 1 health endpoint returns 200 OK with app version. Database connectivity check can be added in Phase 2 when actual database operations exist.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v22.14.0 (local) | Install via nvm or brew; requires >= 22 LTS |
| pnpm | Package manager | ✓ | 10.x (install via corepack) | npm or yarn (but lockfile changes) |
| Docker | Local PostgreSQL, Docker build | ✓ | Available (Docker Desktop) | System PostgreSQL for dev; no fallback for Docker build |
| PostgreSQL | Database | ✗ (via Docker) | 18 (via docker-compose) | System-installed PostgreSQL if available |
| TypeScript | Language | ✓ | 6.0.3 (via npm) | — |

**Missing dependencies with no fallback:**
- None identified. Docker is available locally; PostgreSQL runs via docker-compose.

**Missing dependencies with fallback:**
- PostgreSQL: If Docker is unavailable, developers can use a system-installed PostgreSQL 17+ with `DATABASE_URL` pointing to it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + Testcontainers 12.0.1 + Playwright 1.60.0 |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `pnpm vitest run --reporter=dot` |
| Full suite command | `pnpm vitest run && pnpm playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | Next.js app starts and serves requests | E2E / smoke | `pnpm playwright test tests/e2e/health.spec.ts` | ❌ Wave 0 |
| FND-01 | PostgreSQL connection works | Integration | `pnpm vitest run tests/integration/db-connection.test.ts` | ❌ Wave 0 |
| FND-02 | Drizzle migrations run successfully | Integration | `pnpm drizzle-kit migrate` + verify tables | ❌ Wave 0 |
| FND-02 | Vitest tests pass | Unit | `pnpm vitest run` | ❌ Wave 0 |
| FND-03 | Docker build succeeds | Build | `docker build -t kreds:test .` | ❌ Wave 0 |
| FND-03 | Docker container starts and responds | E2E | `docker run --rm -p 3000:3000 kreds:test && curl http://localhost:3000` | ❌ Wave 0 |
| FND-04 | Privacy inventory document exists | Manual | `test -f docs/PRIVACY-INVENTORY.md` | ❌ Wave 0 |
| FND-05 | Glossary document exists | Manual | `test -f docs/GLOSSARY.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=dot`
- **Per wave merge:** `pnpm vitest run && pnpm playwright test`
- **Phase gate:** Docker build green + migrations apply + all tests pass before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration for Next.js
- [ ] `playwright.config.ts` — Playwright E2E configuration
- [ ] `tests/setup.ts` — Shared test setup (env validation, cleanup)
- [ ] `tests/integration/db-connection.test.ts` — PostgreSQL connectivity test with Testcontainers
- [ ] `tests/e2e/health.spec.ts` — Health check E2E test
- [ ] `docker-compose.yml` — Local PostgreSQL service
- [ ] Framework install: `pnpm add -D vitest playwright @testcontainers/postgresql` — none detected (greenfield)

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 2) | ZITADEL OIDC integration deferred |
| V3 Session Management | No (Phase 2) | Session handling deferred |
| V4 Access Control | No (Phase 2) | Role-based access deferred |
| V5 Input Validation | Yes | Zod schema validation for env vars, future forms |
| V6 Cryptography | No (Phase 1) | No cryptographic operations in Phase 1 |

### Known Threat Patterns for Next.js + PostgreSQL

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Environment variable leakage to client | Information Disclosure | Never prefix secrets with `NEXT_PUBLIC_`; use server-only env validation |
| SQL injection via raw queries | Tampering | Use Drizzle ORM parameterized queries; never concatenate SQL strings |
| Docker image with secrets | Information Disclosure | Multi-stage build; no `.env` files in image; use Kubernetes secrets |
| Non-root container execution | Elevation of Privilege | `USER node` in Dockerfile; no root execution |
| Unvalidated DATABASE_URL | Tampering | Zod schema validation at startup; fail fast on invalid config |

## Child Privacy Data Inventory (FND-04)

### COPPA Compliance Requirements

Kreds collects data about children under 13 (ages 6+). Under COPPA (Children's Online Privacy Protection Act), the following requirements apply [CITED: coppa.org/coppa]:

1. **Verifiable parental consent** before collecting any personal information from children
2. **Clear privacy policy** explaining data collection practices
3. **Data minimization** — cannot require children to disclose more information than necessary
4. **Data retention limits** — keep child data only as long as needed, then securely delete
5. **Parental rights** — parents can review, delete, and refuse further collection of child data

### Data Inventory Categories for Kreds

The following categories of child data will be collected in future phases. Phase 1 must document them before collection begins:

| Data Category | Collected In | Purpose | Legal Basis | Retention |
|---------------|-------------|---------|-------------|-----------|
| Child display name | Phase 2 (FAM-03) | Profile identification | Parental consent (parent creates profile) | Until family account deleted |
| Child role assignment | Phase 2 (FAM-04) | Authorization and UI gating | Parental consent | Until family account deleted |
| Child avatar/visual identifier | Phase 2 (FAM-06) | Profile customization | Parental consent | Until changed or account deleted |
| Task completion records | Phase 5 (ACT-04) | Earnings tracking | Parental consent (parent approves) | Retained for audit/history |
| Earnings and balance data | Phase 3 (LEDG-01) | Financial stewardship tracking | Parental consent | Retained for audit/history |
| Wishlist goals | Phase 6 (GOAL-01) | Savings goal tracking | Parental consent | Until goal completed or deleted |
| Gratitude reflections | Phase 8 (BIBL-04) | Weekly spiritual reflection | Parental consent | Retained in weekly report snapshots |

### What Phase 1 Should NOT Collect

- No child profile data
- No child authentication (children are profiles under parent-managed families)
- No personal identifiers beyond display name
- No location data
- No behavioral tracking or analytics on child users

### Recommended Privacy Inventory Document Structure

The `docs/PRIVACY-INVENTORY.md` should include:
1. Data categories table (as above)
2. COPPA compliance checklist
3. Parental consent flow description
4. Data retention and deletion policy
5. Third-party data sharing policy (none in v1)
6. Contact information for privacy inquiries

## Canonical Terminology Glossary (FND-05)

### Domain Terms

| Term | Definition | Context |
|------|------------|---------|
| **Kreds** | The internal currency unit used in the app. Stored as integer minor units (never floats). | All financial operations |
| **Firstfruits** | Mandatory 10% withholding from every positive earning, routed to the Firstfruits Treasury. Based on the biblical principle of giving the first portion to God (Malachi 3:10). | LEDG-04, automatic on all positive earnings |
| **Firstfruits Treasury** | The accumulated pool of firstfruits withholdings for a family. Not spendable by children; tracked separately from available balance. | Ledger accounting |
| **Kreds do Bem** | Internal family giving allocation. Not a real-money charitable payment. Represents the family's generosity practice. | GOAL-03 through GOAL-07 |
| **Donation Match** | Parent-funded 10% bonus posted when a voluntary giving allocation is approved. | GOAL-06 |
| **Task Template** | A recurring task definition with title, description, assigned child, Kreds value, and active period. | ACT-01 |
| **Task Completion** | A child's submission that they completed a specific task occurrence. Requires parent approval. | ACT-04 |
| **72-Hour Rule** | System blocks task completion submissions more than 72 hours after the occurrence date. Encourages integrity and discipline. | ACT-05 |
| **Weekly Cycle** | The activity period from Sunday through Saturday. Shapes task validation, reports, and phase decomposition. | ACT-02 |
| **Weekly Gratitude Report** | Immutable snapshot summarizing a family's weekly stewardship activity: tasks, earnings, firstfruits, wishlist progress, giving, and reflection prompts. | BIBL-04 through BIBL-06 |
| **Wishlist Goal** | A savings target created by a child with a target amount and progress indicator. | GOAL-01 |
| **Guardian** | A parent or guardian role in the Kreds domain model. Can create tasks, approve completions, manage family. | FAM-04 |
| **Child** | A child profile role in the Kreds domain model. Can complete tasks, create wishlist goals, allocate Kreds. Managed by guardians. | FAM-04 |
| **Family** | The core tenancy unit. All data is isolated by `family_id`. | FAM-01 |
| **Kreds Engine** | The financial engine that processes all Kreds movements: earnings, withholdings, adjustments, matches. | LEDG-01 through LEDG-08 |
| **Negative Adjustment** | A debit entry for misaligned behaviors, with a reason and optional restoration note. | LEDG-05 |
| **Ledger Transaction** | An append-only record of a Kreds movement. Cannot be edited; corrections use reversal or adjustment entries. | LEDG-01, LEDG-08 |

## Sources

### Primary (HIGH confidence)
- Context7: Next.js `/vercel/next.js` — App Router project structure, standalone output, Docker build, environment variables, Server Actions, Vitest testing. Last updated 2026-06-06.
- Context7: Drizzle ORM `/drizzle-team/drizzle-orm-docs` — PostgreSQL schema, relations, migrations, transactions. Last updated 2026-06-05.
- Context7: Serwist `/serwist/serwist` and `/websites/serwist_pages_dev` — Next.js setup, SerwistProvider, installation. Last updated 2026-05-20.
- Context7: Testcontainers `/testcontainers/testcontainers-node` — PostgreSQL module setup, connection patterns. Last updated 2026-05-22.
- PostgreSQL 18 official docs: `https://www.postgresql.org/docs/current/ddl-rowsecurity.html` — Row-Level Security policies, examples, permissive/restrictive policies.
- COPPA official guidance: `https://www.coppa.org/coppa/` — Children's Online Privacy Protection Act requirements, parental consent, data retention.
- pnpm official docs: `https://pnpm.io/workspaces` — Workspace configuration, workspace: protocol, monorepo patterns.
- npm registry: All package versions verified via `npm view` on 2026-06-06.

### Secondary (MEDIUM confidence)
- Harbor docs: `https://goharbor.io/docs/2.10.0/` — Container registry administration, project management.
- Next.js official Docker example: `github.com/vercel/next.js/canary/examples/with-docker/Dockerfile` — Three-stage multi-stage build pattern.

### Tertiary (LOW confidence)
- Serwist compatibility with Next.js 16 specifically — official docs show Next.js setup but v16-specific testing not verified.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All packages verified via npm registry and Context7 documentation
- Architecture: HIGH — Based on official Next.js, Drizzle ORM, and PostgreSQL documentation
- Pitfalls: MEDIUM — Based on documented patterns and known ecosystem issues; some verified with official sources
- Privacy/COPPA: MEDIUM — Based on coppa.org summary; legal review recommended before production
- Docker/K8s: HIGH — Based on official Next.js Docker example and standard multi-stage patterns

**Research date:** 2026-06-06
**Valid until:** 2026-07-06 (30 days — stable stack, but re-check package versions during bootstrap)
