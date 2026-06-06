# Phase 02: Family Access, Tenancy, Roles, and Profiles - Context

**Gathered:** 2026-06-06T22:18:07Z
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 02 delivers ZITADEL-backed guardian authentication, family tenant creation, family-scoped membership, guardian invitations, parent-managed child profiles, Kreds domain roles, simple child profile visual identifiers, and parent-readable audit visibility for identity, membership, and profile changes.

The phase must establish trustworthy family isolation by `family_id` before later ledger, task, wishlist, giving, and gratitude features use family-scoped data.

</domain>

<decisions>
## Implementation Decisions

### Family Onboarding

- **D-01:** After a guardian authenticates through ZITADEL and has no Kreds family yet, the first required product step is to create the family tenant before any child profile or child data is collected.
- **D-02:** Parental consent must be explicit before creating child profiles. Use a clear checkbox-style confirmation that can be audited and tested.
- **D-03:** Family onboarding requires family name and timezone. Timezone should be shown as a readable locality, such as `Brazil - Sao Paulo`, while storing the canonical IANA timezone value internally, such as `America/Sao_Paulo`.
- **D-04:** After family creation, the guardian should be directed to create the first child profile.

### Guardian Invitations

- **D-05:** Additional guardians join a family through email invitation. The invitee authenticates through ZITADEL and accepts the family link.
- **D-06:** Any active guardian in a family may invite another guardian.
- **D-07:** Guardian invitations need a full domain lifecycle: `pending`, `accepted`, `expired`, `revoked`, and `declined`.
- **D-08:** Creating an invitation should persist an auditable pending invitation record, but active family membership must not be created until authenticated acceptance.

### Child Profiles

- **D-09:** Child profiles in v1 include display name, Sylvan avatar or visual identifier, and age in years. Do not collect full date of birth in v1.
- **D-10:** Children remain parent-managed Kreds profiles in v1 and do not self-register publicly. The domain model should leave room for a future optional link to a child ZITADEL identity.
- **D-11:** A child profile must never exist without a family that has at least one active guardian.
- **D-12:** Child profile removal should use soft deactivation so normal UI hides inactive profiles while preserving audit/history and avoiding future ledger-history deletion conflicts.
- **D-13:** The existing privacy inventory must be updated during this phase because v1 now explicitly collects child age in years and the model should anticipate a future optional child identity link.

### Roles and Authorization

- **D-14:** There is a global `system owner` role for whole-system administration, separate from family roles.
- **D-15:** Within a family, the only v1 family roles are `guardian` and `child`.
- **D-16:** ZITADEL manages identity and may manage the global `system owner` role. Kreds stores family membership and family roles by `family_id` for family-scoped authorization. This split is required to satisfy FAM-04 while still using ZITADEL as IAM.

### Audit Visibility

- **D-17:** All active guardians in a family can view identity, membership, invitation, role, and child profile audit history for that family.
- **D-18:** The v1 audit UI should be a simple parent-readable timeline showing who changed what and when. It should not expose a raw technical log or sensitive detailed diffs by default.

### Child Avatars

- **D-19:** Child avatars use a closed set of Sylvan Growth preset avatars. Do not allow child photo uploads in v1.
- **D-20:** Phase 02 avatars are static profile identifiers and must not imply task progress, ledger state, or growth progression yet.
- **D-21:** Only guardians can change child avatars in v1.
- **D-22:** Siblings should be visually differentiated through a Sylvan preset avatar plus a per-child accent color.

### the agent's Discretion

- Downstream agents may decide implementation details such as exact table names, route names, form layout, copy wording, invitation token mechanics, and audit event schema, as long as they preserve the decisions above and the phase requirements.
- Downstream agents may choose the simplest secure way to integrate ZITADEL sessions with Next.js, provided authorization remains server-side and family roles remain stored in the Kreds domain model.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements

- `.planning/ROADMAP.md` — Defines Phase 02 goal, dependencies, success criteria, MVP mode, and requirement IDs FAM-01 through FAM-07.
- `.planning/REQUIREMENTS.md` — Defines FAM-01 through FAM-07 and related privacy/PWA constraints.
- `.planning/PROJECT.md` — Captures core product framing, ZITADEL decision, family privacy requirement, and v1 constraints.
- `.planning/STATE.md` — Carries Phase 1 execution decisions and known limitations.

### Privacy and Child Data

- `docs/PRIVACY-INVENTORY.md` — Defines child data categories, parent-managed child profile baseline, COPPA checklist, and current data retention policy. Must be updated for age-in-years collection and future child identity readiness.

### Existing Implementation

- `src/lib/db/schema/index.ts` — Current Drizzle schema has the initial `families` table with `name` and `timezone`.
- `src/lib/db/index.ts` — Current database integration pattern using Drizzle and `pg`.
- `src/app/api/families/route.ts` — Current simple family API proof point; must not remain unscoped once auth and tenancy are introduced.
- `src/app/page.tsx` — Current DB-backed homepage proof point; should evolve toward authenticated/family-aware onboarding.
- `src/modules/glossary/terms.ts` — Existing canonical terms include `GUARDIAN`, `CHILD`, and `FAMILY`.

### Design Direction

- `.planning/sketches/MANIFEST.md` — Selects Sylvan Growth visual direction and relevant child-facing design decisions.
- `stitch_a_golden_woven_basket_filled_with_glowing_golden_light_and_ethereal_sparkles/sylvan_growth_system/DESIGN.md` — Visual system reference for Sylvan Growth avatar/preset direction.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/db/index.ts` provides the Drizzle database access pattern to extend for membership, invitation, child profile, and audit tables.
- `src/lib/db/schema/index.ts` already defines `families` with `name` and `timezone`; Phase 02 can extend from this foundation instead of introducing a parallel tenancy model.
- `src/modules/glossary/terms.ts` already defines family and role terminology that should be reused in UI copy/tests where relevant.

### Established Patterns

- The app is a Next.js App Router project with server-side DB reads already demonstrated in `src/app/page.tsx`.
- API proof points currently use Route Handlers under `src/app/api/*/route.ts`.
- PostgreSQL and Drizzle are the established data layer; family isolation should be enforced in schema, queries, tests, and eventually RLS/server-side authorization.

### Integration Points

- Auth/session integration should wrap or gate family onboarding and family-scoped routes before any child profile data is created.
- Existing `/api/families` behavior returns all families and is only a Phase 1 proof point; Phase 02 planning must replace or guard this with authenticated, family-scoped access.
- Privacy inventory documentation must be updated in the same phase that introduces child profile data.

</code_context>

<specifics>
## Specific Ideas

- Timezone UI should show localities in a parent-friendly way, for example `Brazil - Sao Paulo`, while persisting canonical IANA values.
- Guardian invitations should be lifecycle-rich enough for parent trust and auditability, not just a one-off email link.
- Child identity should be future-ready for optional ZITADEL linkage without making child login part of v1.
- Audit presentation should be a simple timeline suitable for parents, not a technical event dump.
- Avatars should use static Sylvan preset imagery plus accent colors; no child photo upload.

</specifics>

<deferred>
## Deferred Ideas

- Child-owned ZITADEL login is deferred beyond v1. The v1 model should prepare for optional future linkage but must not implement public child self-registration in Phase 02.
- Avatar growth/progression is deferred to later task, earnings, or child experience phases. Phase 02 avatars are static identifiers only.

</deferred>

---

*Phase: 02-Family Access, Tenancy, Roles, and Profiles*
*Context gathered: 2026-06-06T22:18:07Z*
