---
phase: 02-family-access-tenancy-roles-and-profiles
verified: 2026-06-07T04:00:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Parent can authenticate through ZITADEL, create a family account, and all family-scoped data is isolated by family_id."
    status: partial
    reason: |
      ZITADEL auth config is correct and family creation (createFamilyForGuardian) correctly
      upserts via zitadelSubject. However, requireAuthenticatedIdentity sets identity.id =
      zitadelSub (raw string, e.g. 'abc123|user|abc'), and every subsequent membership
      lookup (GET /api/families, children page, onboarding page redirect check, invitations
      page, audit page, /api/families/children POST) matches that raw string against
      family_memberships.identityId which is a UUID from kreds_identities. These queries
      always return nothing for any authenticated user who already has a family — effectively
      breaking all post-creation flows. This is CR-01.
    artifacts:
      - path: "src/lib/auth/authorization.ts"
        issue: "requireAuthenticatedIdentity sets identity.id = zitadelSub (line 52). dbLookup then passes this as identityId to match family_memberships.identityId (UUID column). Match will never succeed."
      - path: "src/app/api/families/route.ts"
        issue: "GET handler queries family_memberships.identityId = identity.id (line 32) — will always return empty for existing guardians."
      - path: "src/app/family/onboarding/page.tsx"
        issue: "Line 34: existingMemberships lookup uses identity.id (zitadelSub) against UUID column — always empty, so existing guardians are never redirected away."
      - path: "src/app/family/children/page.tsx"
        issue: "Line 43: membership lookup uses identity.id (zitadelSub) against UUID column — always empty, redirects to onboarding even for guardians with a family."
      - path: "src/app/family/audit/page.tsx"
        issue: "Line 64: membership lookup uses session.user.id (zitadelSub) against UUID column. Line 79: listFamilyAuditTimeline receives zitadelSub as identityId."
      - path: "src/app/api/families/children/route.ts"
        issue: "Line 38: membership lookup uses identity.id (zitadelSub) against UUID column — returns no family, always 400."
      - path: "src/app/api/families/invitations/route.ts"
        issue: "Lines 72, 135: guardian membership lookups use identity.id (zitadelSub) against UUID column — always 403 for create and revoke actions."
    missing:
      - "requireAuthenticatedIdentity must resolve zitadelSub to the local UUID by querying kreds_identities WHERE zitadel_subject = zitadelSub and return the UUID as identity.id. The zitadelSub should remain available on identity.zitadelSub."
      - "Alternatively, every call site must do its own zitadelSubject-to-UUID resolution before querying family_memberships."
  - truth: "Parent can invite or register another guardian and create child profiles without public child self-registration."
    status: partial
    reason: |
      Invitation DECLINE case in /api/families/invitations has no authentication check (CR-03).
      Any unauthenticated caller with a valid token string can decline an invitation.
      Additionally, the revoke case does not validate that the invitation being revoked belongs
      to the revoking guardian's family (CR-02) — a guardian from family A could revoke
      invitations from family B by guessing invitation IDs.
      Child profile creation structure is correct but unusable due to CR-01.
    artifacts:
      - path: "src/app/api/families/invitations/route.ts"
        issue: "Lines 192-215: decline case has no requireAuthenticatedIdentity call — unauthenticated callers can decline invitations. (CR-03)"
      - path: "src/app/api/families/invitations/route.ts"
        issue: "Lines 128-149: revoke case fetches guardian memberships[0].familyId but does not pass it to revokeInvitation. revokeInvitation does not validate invitation.familyId == guardian's familyId. (CR-02)"
      - path: "src/lib/families/invitations.ts"
        issue: "Lines 394-441: revokeInvitation matches only on invitationId and status='pending' — no family isolation check."
    missing:
      - "Add requireAuthenticatedIdentity check at the top of the decline case."
      - "Pass the guardian's familyId to revokeInvitation and add a check: eq(schema.guardianInvitations.familyId, familyId) in the where clause."
human_verification:
  - test: "Confirm ZITADEL live login actually redirects back and creates session with user.id set to ZITADEL sub"
    expected: "Auth.js session has user.id = ZITADEL sub value (e.g. the sub claim from OIDC token)"
    why_human: "Requires live ZITADEL credentials and browser session — cannot verify programmatically without configured env vars"
  - test: "After family creation, navigate to /family/children and verify the children page loads (not redirect to onboarding)"
    expected: "Children page shows active children list and creation form — not a redirect to /family/onboarding"
    why_human: "Requires live ZITADEL session and database. Also confirms whether CR-01 fix (if applied) resolves post-creation routing."
  - test: "Attempt to decline an invitation without being signed in (unauthenticated POST to /api/families/invitations with action=decline and a valid token)"
    expected: "Should return 401 Unauthorized — currently returns 200 (CR-03 confirmed)"
    why_human: "Demonstrates the security gap in a running environment"
---

# Phase 02: Family Access, Tenancy, Roles, and Profiles — Verification Report

**Phase Goal:** Parents can authenticate through ZITADEL and create isolated family accounts with guardians, children, roles, profile identifiers, and audit visibility.
**Verified:** 2026-06-07T04:00:00Z
**Status:** GAPS FOUND — 2 blockers, 1 warning
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Parent can authenticate through ZITADEL, create a family account, and all family-scoped data is isolated by `family_id`. | PARTIAL | Auth config is correct. Family creation works. But identity.id = zitadelSub causes all post-creation membership lookups to return nothing (CR-01 — BLOCKER). |
| 2 | Parent can invite or register another guardian and create child profiles without public child self-registration. | PARTIAL | Invitation structure exists. Child profile creation structure is correct. But: decline is unauthenticated (CR-03 — BLOCKER), revoke has no family-scope check (CR-02 — WARNING), and all routes broken by CR-01. |
| 3 | Parent can assign Kreds guardian or child roles stored in the domain model, and family members only see data from their own family. | VERIFIED | Schema: family_role enum, family_memberships with role+status, family_id on all tables, check constraint one_member_target. Role constants (guardian/child) stored in Kreds DB not ZITADEL claims. Design is correct; CR-01 means runtime queries don't work. |
| 4 | Parent can customize child profiles with simple avatars or visual identifiers. | VERIFIED | avatar-presets.ts: closed Sylvan set (6 avatars, 6 accents), as const, type guards, no photo/URL/file/camera. createChildProfile validates closed sets. children page renders selector. |
| 5 | Parent can review an audit trail for identity, membership, and profile changes. | VERIFIED | audit.ts: listFamilyAuditTimeline (membership-gated, family_id-filtered, sanitized metadata). sanitizeAuditMetadata strips 6 forbidden key types. audit/page.tsx: chronological timeline with readable labels. |

**Score: 3/5 truths verified** (Truths 3, 4, 5 verified structurally; Truths 1 and 2 partial due to runtime bugs)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `auth.ts` | ZITADEL Auth.js config | VERIFIED | ZITADEL provider, JWT strategy, sub preserved in token.sub, email_verified gate, trustHost |
| `src/app/api/auth/[...nextauth]/route.ts` | App Router GET/POST handlers | VERIFIED | Exports GET/POST from auth.ts handlers |
| `src/lib/env.ts` | Auth env vars validated | VERIFIED | AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER via Zod |
| `src/lib/auth/authorization.ts` | requireAuthenticatedIdentity, requireActiveGuardian, requireFamilyMember | STUB (CR-01) | Functions exist and are substantive but identity.id = zitadelSub — DB lookups against UUID column will always fail at runtime |
| `src/lib/auth/session.ts` | Session wrapper | VERIFIED | getSession() and getZitadelSub() wrappers |
| `src/lib/db/schema/index.ts` | 7 tables, 3 enums, family_id indexes | VERIFIED | identities, families, family_memberships, guardian_invitations, child_profiles, family_audit_events, parental_consents with all indexes and constraints |
| `drizzle/0001_omniscient_scarlet_spider.sql` | Phase 02 migration | VERIFIED | 95-line migration with all CREATE TYPE, CREATE TABLE, indexes |
| `src/lib/families/commands.ts` | createFamilyForGuardian transactional | VERIFIED | Correct: upserts by zitadelSubject, gets UUID, creates family+membership+audit atomically |
| `src/lib/families/audit.ts` | createAuditEvent, listFamilyAuditTimeline, sanitizeAuditMetadata | VERIFIED | All three implemented. FORBIDDEN_METADATA_KEYS set. Guardian-gated timeline query with family_id filter. |
| `src/lib/families/avatar-presets.ts` | Closed Sylvan sets | VERIFIED | 6 avatars, 6 accents, as const, type guards, no photo/URL semantics |
| `src/lib/families/child-profiles.ts` | createChildProfile, updateChildProfile, deactivateChildProfile, listActiveChildProfiles | VERIFIED (design) | All four commands. Transactional. Consent required. Soft deactivation. CR-01 means guardianIdentityId (zitadelSub) won't match UUID identityId column. |
| `src/lib/families/invitations.ts` | Full invitation lifecycle | VERIFIED (design) | Create/accept/decline/revoke/expire with SHA-256 token hash, state machine, audit events |
| `src/app/api/families/route.ts` | Membership-filtered GET + POST | VERIFIED (design) | GET: membership-checked. POST: createFamilyForGuardian. CR-01 breaks GET at runtime. |
| `src/app/api/families/children/route.ts` | Guardian-gated child creation | VERIFIED (design) | Auth gate, consent validation, family scoped. CR-01 breaks membership lookup. |
| `src/app/api/families/invitations/route.ts` | Invitation lifecycle API | PARTIAL | create/revoke/accept all gate on auth. decline case MISSING auth check (CR-03). revoke MISSING family-scope check on invitation (CR-02). |
| `src/app/family/onboarding/page.tsx` | Family creation UI | VERIFIED (design) | Auth gate, family name + timezone form, redirect to /family/children on success |
| `src/app/family/children/page.tsx` | Children list + consent form | VERIFIED (design) | Auth gate, consent checkbox, avatar/accent selectors, active list, deactivation. CR-01 breaks membership lookup. |
| `src/app/family/invitations/page.tsx` | Guardian invitation management | VERIFIED (design) | Guardian-gated, invite form, status list, revoke. requireActiveGuardian imported but not called (inline query used instead — same CR-01 exposure). |
| `src/app/family/invitations/accept/[token]/page.tsx` | Authenticated acceptance UI | VERIFIED | Auth gate with ZITADEL redirect, accept/decline forms shown only after auth |
| `src/app/family/audit/page.tsx` | Guardian audit timeline UI | VERIFIED (design) | Auth gate, membership check, listFamilyAuditTimeline, readable labels, empty state. CR-01 affects membership lookup. |
| `tests/unit/family-authorization.test.ts` | Auth predicate tests | VERIFIED | 26 tests covering authorization predicates, ZITADEL mapping, cross-family isolation |
| `tests/unit/family-constants.test.ts` | Avatar/accent constant tests | VERIFIED | 14 tests covering closed-set validation |
| `tests/unit/family-invitations.test.ts` | Invitation lifecycle unit tests | VERIFIED | 17 tests covering status predicates, lifecycle transitions, token hashing |
| `tests/integration/family-tenancy.test.ts` | Schema integration tests | VERIFIED (scaffolded) | 18 tests; skipped due to Docker/Testcontainers unavailability |
| `tests/integration/family-child-profiles.test.ts` | Child profile integration tests | VERIFIED (scaffolded) | 17 tests; skipped due to Docker |
| `tests/integration/family-invitations.test.ts` | Invitation integration tests | VERIFIED (scaffolded) | 18 tests; skipped due to Docker |
| `tests/integration/family-audit-isolation.test.ts` | Cross-family isolation tests | VERIFIED (scaffolded) | 15 tests; skipped due to Docker |
| `tests/e2e/family-access.spec.ts` | Unauthenticated denial smoke tests | VERIFIED (scaffolded) | 11 tests; run via pnpm test:e2e |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `auth.ts` | `src/app/api/auth/[...nextauth]/route.ts` | `handlers` export | WIRED | Route exports GET/POST from auth.ts handlers |
| `requireAuthenticatedIdentity` | `family_memberships.identityId` | `identity.id` | BROKEN | identity.id = zitadelSub (string), column is UUID. CR-01. |
| `createFamilyForGuardian` | `kreds_identities.zitadel_subject` | `zitadelSub` lookup | WIRED | Correctly uses zitadelSubject for upsert, returns UUID |
| `src/app/family/onboarding/page.tsx` | `/api/families` POST | HTML form action | WIRED | Form submits to /api/families |
| `src/app/family/children/page.tsx` | `createChildProfile` | `listActiveChildProfiles` import | WIRED | Calls listActiveChildProfiles(familyId) |
| `src/app/family/audit/page.tsx` | `listFamilyAuditTimeline` | import + call | WIRED | Calls with identityId (zitadelSub) — mismatch per CR-01 |
| `invitations/route.ts` | `revokeInvitation` | no familyId arg | BROKEN | CR-02: invitation revoke has no family scope enforcement |
| `invitations/route.ts` decline case | `requireAuthenticatedIdentity` | not called | BROKEN | CR-03: no auth check before declineInvitation |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `GET /api/families` | `memberships` | `db.select().from(familyMemberships).where(identityId = identity.id)` | NO — identity.id is zitadelSub, not UUID | HOLLOW (CR-01) |
| `family/children/page.tsx` | `children` | `listActiveChildProfiles(familyId)` | NO — familyId derived from broken membership lookup | HOLLOW (CR-01) |
| `family/audit/page.tsx` | `timeline` | `listFamilyAuditTimeline(identityId, familyId)` | NO — identityId is zitadelSub, membership check fails | HOLLOW (CR-01) |
| `family/invitations/page.tsx` | `invitations` | `db.select().from(guardianInvitations).where(familyId)` | NO — familyId from broken membership lookup | HOLLOW (CR-01) |
| `createFamilyForGuardian` | `identityId` | `kreds_identities` upsert by zitadelSubject | YES — real UUID returned | FLOWING |
| `acceptInvitation` | `kredsIdentityId` | `kreds_identities` upsert by zitadelSubject | YES — correctly resolves zitadelSub to UUID | FLOWING |

---

## Behavioral Spot-Checks

Integration and E2E tests require Docker/Testcontainers which is unavailable in this environment. Unit tests pass (66/66). Build compiles cleanly.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests pass | `pnpm test -- tests/unit/` | 66/66 pass (per SUMMARY) | PASS |
| Build compiles | `pnpm build` | Passes, 14 routes registered (per SUMMARY) | PASS |
| Integration tests | `pnpm test -- tests/integration/` | SKIPPED (Docker unavailable) | SKIP |
| E2E tests | `pnpm test:e2e` | SKIPPED (requires live server) | SKIP |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FAM-01 | 02-02, 02-04 | Parent authenticates via ZITADEL, creates family with family_id isolation | BLOCKED | Auth config correct. Family creation command correct. All post-creation data flows broken by CR-01 identity key mismatch. |
| FAM-02 | 02-06 | Parent can invite/register another guardian | BLOCKED | Invitation lifecycle structure exists. Decline is unauthenticated (CR-03). Revoke has no family scope (CR-02). All guardian checks broken by CR-01. |
| FAM-03 | 02-05 | Parent creates child profiles, no public self-registration | BLOCKED | createChildProfile command correct. children page correct. CR-01 breaks guardian membership check inside createChildProfile. |
| FAM-04 | 02-03, 02-04 | Kreds guardian/child role stored in domain model (not ZITADEL) | VERIFIED | family_role enum, family_memberships table with role column, not stored in ZITADEL claims. createFamilyForGuardian stores role='guardian'. |
| FAM-05 | 02-03, 02-04 | Family members see only their own family data | BLOCKED | Design correct (family_id on all tables, membership-filtered queries). CR-01 makes all filters use zitadelSub as UUID, always returns empty — paradoxically all families are isolated by returning nothing. |
| FAM-06 | 02-05 | Parent customizes child profiles with simple avatars or visual identifiers | VERIFIED | AVATAR_PRESETS (6), ACCENT_COLORS (6), closed sets with type guards, no photo/URL/camera. |
| FAM-07 | 02-07 | Parent reviews audit trail for identity, membership, profile changes | VERIFIED (design) | audit.ts: listFamilyAuditTimeline, sanitizeAuditMetadata, FORBIDDEN_METADATA_KEYS. audit/page.tsx with readable labels. Broken at runtime by CR-01. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/auth/authorization.ts` | 52 | `id: zitadelSub` — KredsIdentity.id set to ZITADEL sub string, used everywhere as UUID | BLOCKER | Every membership lookup by identityId fails; all post-auth family operations broken |
| `src/app/api/families/invitations/route.ts` | 192–215 | decline case has no `requireAuthenticatedIdentity` call | BLOCKER | Any unauthenticated caller can decline invitations by guessing/obtaining token |
| `src/app/api/families/invitations/route.ts` | 149 | `revokeInvitation(invitationId, identity.id)` — no familyId validation | WARNING | Guardian from family A can revoke any pending invitation regardless of family |
| `src/lib/families/audit.ts` | 161 | `tx: any = db` type annotation | INFO | Lost type safety for transaction parameter — compile still passes |
| `src/app/api/families/invitations/route.ts` | 6 | `requireActiveGuardian` imported but never called | INFO | Import unused; routes use inline DB queries instead |

---

## Human Verification Required

### 1. Live ZITADEL Authentication Flow

**Test:** With real ZITADEL credentials configured, sign in and confirm that `session.user.id` contains the ZITADEL sub value (not null or undefined).
**Expected:** Auth.js JWT callback preserves `profile.sub` as `token.sub`, session callback sets `session.user.id = token.sub`. The sub should be the raw ZITADEL identifier string.
**Why human:** Requires live ZITADEL app registration with valid client ID/secret.

### 2. Post-Creation Flow (confirm CR-01 symptom in browser)

**Test:** Create a family via the onboarding form, then navigate to `/family/children`. Observe whether the page loads the children list or redirects back to onboarding.
**Expected (current behavior before fix):** Redirects to onboarding — because `existingMemberships` lookup in children page uses `identity.id` (zitadelSub) as UUID and returns empty.
**Why human:** Requires live session and database with a created family.

### 3. Unauthenticated Invitation Decline (CR-03)

**Test:** With a valid pending invitation token, send an unauthenticated POST to `/api/families/invitations` with body `{ action: 'decline', token: '<valid-token>' }` (no auth cookies).
**Expected (secure behavior):** 401 Unauthorized. **Current behavior:** 200 OK — invitation is declined without authentication.
**Why human:** Easier to demonstrate in a running environment with a real token.

---

## Gaps Summary

**Two blockers and one warning prevent goal achievement.**

**Root cause of the primary blocker (CR-01):** `requireAuthenticatedIdentity` in `src/lib/auth/authorization.ts` sets `identity.id = zitadelSub`. The ZITADEL sub is a string identifier (e.g., the subject claim from the JWT). However, every database query that uses `identity.id` to find a `family_memberships` row is comparing it against the `identityId` column which holds a UUID from `kreds_identities`. The only code that correctly translates zitadelSub to a UUID is `createFamilyForGuardian` (which queries `kreds_identities WHERE zitadel_subject = zitadelSub`) and `acceptInvitation` (same pattern). All other routes and pages use `identity.id` directly as a UUID — this never matches.

**Fix path for CR-01:** `requireAuthenticatedIdentity` should either (a) additionally look up the local UUID from `kreds_identities` by `zitadelSubject` and set `identity.id` to that UUID, or (b) leave `identity.id = zitadelSub` but update every call site to resolve the UUID first. Option (a) is the cleaner fix.

**Second blocker (CR-03):** The `decline` case in `/api/families/invitations/route.ts` (lines 192–215) calls `declineInvitation(token)` without calling `requireAuthenticatedIdentity(session)` first. The outer `session` variable is set from `auth()` at line 29 but is never checked for this case. This allows unauthenticated callers to decline invitations.

**Warning (CR-02):** `revokeInvitation` in both the command and the API route does not validate that the invitation belongs to the revoking guardian's family. The API route fetches the guardian's familyId from their membership but does not pass it to `revokeInvitation`. The `revokeInvitation` function matches only on `invitationId` and `status='pending'`. A guardian who knows another family's invitation ID can revoke it.

**What is working (design-complete, runtime-blocked by CR-01):**
- ZITADEL auth config (auth.ts): correct sub preservation, email_verified gate
- Schema: all 7 tables, 3 enums, family_id indexes, check constraints — correctly designed
- Family creation (createFamilyForGuardian): correctly resolves zitadelSub to UUID
- Avatar/accent constants: closed Sylvan sets enforced
- Audit metadata sanitization: FORBIDDEN_METADATA_KEYS correctly strips sensitive fields
- Invitation token security: SHA-256 hashing, raw token never stored
- Invitation acceptance: correctly uses zitadelSub to upsert identity
- Unit tests: 66/66 pass (testing pure logic with stubs, not DB integration)

---

_Verified: 2026-06-07T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
