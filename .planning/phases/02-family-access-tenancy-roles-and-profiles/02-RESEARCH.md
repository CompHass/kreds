# Phase 02 Research: Family Access, Tenancy, Roles, and Profiles

**Researched:** 2026-06-06  
**Confidence:** HIGH for domain model and tenancy shape; MEDIUM-HIGH for exact Auth.js/ZITADEL integration because implementation still needs local redirect/client-secret validation against the HassLab ZITADEL console.

## Scope Summary

Phase 02 must turn the Phase 1 proof-of-concept database shell into an authenticated, family-scoped product surface. The phase covers ZITADEL-backed guardian sign-in, first-family creation, family membership, v1 roles (`guardian`, `child`), guardian invitations, parent-managed child profiles, Sylvan static avatar identifiers, soft deactivation, and a parent-readable audit timeline for identity, membership, invitation, role, and profile changes. [CITED: .planning/phases/02-family-access-tenancy-roles-and-profiles/02-CONTEXT.md]

The required outcome is not merely “login works.” Every family-scoped read and mutation must be anchored to `family_id`, and child data must not be created until an authenticated guardian has explicitly created a family tenant and provided auditable parental consent for child-profile creation. [CITED: .planning/REQUIREMENTS.md] [CITED: .planning/phases/02-family-access-tenancy-roles-and-profiles/02-CONTEXT.md]

Requirement coverage to preserve during planning:

| Requirement | Planning interpretation |
|---|---|
| FAM-01 | ZITADEL guardian auth + family creation + persisted `family_id` isolation. [CITED: .planning/REQUIREMENTS.md] |
| FAM-02 | Guardian invitation lifecycle and authenticated acceptance before membership creation. [CITED: .planning/REQUIREMENTS.md] [CITED: 02-CONTEXT.md] |
| FAM-03 | Parent-managed child profiles only; no public child self-registration. [CITED: .planning/REQUIREMENTS.md] |
| FAM-04 | Kreds family roles stored in Kreds tables, not only in ZITADEL claims. [CITED: .planning/REQUIREMENTS.md] |
| FAM-05 | Family members can only view their own family’s data. [CITED: .planning/REQUIREMENTS.md] |
| FAM-06 | Child avatar/visual identifier support using closed Sylvan presets plus accent color. [CITED: .planning/REQUIREMENTS.md] [CITED: 02-CONTEXT.md] |
| FAM-07 | Guardian-visible audit trail for identity, membership, invitations, roles, and profile changes. [CITED: .planning/REQUIREMENTS.md] |

## Locked Decisions From Context

- Authenticated guardians with no family must create the family tenant before child profile data is collected. [CITED: 02-CONTEXT.md]
- Parental consent must be explicit and auditable before child profiles are created. [CITED: 02-CONTEXT.md]
- Family onboarding requires family name and timezone; store canonical IANA timezone and show readable locality text. [CITED: 02-CONTEXT.md]
- After family creation, direct the guardian to create the first child profile. [CITED: 02-CONTEXT.md]
- Additional guardians join by email invitation, authenticate through ZITADEL, then accept the family link. [CITED: 02-CONTEXT.md]
- Any active guardian may invite another guardian. [CITED: 02-CONTEXT.md]
- Invitation statuses are `pending`, `accepted`, `expired`, `revoked`, and `declined`; do not create active membership until authenticated acceptance. [CITED: 02-CONTEXT.md]
- Child profiles include display name, Sylvan avatar/visual identifier, and age in years; do not collect full date of birth in v1. [CITED: 02-CONTEXT.md]
- Children are parent-managed Kreds profiles in v1; model a nullable future ZITADEL child identity link but do not implement child self-registration now. [CITED: 02-CONTEXT.md]
- Child profiles must never exist without a family that has at least one active guardian. [CITED: 02-CONTEXT.md]
- Child profile removal is soft deactivation. [CITED: 02-CONTEXT.md]
- Update `docs/PRIVACY-INVENTORY.md` for age-in-years and future optional child identity link. [CITED: 02-CONTEXT.md]
- Global `system owner` is separate from family roles; ZITADEL may manage the global role, while Kreds owns family membership and `guardian`/`child` roles by `family_id`. [CITED: 02-CONTEXT.md]
- All active guardians can view a parent-readable audit timeline for their family; do not expose raw technical logs or sensitive detailed diffs by default. [CITED: 02-CONTEXT.md]
- Child avatars are static Sylvan preset identifiers plus accent color; no photo uploads and no progress/growth semantics in Phase 02. [CITED: 02-CONTEXT.md]

## Existing Code and Integration Points

- The current schema only has `families(id, name, timezone, created_at, updated_at)`. Phase 02 should extend this table rather than introduce a parallel tenant concept. [CITED: src/lib/db/schema/index.ts]
- `src/lib/db/index.ts` exports a single Drizzle `db` backed by `pg.Pool` and `DATABASE_URL`; all new domain services should reuse this integration. [CITED: src/lib/db/index.ts]
- `src/app/api/families/route.ts` currently returns all families with no authentication or tenant filter. This is acceptable only as a Phase 1 proof point and must be removed, protected, or replaced before FAM-05 can pass. [CITED: src/app/api/families/route.ts] [CITED: 02-CONTEXT.md]
- `src/app/page.tsx` currently reads all families and displays the total count. Phase 02 should replace this with auth-aware routing: public landing/sign-in, authenticated no-family onboarding, and authenticated family dashboard/profile setup. [CITED: src/app/page.tsx]
- `src/modules/glossary/terms.ts` already defines `GUARDIAN`, `CHILD`, and `FAMILY`; planner should reuse these terms where UI/tests need canonical product language. [CITED: src/modules/glossary/terms.ts]
- Test infrastructure exists: Vitest with jsdom setup, Playwright E2E config, and a Testcontainers PostgreSQL migration integration test. [CITED: vitest.config.ts] [CITED: playwright.config.ts] [CITED: tests/integration/db-connection.test.ts]
- Known local limitation: Testcontainers currently requires Docker, and project state says Podman SSH tunnel is not directly compatible. Plan integration tests with either an available Docker daemon or a documented fallback to the existing cluster PostgreSQL/port-forward path. [CITED: .planning/STATE.md]

## Recommended Technical Approach

Use Auth.js / NextAuth with the official Zitadel provider for the Next.js App Router. Auth.js documents `next-auth/providers/zitadel`, `/app/api/auth/[...nextauth]/route.ts`, an `auth.ts` export, `auth()` for server-side session reads, and route-handler protection via `auth(function GET(req) { ... })`. [CITED: https://authjs.dev/getting-started/providers/zitadel] [CITED: https://authjs.dev/getting-started/installation] [CITED: https://authjs.dev/getting-started/session-management/protecting]

ZITADEL’s official Next.js example uses OAuth 2.0 Authorization Code + PKCE, NextAuth.js, OIDC claims, JWT session strategy, token refresh, and federated logout. The HassLab issuer discovery endpoint is available at `https://auth.hasslab.pro` and exposes authorization, token, userinfo, and JWKS endpoints. [CITED: https://zitadel.com/docs/sdk-examples/nextjs] [VERIFIED: ZITADEL discovery at https://auth.hasslab.pro/.well-known/openid-configuration]

Recommended auth slice:

1. Add `auth.ts` at repo root and `/app/api/auth/[...nextauth]/route.ts`. [CITED: https://authjs.dev/getting-started/installation]
2. Configure Zitadel provider with `AUTH_ZITADEL_ID`, `AUTH_ZITADEL_SECRET`, `AUTH_SECRET`, and issuer/client settings mapped to HassLab ZITADEL. Auth.js provider docs name `AUTH_ZITADEL_ID` and `AUTH_ZITADEL_SECRET`; Auth.js install docs require `AUTH_SECRET`. [CITED: https://authjs.dev/getting-started/providers/zitadel] [CITED: https://authjs.dev/getting-started/installation]
3. Require verified guardian email during sign-in if ZITADEL returns `email_verified`; Auth.js Zitadel docs show a sign-in callback gate for `profile.email_verified`. [CITED: https://authjs.dev/getting-started/providers/zitadel]
4. Persist a local Kreds identity record keyed by ZITADEL `sub`, not by mutable email. ZITADEL claims docs define `sub` as the subject ID and `email`/`email_verified` as requested claims. [CITED: https://zitadel.com/docs/apis/openidoauth/claims]
5. Keep Kreds authorization outside ZITADEL for family membership and role checks. This is locked by D-16 and FAM-04. [CITED: 02-CONTEXT.md] [CITED: .planning/REQUIREMENTS.md]
6. Use server-only domain modules for `requireAuthenticatedIdentity`, `requireActiveGuardian(familyId)`, `requireFamilyMember(familyId)`, invitation acceptance, child-profile commands, and audit writes. Server-only domain modules are the project stack recommendation. [CITED: AGENTS.md]
7. Prefer one transactional command per business action: create family + creator guardian membership + consent audit event; invite guardian + pending invitation audit event; accept invitation + membership + accepted audit event; create/deactivate/update child profile + audit event. Drizzle supports transactions and rollback semantics. [CITED: https://orm.drizzle.team/docs/transactions]

Package notes:

| Package | Recommendation | Provenance |
|---|---|---|
| `next-auth@beta` | Install for Auth.js v5-style App Router integration because official Auth.js docs use `pnpm add next-auth@beta`, `auth.ts`, and Next.js `proxy.ts`. | [CITED: https://authjs.dev/getting-started/installation] [VERIFIED: npm dist-tag beta=5.0.0-beta.31] [VERIFIED: slopcheck OK] |
| `@auth/drizzle-adapter` | Optional only if planner chooses database-backed Auth.js persistence. Not required for a JWT-session MVP if Kreds stores identity/membership separately. | [CITED: https://authjs.dev/getting-started/adapters/drizzle] [VERIFIED: npm latest=1.11.2] [VERIFIED: slopcheck OK] |
| `openid-client` | Do not install directly unless Auth.js/ZITADEL example requires direct lower-level custom flow work; ZITADEL says the example uses next-auth with openid-client under the OIDC implementation. | [CITED: https://zitadel.com/docs/sdk-examples/nextjs] [VERIFIED: npm latest=6.8.4] [VERIFIED: slopcheck OK] |

## Data Model Research Notes

Recommended tables and constraints for planning:

| Table | Purpose | Key fields / constraints |
|---|---|---|
| `kreds_identities` or `users` | Local authenticated guardian identity mapped from ZITADEL. | `id uuid`, `zitadel_subject text unique not null`, `email text`, `email_verified boolean`, `display_name text`, timestamps. Use `zitadel_subject` as stable key. [CITED: https://zitadel.com/docs/apis/openidoauth/claims] |
| `families` | Existing tenant root. | Add/confirm `name`, `timezone`, `created_by_identity_id`, maybe `deactivated_at`; keep canonical IANA timezone string. [CITED: src/lib/db/schema/index.ts] [CITED: 02-CONTEXT.md] |
| `family_memberships` | Kreds-domain membership and role. | `family_id`, `identity_id` nullable for child profiles, `child_profile_id` nullable, `role enum('guardian','child')`, `status enum('active','inactive')`, timestamps; enforce exactly one member target per row. [CITED: 02-CONTEXT.md] |
| `guardian_invitations` | Auditable invite lifecycle. | `family_id`, `email`, `status enum('pending','accepted','expired','revoked','declined')`, token hash, `invited_by_identity_id`, `accepted_by_identity_id`, `expires_at`, lifecycle timestamps. [CITED: 02-CONTEXT.md] |
| `child_profiles` | Parent-managed child records. | `family_id`, `display_name`, `age_years`, `avatar_preset`, `accent_color`, nullable `future_zitadel_subject` or `identity_id`, `active`, `deactivated_at`, timestamps. [CITED: 02-CONTEXT.md] |
| `family_audit_events` | Parent-readable audit timeline. | `family_id`, `actor_identity_id`, `event_type`, `subject_type`, `subject_id`, `summary`, sanitized `metadata jsonb`, `created_at`; avoid sensitive raw diffs by default. [CITED: 02-CONTEXT.md] |
| `parental_consents` or audit event subtype | Explicit child-profile consent evidence. | `family_id`, `guardian_identity_id`, `consent_type`, `consented_at`, `source`. Could be a dedicated table plus audit event for easier proof. [CITED: 02-CONTEXT.md] |

Schema implications:

- Use PostgreSQL enum/check constraints for fixed statuses and roles so invalid lifecycle states cannot be inserted accidentally. [ASSUMED]
- Add indexes on `family_id` to every family-scoped table before later ledger/task phases depend on them. [CITED: AGENTS.md]
- Add unique indexes to prevent duplicate active guardian membership for the same `family_id + identity_id`, duplicate active child membership for the same `child_profile_id`, and duplicate pending invitations for the same `family_id + lower(email)`. [ASSUMED]
- Use hashed invitation tokens only; never store raw invitation tokens in the database. [ASSUMED]
- In transactions, create the audit event in the same transaction as the state change. Drizzle transaction docs support grouped statements that commit or rollback as one logical unit. [CITED: https://orm.drizzle.team/docs/transactions]

## Authorization and Tenancy Notes

Primary authorization rule: every family-scoped service function should accept authenticated identity plus target `family_id`, load active membership, verify required role/status, then execute a query constrained by `family_id`. Do not trust client-supplied family IDs without membership verification. [CITED: .planning/REQUIREMENTS.md] [CITED: 02-CONTEXT.md]

Auth.js docs warn not to rely exclusively on proxy/middleware and to verify the session close to data fetching. For Kreds, that means page guards can improve UX, but Route Handlers, Server Actions, and server-side reads must call domain authorization helpers before touching family data. [CITED: https://authjs.dev/getting-started/session-management/protecting]

PostgreSQL RLS is a defense-in-depth option. PostgreSQL docs state that enabling RLS without policies creates default-deny behavior, policies control visible/modifiable rows, and table owners normally bypass RLS unless `FORCE ROW LEVEL SECURITY` is used. [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]

Drizzle 0.45.x supports `.enableRLS()` and policy definitions, while Drizzle docs note `pgTable.withRLS(...)` is the newer v1 beta approach and `.enableRLS()` is deprecated starting in v1.0 beta. Since this project currently uses `drizzle-orm 0.45.2`, planner should either use raw SQL migrations for RLS or use 0.x-compatible Drizzle APIs and avoid v1 beta-only APIs. [CITED: package.json] [CITED: https://orm.drizzle.team/docs/rls]

Recommended tenant enforcement order for Phase 02:

1. Mandatory application-level authorization helpers and tests for every family-scoped path. [CITED: https://authjs.dev/getting-started/session-management/protecting]
2. Database constraints and family_id indexes for all family-scoped tables. [CITED: AGENTS.md]
3. Add RLS migrations if feasible in the phase, but do not let incomplete RLS replace server-side checks. PostgreSQL RLS can be bypassed by superusers and table owners, so the app still needs explicit authorization. [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]

## Privacy and Compliance Notes

The current privacy inventory says Phase 1 collects no child data, and Phase 2 currently lists child display name, role, avatar/visual identifier, and family membership. It does not yet list child age in years or future optional child identity linkage; D-13 explicitly requires that update. [CITED: docs/PRIVACY-INVENTORY.md] [CITED: 02-CONTEXT.md]

Privacy-sensitive planning requirements:

- Update `docs/PRIVACY-INVENTORY.md` in the same phase as schema/forms for child profiles. [CITED: 02-CONTEXT.md]
- Record explicit parental consent before child profile creation; a checkbox-style confirmation must be auditable and testable. [CITED: 02-CONTEXT.md]
- Avoid full date of birth and photo upload in v1. [CITED: 02-CONTEXT.md]
- Keep children parent-managed; do not create public child registration or child-owned ZITADEL login. [CITED: 02-CONTEXT.md]
- Treat child age in years as child personal information for the inventory. [CITED: 02-CONTEXT.md]
- Keep audit event metadata sanitized; raw technical diffs may expose unnecessary child/family data and are out of scope for the parent-readable timeline. [CITED: 02-CONTEXT.md]
- Shared-device risk should be deferred to Phase 9 for PWA hardening, but Phase 02 should not cache child/family-sensitive data in service-worker/offline storage. [CITED: .planning/REQUIREMENTS.md]

## Test and Validation Strategy

Plan tests around authorization boundaries, not only happy-path UI:

- Unit tests for role predicates: active guardian can invite/create child/read audit; inactive guardian cannot; child role cannot invite or edit avatars; unauthenticated user cannot access family commands. [CITED: .planning/REQUIREMENTS.md]
- Unit tests for invitation lifecycle transitions: pending → accepted, pending → declined, pending → revoked, pending → expired; no active membership before authenticated acceptance. [CITED: 02-CONTEXT.md]
- Integration tests against PostgreSQL migrations for schema constraints, transaction atomicity, duplicate membership/invite prevention, soft deactivation, and audit event creation. Existing integration pattern uses PostgreSQL Testcontainers and Drizzle migrations. [CITED: tests/integration/db-connection.test.ts]
- Route Handler tests or server-action tests for `/api/families` replacement behavior: unauthenticated returns 401/redirect, member sees only own family, non-member cannot enumerate all families. [CITED: src/app/api/families/route.ts] [CITED: https://authjs.dev/getting-started/session-management/protecting]
- Playwright E2E smoke for guardian sign-in can be difficult against live ZITADEL; planner should either mock/session-seed at test level or mark live OIDC as manual/human-verified unless test credentials are provided. [ASSUMED]
- Documentation validation: privacy inventory must include child age in years, consent evidence, and future child identity link before phase close. [CITED: docs/PRIVACY-INVENTORY.md] [CITED: 02-CONTEXT.md]

## Validation Architecture

Nyquist validation is enabled in `.planning/config.json`; include validation tasks in Wave 0 and phase gate. [CITED: .planning/config.json]

| Property | Value |
|---|---|
| Unit/component framework | Vitest 4.1.8 with jsdom. [CITED: package.json] [CITED: vitest.config.ts] |
| Integration framework | Vitest + Testcontainers PostgreSQL, with known Docker/Podman limitation. [CITED: package.json] [CITED: tests/integration/db-connection.test.ts] [CITED: .planning/STATE.md] |
| E2E framework | Playwright 1.60.0, configured for Chromium and Mobile Safari. [CITED: package.json] [CITED: playwright.config.ts] |
| Quick command | `pnpm test` for unit/integration subset; planner may split new phase tests into targeted Vitest commands. [CITED: package.json] |
| Full suite command | `pnpm test && pnpm test:e2e` after app/server test setup is in place. [CITED: package.json] |
| Migration validation | `pnpm db:generate` and `pnpm db:migrate`; project state says both work with port-forwarded cluster PostgreSQL. [CITED: package.json] [CITED: .planning/STATE.md] |

Requirement-to-test map:

| Requirement | Behavior | Test type | Suggested automated check |
|---|---|---|---|
| FAM-01 | Authenticated guardian creates family and membership under `family_id`. | integration + route/server action | Transaction creates family, local identity, active guardian membership, consent/audit as applicable. |
| FAM-02 | Guardian invitation lifecycle and authenticated acceptance. | unit + integration | Lifecycle transition tests and no membership before acceptance. |
| FAM-03 | Child profile created by guardian only, no public registration. | unit + integration + UI | Guardian create succeeds with consent; unauthenticated/public path absent or blocked. |
| FAM-04 | Roles stored in Kreds domain model. | integration | Membership table persists `guardian`/`child` independent of ZITADEL claims. |
| FAM-05 | Cross-family isolation. | integration + route/server action | Identity from family A cannot query/mutate family B rows. |
| FAM-06 | Sylvan preset avatar and accent color. | unit + UI | Only allowed preset/accent values accepted; child photo upload absent. |
| FAM-07 | Guardian-readable audit timeline. | integration + UI | Mutations create sanitized audit events; active guardian can view family timeline. |

Wave 0 gaps for planner:

- Add auth test utilities to simulate authenticated ZITADEL `sub`/email sessions without live browser login. [ASSUMED]
- Add database factories for identity, family, membership, child profile, invitation, and audit rows. [ASSUMED]
- Decide whether integration tests run via Testcontainers Docker or cluster PostgreSQL fallback because current project state flags Podman incompatibility. [CITED: .planning/STATE.md]
- Add privacy inventory validation as a docs test/checklist item. [ASSUMED]

## Planning Recommendations

Recommended slicing order:

1. **Auth foundation slice:** install/configure Auth.js Zitadel provider, add auth route, env documentation, session helper, and protected route/API proof. [CITED: https://authjs.dev/getting-started/installation] [CITED: https://authjs.dev/getting-started/providers/zitadel]
2. **Tenancy schema slice:** add identity, membership, invitation, child profile, consent/audit tables, enums/checks/indexes, migrations, and migration tests. [CITED: src/lib/db/schema/index.ts] [CITED: https://orm.drizzle.team/docs/transactions]
3. **Authorization service slice:** implement server-only helpers and replace unscoped family reads. [CITED: src/app/api/families/route.ts] [CITED: https://authjs.dev/getting-started/session-management/protecting]
4. **Family onboarding slice:** authenticated no-family flow creates family + guardian membership + audit event and redirects to child-profile setup. [CITED: 02-CONTEXT.md]
5. **Child profile and privacy slice:** explicit consent checkbox, child display name, age years, avatar preset, accent color, soft deactivation, privacy inventory update. [CITED: 02-CONTEXT.md] [CITED: docs/PRIVACY-INVENTORY.md]
6. **Guardian invitations slice:** create/revoke/decline/expire/accept lifecycle with token hashing and audit events. [CITED: 02-CONTEXT.md]
7. **Audit timeline slice:** parent-readable timeline filtered by `family_id`, hiding sensitive raw diffs by default. [CITED: 02-CONTEXT.md]
8. **Cross-family verification slice:** add negative tests for every family-scoped read/write and remove the unscoped `/api/families` proof behavior. [CITED: .planning/REQUIREMENTS.md] [CITED: src/app/api/families/route.ts]

Plan checkpoints:

- Human/config checkpoint for ZITADEL application settings: redirect URI, post-logout URI, dev mode for local HTTP, client ID/secret, and allowed scopes. ZITADEL docs require matching redirect URIs and dev mode for local HTTP. [CITED: https://zitadel.com/docs/sdk-examples/nextjs]
- Human decision/checkpoint for using JWT sessions only vs adding `@auth/drizzle-adapter` database sessions. Auth.js supports the Drizzle adapter, but the ZITADEL Next.js example uses JWT session strategy. [CITED: https://authjs.dev/getting-started/adapters/drizzle] [CITED: https://zitadel.com/docs/sdk-examples/nextjs]
- Security checkpoint for RLS: implement now as defense-in-depth only if planner can test it reliably; otherwise explicitly defer RLS while keeping server-side authorization mandatory. [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]

## Risks and Open Questions

Risks:

- **Auth.js versioning:** Official current Auth.js docs for Next.js still install `next-auth@beta`; npm `latest` is 4.24.14 and `beta` is 5.0.0-beta.31. Planner should pin the intended beta and avoid mixing v4 and v5 docs. [CITED: https://authjs.dev/getting-started/installation] [VERIFIED: npm dist-tags]
- **Live ZITADEL testability:** Without test credentials and redirect configuration, full browser OIDC E2E may require manual verification. [ASSUMED]
- **Tenant enumeration:** Existing `/api/families` and homepage enumerate family count/all families; leaving either unguarded violates FAM-05. [CITED: src/app/api/families/route.ts] [CITED: src/app/page.tsx] [CITED: .planning/REQUIREMENTS.md]
- **RLS false confidence:** PostgreSQL table owners and superusers can bypass RLS unless configured carefully; server-side authorization cannot be skipped. [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]
- **Child privacy drift:** Adding age years without updating the privacy inventory violates D-13 and weakens phase closure evidence. [CITED: 02-CONTEXT.md] [CITED: docs/PRIVACY-INVENTORY.md]
- **Invitation token leakage:** Storing raw invitation tokens would make database exposure more damaging; planner should require token hashing. [ASSUMED]

## Open Questions (RESOLVED)

Planning decisions selected for Phase 02 execution:

1. **ZITADEL config:** Use HassLab issuer `https://auth.hasslab.pro` with Auth.js env keys `AUTH_SECRET`, `AUTH_ZITADEL_ID`, `AUTH_ZITADEL_SECRET`, and `AUTH_ZITADEL_ISSUER`. Document local callback `/api/auth/callback/zitadel`; live credentials remain `user_setup` because the agent cannot create or read the user's ZITADEL client secret. [CITED: https://zitadel.com/docs/sdk-examples/nextjs]
2. **RLS:** Implement application-level authorization helpers, family_id indexes, schema constraints, and tests in Phase 02. Do not implement PostgreSQL RLS in this phase; keep it as a later defense-in-depth hardening item after app-level checks are green, because incomplete RLS must not substitute for server-side authorization. [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]
3. **Invitation email/link behavior:** Phase 02 persists the full invitation lifecycle and exposes a one-time copyable invitation link; it does not add outbound email transport. Email delivery can be added later without changing the domain lifecycle. [ASSUMED]
4. **Avatar IDs/colors:** Use closed static identifiers in code: `oak-sprout`, `cedar-sapling`, `olive-branch`, `mustard-seed`, `fig-leaf`, `river-stone`; accent colors `moss`, `gold`, `sky`, `berry`, `clay`, `sage`. No uploads, URLs, or progress/growth semantics in Phase 02. [CITED: 02-CONTEXT.md]
5. **System owner handling:** Phase 02 models system owner as external/global authorization potentially asserted by ZITADEL but does not implement an admin UI or system-owner authorization surface. Kreds family roles remain `guardian` and `child` stored by `family_id`. [CITED: https://zitadel.com/docs/apis/openidoauth/claims] [CITED: 02-CONTEXT.md]
