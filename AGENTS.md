<!-- GSD:project-start source:PROJECT.md -->

## Project

**Kreds**

Kreds is a Christian stewardship and allowance management app for families. It helps parents teach children financial responsibility through weekly activities, automatic tithe separation, generosity incentives, savings goals, and gratitude reflection grounded in biblical principles.

The initial audience is Christian parents and guardians who want to educate children ages 6+ in both personal finance and character formation, with children using the product to track tasks, earnings, giving, and wishes.

**Core Value:** Children learn to steward money faithfully by separating firstfruits, completing responsibilities with integrity, practicing generosity, and seeing progress toward personal goals.

### Constraints

- **Language**: Planning docs, code, comments, identifiers, and commit messages are English - required by the active agent rules.
- **Product language**: User-facing copy can be localized later, but the current planning artifacts are written in English for implementation consistency.
- **Frontend**: React/Next.js PWA - requested by the PRD for web and mobile reach.
- **Backend**: Go or Node.js API - final choice is still pending and should be resolved before implementation.
- **Database**: PostgreSQL - required for relational financial records and auditability.
- **Infrastructure**: Kubernetes, ArgoCD, Docker, and Harbor - requested target platform for deployment.
- **Financial integrity**: All Kreds Engine transactions need an auditable model because the app teaches stewardship and must preserve trust.
- **Family privacy**: Family data isolation by `family_id` is a core architectural requirement.
- **Weekly cadence**: The activity period is Sunday through Saturday and shapes task validation, reports, and phase decomposition.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Executive Recommendation

## Go vs Node.js Decision

| Criterion | Node.js/TypeScript | Go | Recommendation |
|-----------|--------------------|----|----------------|
| Next.js integration | Native ecosystem fit; Route Handlers, Server Actions, shared schemas | Separate API service and duplicated contracts | Node wins |
| Shared validation | Zod schemas can power forms, server commands, tests | Requires OpenAPI/protobuf/codegen discipline | Node wins |
| Product iteration speed | Faster for PWA, forms, auth, dashboards, reports | More boilerplate for common web product flows | Node wins |
| Ledger correctness | Determined by PostgreSQL constraints, transactions, idempotency, and append-only model | Same; Go does not automatically make ledger safer | Tie |
| Runtime performance | More than enough for family allowance workload | Better raw concurrency/latency profile | Go only matters later |
| Hiring/maintenance | One language across frontend/backend | Two-language stack | Node wins |
| Infrastructure | Runs cleanly in Docker/Kubernetes | Runs cleanly in Docker/Kubernetes | Tie |

## Recommended Stack

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
| **Better Auth** | 1.6.x current | Authentication | TypeScript-native, framework-agnostic auth with Next.js and Drizzle ecosystem fit. Organization plugin supports roles; map organization/family carefully. | MEDIUM-HIGH |
| **Custom authorization layer** | Project code | Parent/guardian/child permissions | Do not rely only on generic auth roles. Kreds needs domain roles: guardian, child, possibly secondary guardian, and child-managed profile constraints. | HIGH |
| **Parent-managed child profiles** | Project code | Minor-safe account model | For v1, children should be profiles under a family, not fully independent public accounts. This avoids overbuilding identity flows for minors. | MEDIUM |

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

## Installation Baseline

# Core domain and data

# UI and PWA

# Testing

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

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Node.js/TypeScript over Go | HIGH | Strong fit for Next.js PWA, shared validation, and rapid product iteration. |
| PostgreSQL + append-only ledger | HIGH | Required by PRD and standard for auditable relational financial records. |
| Drizzle ORM | HIGH | Verified docs show PostgreSQL schema, relations, and transactions; explicit SQL is valuable for ledger work. |
| Better Auth | MEDIUM-HIGH | Docs show organization roles and custom access control; child-profile modeling still needs project-specific design. |
| Serwist for PWA | MEDIUM-HIGH | Official docs show Next.js setup; should be verified against chosen Next.js version/Turbopack config during implementation. |
| Tailwind CSS 4 | HIGH | Official 2025 release docs confirm v4 architecture and benefits. |
| pg-boss jobs | MEDIUM | Good fit because it avoids Redis, but job semantics should be validated with weekly cycle requirements. |

## Sources

- Context7: Next.js `/vercel/next.js` docs for App Router, Server Actions, PWA guidance, and `refresh` behavior. Confidence: HIGH.
- Context7: Drizzle ORM `/drizzle-team/drizzle-orm-docs` docs for PostgreSQL schema, relations, migrations, and transactions. Confidence: HIGH.
- Context7: Better Auth `/better-auth/better-auth` docs for organization plugin, custom roles, and access control. Confidence: HIGH for library capability; MEDIUM for Kreds-specific fit.
- Node.js official release page: `https://nodejs.org/en/about/previous-releases` — production apps should use Active/Maintenance LTS; Node 24 and Node 22 LTS status observed. Confidence: HIGH.
- PostgreSQL official versioning policy: `https://www.postgresql.org/support/versioning/` — major versions supported for 5 years; PostgreSQL 18 and 17 currently supported. Confidence: HIGH.
- Tailwind CSS v4 official release notes: `https://tailwindcss.com/blog/tailwindcss-v4` — v4 released Jan 22, 2025 with performance and CSS-first changes. Confidence: HIGH.
- Serwist Next.js docs: `https://serwist.pages.dev/docs/next/getting-started` — documented `@serwist/next` install, service worker, manifest, metadata setup. Confidence: MEDIUM-HIGH.
- npm package metadata checked 2026-06-04 for current versions: `next 16.2.7`, `react 19.2.7`, `typescript 6.0.3`, `zod 4.4.3`, `drizzle-orm 0.45.2`, `better-auth 1.6.14`, `@serwist/next 9.5.11`, `tailwindcss 4.3.0`, `@tanstack/react-query 5.101.0`, `react-hook-form 7.77.0`, `pg 8.21.0`, `vitest 4.1.8`, `playwright 1.60.0`, `pino 10.3.1`, `pg-boss 12.18.2`, `testcontainers 12.0.1`. Confidence: HIGH at research time; re-check during bootstrap.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
