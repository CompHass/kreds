# Technology Stack Research: Kreds

**Project:** Kreds — Christian stewardship and allowance management family PWA  
**Research dimension:** Stack  
**Researched:** 2026-06-04  
**Target ecosystem:** Standard 2025-era stack, current versions verified where possible in 2026  
**Overall confidence:** HIGH for core stack; MEDIUM for PWA/auth library choices because implementation details should be re-verified during setup.

## Executive Recommendation

Build Kreds as a **TypeScript-first Next.js full-stack PWA backed by PostgreSQL**. Use **Node.js/TypeScript**, not Go, for the application backend because Kreds is a domain-heavy family product with forms, role-gated UI, child/parent flows, scheduled reports, and an auditable ledger where correctness comes from PostgreSQL transactions, constraints, and append-only modeling—not from backend runtime language. A single TypeScript domain layer lets the team share validation schemas, role rules, date-cycle logic, and ledger command types across the PWA and API.

Recommended shape: **modular monolith first** using Next.js App Router, Route Handlers/Server Actions for product flows, PostgreSQL for data and ledger integrity, Drizzle ORM for typed SQL, ZITADEL OIDC for parent/guardian authentication, and a Postgres-backed worker for weekly cycle jobs. Keep the ledger code in a strict server-only module with transaction boundaries and database constraints. Do not split into microservices before the ledger, family isolation, and weekly cycle semantics are proven.

## Go vs Node.js Decision

**Recommendation: choose Node.js/TypeScript.**

| Criterion | Node.js/TypeScript | Go | Recommendation |
|-----------|--------------------|----|----------------|
| Next.js integration | Native ecosystem fit; Route Handlers, Server Actions, shared schemas | Separate API service and duplicated contracts | Node wins |
| Shared validation | Zod schemas can power forms, server commands, tests | Requires OpenAPI/protobuf/codegen discipline | Node wins |
| Product iteration speed | Faster for PWA, forms, auth, dashboards, reports | More boilerplate for common web product flows | Node wins |
| Ledger correctness | Determined by PostgreSQL constraints, transactions, idempotency, and append-only model | Same; Go does not automatically make ledger safer | Tie |
| Runtime performance | More than enough for family allowance workload | Better raw concurrency/latency profile | Go only matters later |
| Hiring/maintenance | One language across frontend/backend | Two-language stack | Node wins |
| Infrastructure | Runs cleanly in Docker/Kubernetes | Runs cleanly in Docker/Kubernetes | Tie |

**Use Go later only if:** Kreds grows into a high-throughput financial event processor, requires long-running compute-heavy workers, or needs a separately deployed ledger service with strict operational isolation. For v1, Go adds service boundaries and duplicated domain contracts before the product has validated workflows.

**Confidence:** HIGH. This is driven by the project context: PWA-first, family workflows, internal Kreds ledger rather than regulated money movement, and need for rapid product validation.

## Recommended Stack

Versions below reflect packages checked from npm on 2026-06-04. For a 2025 implementation baseline, these map to the same major-generation stack: React 19, Tailwind 4, Node 22/24 LTS, PostgreSQL 17/18, Drizzle 0.x, Playwright 1.x. Pin exact versions during project bootstrap.

### Core Application

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **Node.js** | **24 LTS** if starting now; **22 LTS** acceptable for 2025 baseline | Runtime | Official Node release policy says production apps should use Active/Maintenance LTS. Node 24 is LTS as of current research; Node 22 was the conservative 2025 LTS baseline. | HIGH |
| **TypeScript** | 6.0.x current; 5.8/5.9 acceptable 2025 baseline | Language | Single type system across UI, API, domain services, tests, and worker commands. | HIGH |
| **Next.js** | 16.x current; 15.x acceptable 2025 baseline | Full-stack React framework | App Router, Server Components, Route Handlers, Server Actions, metadata, and PWA-compatible deployment. Fits PRD requirement for React/Next.js web + mobile PWA. | HIGH |
| **React** | 19.x | UI runtime | Standard pairing with current Next.js. React 19 is the expected generation for new 2025+ Next apps. | HIGH |
| **pnpm** | 10.x | Package manager | Fast, deterministic installs; better monorepo ergonomics if app/worker packages split later. | MEDIUM |

### Frontend, PWA, and Design System

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **Tailwind CSS** | 4.x | Styling | Tailwind v4 shipped in Jan 2025 with faster builds, CSS-first configuration, automatic content detection, and modern CSS features. Strong fit for PWA dashboards and child-friendly UI. | HIGH |
| **shadcn/ui + Radix UI primitives** | Current registry packages | Component foundation | Gives accessible primitives while preserving design ownership. Use as source components, not as a heavy external design system. | MEDIUM |
| **Lucide React** | Current | Icons | Lightweight consistent icon set for tasks, giving, savings, reports, parent controls. | MEDIUM |
| **Serwist / @serwist/next** | 9.x current | Service worker / offline PWA support | Modern Next-compatible PWA tooling with documented service worker, manifest, offline fallback, and caching setup. Prefer over stale `next-pwa`. | MEDIUM-HIGH |
| **React Hook Form** | 7.x | Forms | Mature form state management for parent setup, task completion, wishlist/donation forms. | HIGH |
| **Zod** | 4.x current; 3.x acceptable only if ecosystem package forces it | Validation | Shared runtime validation for forms, server actions, route handlers, jobs, and test fixtures. | HIGH |
| **TanStack Query** | 5.x | Client server-state where needed | Use sparingly for client-side interactive dashboards/offline-adjacent state. Do not use for simple Server Component reads. | MEDIUM |

### Backend and Domain Layer

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **Next.js Route Handlers + Server Actions** | Next 15/16 generation | API and mutations | Keeps the app simple while product workflows are being validated. Server Actions fit form mutations; Route Handlers fit PWA/push/webhook-style endpoints. | HIGH |
| **Server-only domain modules** | Native TS modules | Business logic | Put Kreds Engine, weekly cycle rules, 72-hour backfill enforcement, and role checks outside React components. Import only from server routes/actions/workers. | HIGH |
| **Pino** | 10.x | Structured logging | Fast JSON logging suitable for Kubernetes and OpenTelemetry pipelines. | HIGH |
| **OpenTelemetry** | SDK 0.x / API 1.x ecosystem | Tracing/metrics | Add from the start for ledger command tracing and auditability; keep instrumentation minimal in v1. | MEDIUM |
| **pg-boss** | 12.x | Postgres-backed jobs | Good fit for weekly gratitude reports and cycle close jobs without adding Redis. Use idempotent job keys. | MEDIUM |

### Database and Financial Integrity

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **PostgreSQL** | **18.x** current; **17.x** acceptable 2025 baseline | Primary database | Required by PRD. Relational constraints, transactions, indexes, foreign keys, and RLS make it the right foundation for auditable family/ledger data. PostgreSQL supports major versions for 5 years. | HIGH |
| **Drizzle ORM** | 0.45.x current | Typed SQL and migrations | Lightweight typed SQL, explicit schema, transactions, and easy escape hatch to raw SQL. Better fit for ledger correctness than opaque ORM abstractions. | HIGH |
| **node-postgres (`pg`)** | 8.x | PostgreSQL driver | Standard low-level Postgres driver; Drizzle can sit on top. | HIGH |
| **PostgreSQL Row-Level Security** | Built-in | Defense-in-depth tenant isolation | Use `family_id` on family-scoped tables and enforce RLS policies. Application checks are not enough for a product whose core requirement is family isolation. | HIGH |
| **Integer minor units / bigint** | Built-in | Kreds amounts | Store Kreds as integers, never floats. Use `bigint`/`numeric` only where range requires it. | HIGH |
| **Append-only ledger tables** | Custom schema | Audit trail | Model earnings, firstfruits withholding, donation match, wishlist allocation, and negative adjustments as immutable ledger transactions/postings. | HIGH |

### Auth, Roles, and Family Isolation

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **ZITADEL OIDC** | HassLab instance at `https://auth.hasslab.pro` | Authentication / identity provider | Project decision. OIDC discovery confirms issuer, authorization/token/userinfo/JWKS endpoints, PKCE support, `openid profile email offline_access` scopes, and English/Portuguese UI locales. | HIGH |
| **Custom authorization layer** | Project code | Parent/guardian/child permissions | Do not rely only on generic auth roles. Kreds needs domain roles: guardian, child, possibly secondary guardian, and child-managed profile constraints. | HIGH |
| **Parent-managed child profiles** | Project code | Minor-safe account model | For v1, children should be profiles under a family, not fully independent public accounts. This avoids overbuilding identity flows for minors. | MEDIUM |

**Important auth modeling guidance:** Treat ZITADEL as the identity provider, not the Kreds domain model. The domain aggregate is `family`. Store Kreds roles in domain tables keyed by `family_id`, and project them into auth/session claims only as a convenience. Do not model family isolation only as external IdP organizations.

### Testing and Quality

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **Vitest** | 4.x | Unit and domain tests | Fast tests for Kreds Engine, 72-hour rule, weekly cycle boundaries, role authorization, and ledger invariants. | HIGH |
| **Testcontainers** | 12.x | Real PostgreSQL integration tests | Ledger/RLS/transaction behavior must be tested against PostgreSQL, not mocks. | HIGH |
| **Playwright** | 1.60.x current | E2E/PWA tests | Validate parent onboarding, child task completion, offline shell, installability, role-gated navigation, weekly report UX. | HIGH |
| **Testing Library** | 16.x | Component tests | Use for UI behavior that does not require browser-level E2E. | MEDIUM |
| **ESLint + Prettier** | ESLint 10.x, Prettier 3.x | Lint/format | Baseline code hygiene. Keep rules strict for server/client boundary imports. | HIGH |

### Infrastructure and Delivery

| Technology | Recommended Version / Family | Purpose | Why | Confidence |
|------------|------------------------------|---------|-----|------------|
| **Docker** | Current stable | Containerization | Required by PRD and standard for Next.js deployment into Kubernetes. Use multi-stage builds and non-root runtime. | HIGH |
| **Kubernetes** | Current supported cluster version | Runtime platform | Required target platform. Deploy web app and worker separately even if they share code. | HIGH |
| **Argo CD** | Current stable | GitOps deployment | Required by PRD. Good fit for environment promotion and auditable infrastructure changes. | HIGH |
| **Harbor** | Current stable | Container registry | Required by PRD. Use image scanning and immutable tags for release traceability. | HIGH |
| **Managed PostgreSQL preferred** | Cloud/provider dependent | Database operations | Even with Kubernetes for apps, do not run production Postgres inside the app cluster unless the team is ready for database operations, backups, PITR, upgrades, and failover. | HIGH |
| **Kubernetes CronJob or pg-boss worker** | Built-in / pg-boss | Weekly cycle close | Prefer pg-boss for retryable jobs. Kubernetes CronJob can enqueue the weekly close command, not perform all business logic inline. | MEDIUM |

## Recommended Architecture Shape

Use a **modular monolith** with explicit server-only packages/modules:

```text
apps/web
  app/                    # Next.js App Router UI, route handlers, server actions
  components/             # UI components
  lib/auth/               # ZITADEL OIDC integration and session helpers
  lib/db/                 # Drizzle client, schema, migrations
  modules/family/         # family membership, avatars, roles
  modules/tasks/          # weekly tasks, activation history, 72h validation
  modules/ledger/         # append-only Kreds Engine, postings, invariants
  modules/giving/         # firstfruits, donations, parent match
  modules/reports/        # weekly gratitude reports
  worker/                 # pg-boss processors / scheduled work
```

Core rules:

1. **All mutable financial operations go through ledger commands.** No direct balance updates from UI handlers.
2. **Balances are derived or cached from postings.** If cached, update only in the same transaction as ledger postings.
3. **Every family-scoped table has `family_id`.** Add composite indexes around `family_id`, `child_id`, `week_start`, and ledger transaction IDs.
4. **RLS is enabled for family-scoped tables.** App code also checks authorization; RLS is defense in depth.
5. **Use idempotency keys** for task completion, weekly cycle close, donation match, and report generation.
6. **Use server-only imports** for domain modules so ledger code never enters client bundles.

## Installation Baseline

Use `pnpm` and pin exact versions in `package.json` during bootstrap.

```bash
pnpm create next-app@latest kreds --ts --eslint --app --src-dir --import-alias "@/*"

# Core domain and data
pnpm add drizzle-orm pg zod pino pg-boss date-fns ulid
pnpm add -D drizzle-kit typescript tsx @types/pg

# UI and PWA
pnpm add react-hook-form @hookform/resolvers @tanstack/react-query lucide-react
pnpm add @serwist/next
pnpm add -D serwist tailwindcss @tailwindcss/postcss

# Testing
pnpm add -D vitest playwright testcontainers @testing-library/react @testing-library/jest-dom
```

## What NOT to Use

| Avoid | Why | Use Instead | Confidence |
|-------|-----|-------------|------------|
| **Go backend for v1** | Adds second language, contract duplication, and service boundary before product workflows are validated. Does not solve ledger correctness by itself. | Node.js/TypeScript modular monolith | HIGH |
| **MongoDB / document-first database** | Harder to enforce relational ledger constraints, family isolation joins, idempotency, and audit queries. | PostgreSQL | HIGH |
| **Firebase/Firestore as primary database** | Great for rapid realtime apps, poor fit for append-only financial ledger with relational constraints and SQL audit trails. | PostgreSQL + Drizzle | HIGH |
| **Prisma as default ORM** | Productive, but heavier abstraction. For ledger/RLS/transaction-heavy code, explicit SQL and constraints matter more than model convenience. | Drizzle ORM + raw SQL where needed | MEDIUM |
| **Floating-point amounts** | Rounding errors will undermine trust in firstfruits, matching, and balances. | Integer minor units / bigint | HIGH |
| **Microservices in v1** | Premature distributed transactions and operational complexity. | Modular monolith with separate deployable worker only if needed | HIGH |
| **`next-pwa` by default** | Historically common but less compelling for modern Next App Router/Turbopack-era work; verify maintenance before adoption. | Serwist / explicit service worker | MEDIUM |
| **Client-only authorization** | Children and parents can bypass UI restrictions if server checks are absent. | Server-side authorization + RLS | HIGH |
| **Running production Postgres casually inside Kubernetes** | Backups, PITR, failover, upgrades, and storage are specialized operational concerns. | Managed Postgres or a deliberately operated Postgres platform | HIGH |

## Stack-Specific Roadmap Implications

1. **Bootstrap phase should establish the monolith skeleton, Postgres schema/migrations, auth, and tenant isolation before feature UI.** Retrofitting `family_id` and RLS later is expensive.
2. **Ledger phase should happen before donations/wishlist reporting.** Firstfruits, matching, goals, and negative adjustments all depend on immutable ledger primitives.
3. **PWA/offline phase should be scoped carefully.** Cache shell and read-mostly screens first. Do not allow offline financial writes until idempotency, conflict handling, and audit semantics are designed.
4. **Weekly cycle/reporting phase needs job infrastructure.** Add pg-boss or a worker before weekly gratitude reports and cycle close automation.
5. **Role model should be implemented early.** Parent/child/guardian behavior affects every page and mutation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Node.js/TypeScript over Go | HIGH | Strong fit for Next.js PWA, shared validation, and rapid product iteration. |
| PostgreSQL + append-only ledger | HIGH | Required by PRD and standard for auditable relational financial records. |
| Drizzle ORM | HIGH | Verified docs show PostgreSQL schema, relations, and transactions; explicit SQL is valuable for ledger work. |
| ZITADEL OIDC | HIGH | OIDC discovery verified against `https://auth.hasslab.pro`; exact Next.js integration library/session strategy still needs implementation design. |
| Serwist for PWA | MEDIUM-HIGH | Official docs show Next.js setup; should be verified against chosen Next.js version/Turbopack config during implementation. |
| Tailwind CSS 4 | HIGH | Official 2025 release docs confirm v4 architecture and benefits. |
| pg-boss jobs | MEDIUM | Good fit because it avoids Redis, but job semantics should be validated with weekly cycle requirements. |

## Sources

- Context7: Next.js `/vercel/next.js` docs for App Router, Server Actions, PWA guidance, and `refresh` behavior. Confidence: HIGH.
- Context7: Drizzle ORM `/drizzle-team/drizzle-orm-docs` docs for PostgreSQL schema, relations, migrations, and transactions. Confidence: HIGH.
- ZITADEL OIDC discovery: `https://auth.hasslab.pro/.well-known/openid-configuration` verified issuer, endpoints, scopes, PKCE, and locales. Confidence: HIGH for provider availability; MEDIUM for app integration details until Phase 2.
- Node.js official release page: `https://nodejs.org/en/about/previous-releases` — production apps should use Active/Maintenance LTS; Node 24 and Node 22 LTS status observed. Confidence: HIGH.
- PostgreSQL official versioning policy: `https://www.postgresql.org/support/versioning/` — major versions supported for 5 years; PostgreSQL 18 and 17 currently supported. Confidence: HIGH.
- Tailwind CSS v4 official release notes: `https://tailwindcss.com/blog/tailwindcss-v4` — v4 released Jan 22, 2025 with performance and CSS-first changes. Confidence: HIGH.
- Serwist Next.js docs: `https://serwist.pages.dev/docs/next/getting-started` — documented `@serwist/next` install, service worker, manifest, metadata setup. Confidence: MEDIUM-HIGH.
- npm package metadata checked 2026-06-04 for current versions: `next 16.2.7`, `react 19.2.7`, `typescript 6.0.3`, `zod 4.4.3`, `drizzle-orm 0.45.2`, `@serwist/next 9.5.11`, `tailwindcss 4.3.0`, `@tanstack/react-query 5.101.0`, `react-hook-form 7.77.0`, `pg 8.21.0`, `vitest 4.1.8`, `playwright 1.60.0`, `pino 10.3.1`, `pg-boss 12.18.2`, `testcontainers 12.0.1`. Confidence: HIGH at research time; re-check during bootstrap.
