# Walking Skeleton — Kreds

**Phase:** 1
**Generated:** 2026-06-06

## Capability Proven End-to-End

A developer can run the Kreds app locally, view a page that reads family data from PostgreSQL (a live count via an async Server Component), and call the GET /api/families Route Handler directly — proving the full Next.js App Router → Drizzle ORM → PostgreSQL stack works end-to-end. Family creation (POST) is deferred to Phase 2.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 App Router with TypeScript | Single codebase for SSR, API routes, and PWA; App Router is the current standard |
| Data layer | PostgreSQL 18 + Drizzle ORM 0.45 | Explicit SQL control needed for future ledger work; typed schema with migrations |
| Auth | ZITADEL OIDC (deferred to Phase 2) | Project decision; auth.hasslab.pro instance already exists |
| Package manager | pnpm 10.x | Fast, deterministic installs; workspace-ready for future app/worker split |
| Styling | Tailwind CSS 4.x | CSS-first configuration, automatic content detection, modern build performance |
| PWA | Serwist (@serwist/next 9.x) | Current Next.js-compatible service worker tooling; replaces stale next-pwa |
| Testing | Vitest 4.x + Testcontainers 12.x + Playwright 1.60 | Fast unit tests, real PostgreSQL for integration, browser-level E2E |
| Logging | Pino 10.x | Fast JSON logging suitable for Kubernetes pipelines |
| Validation | Zod 4.x | Shared runtime validation across forms, server actions, route handlers, and tests |
| Deployment target | Docker multi-stage → Kubernetes + ArgoCD + Harbor | Required by PRD; standalone output for minimal image |
| Directory layout | src/app/ (App Router), src/lib/ (shared), src/modules/ (domain), tests/ (by type) | Next.js conventions with server-only domain separation |
| Kreds amounts | Integer minor units (never floats) | Financial integrity requirement; prevents rounding errors |
| Family isolation | family_id on all family-scoped tables + RLS (Phase 2+) | Core architectural requirement for privacy |
| Ledger model | Append-only transactions (Phase 3+) | Auditability and trust for stewardship tracking |

## Stack Touched in Phase 1

- [x] Project scaffold (Next.js 16, TypeScript, pnpm, Tailwind CSS 4, Serwist, Pino, Zod)
- [x] Routing — home page (/) and health API (/api/health)
- [x] Database — families table created via Drizzle migration (`pnpm db:generate` + `pnpm db:migrate`); GET /api/families Route Handler queries PostgreSQL; home page async Server Component renders live family count
- [x] UI — home page with Tailwind styling; async Server Component renders `{families.length} families registered` read from PostgreSQL
- [x] Deployment — Docker multi-stage build with standalone output, non-root user, K8s-ready

## Execution Plan Map

| Plan | Wave | Depends On | Skeleton Responsibility |
|---|---:|---|---|
| 01-01-PLAN.md | 1 | — | Base Next.js scaffold, dependency install gate, health endpoint, families schema stub |
| 01-02-PLAN.md | 2 | 01-01 | docker-compose PostgreSQL, Drizzle migration generation/application, families API, DB-backed home page |
| 01-03-PLAN.md | 3 | 01-02 | Vitest/Playwright/Testcontainers infrastructure and Dockerfile delivery proof |
| 01-04-PLAN.md | 2 | 01-01 | Child privacy inventory and canonical terminology glossary |

## Out of Scope (Deferred to Later Slices)

- Authentication and ZITADEL OIDC integration (Phase 2)
- Family creation UI with full onboarding flow (Phase 2)
- Child profiles, guardian roles, and membership management (Phase 2)
- Row-Level Security policies (Phase 2)
- Kreds Engine ledger transactions and firstfruits withholding (Phase 3)
- Weekly task templates and activity cycles (Phase 4)
- Task completion, approval, and earnings (Phase 5)
- Wishlist goals and progress tracking (Phase 6)
- Kreds do Bem giving and donation matching (Phase 7)
- Biblical content and weekly gratitude reports (Phase 8)
- PWA offline caching, installability, and child experience polish (Phase 9)
- Real payment integrations, push notifications, advanced stewardship features (v2+)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Parent can authenticate via ZITADEL, create a family, invite guardians, and manage child profiles — all isolated by family_id
- Phase 3: Kreds Engine posts append-only ledger transactions with integer amounts, firstfruits withholding, and correction rules
- Phase 4: Parents define weekly task templates with Sunday-Saturday cycle computation
- Phase 5: Children submit task completions, parents approve, earnings post through Kreds Engine
- Phase 6: Children create wishlist goals and allocate available Kreds toward progress
- Phase 7: Families record Kreds do Bem giving allocations with parent-funded 10% match
- Phase 8: Weekly gratitude reports with curated scripture references and immutable snapshots
- Phase 9: PWA installability, responsive dashboards, shared-device safety, and child-friendly language
