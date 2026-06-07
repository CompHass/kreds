---
phase: 02-family-access-tenancy-roles-and-profiles
verified: 2026-06-07T16:35:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "CR-01: requireAuthenticatedIdentity / all call sites now resolve zitadelSub to Kreds UUID via resolveKredsIdentityId"
    - "CR-02: revoke case pre-validates invitation belongs to guardian's family before calling revokeInvitation"
    - "CR-03: decline case now calls requireAuthenticatedIdentity — unauthenticated declines return 401"
    - "CR-04: verifyInvitationToken now uses crypto.timingSafeEqual for constant-time comparison"
    - "CR-05: unique_pending_invite index has WHERE status = 'pending' partial predicate"
    - "CR-06: createAuditEvent sanitizes metadata on write via sanitizeAuditMetadata before DB insert"
  gaps_closed_post_verification:
    - "UI-01: página inicial (/) agora renderiza tela de autenticação Sylvan completa (gradiente, símbolo Firstfruits, card glass, botão ZITADEL) — substituído placeholder sem estilo"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Confirm ZITADEL live login actually redirects back and creates session with user.id set to ZITADEL sub"
    expected: "Auth.js session has user.id = ZITADEL sub value (e.g. the sub claim from OIDC token)"
    why_human: "Requires live ZITADEL credentials and browser session — cannot verify programmatically without configured env vars"
  - test: "After family creation, navigate to /family/children and verify the children page loads (not redirect to onboarding)"
    expected: "Children page shows active children list and creation form — confirms CR-01 fix resolves post-creation routing in a live environment"
    why_human: "Requires live ZITADEL session and database with an actual family created"
  - test: "Attempt to decline an invitation without being signed in (unauthenticated POST to /api/families/invitations with action=decline and a valid token)"
    expected: "Should return 401 Unauthorized — confirms CR-03 fix is effective at runtime"
    why_human: "Requires a running app with a real pending invitation token"
---

# Phase 02: Family Access, Tenancy, Roles, and Profiles — Re-Verification Report

**Phase Goal:** Parents can authenticate through ZITADEL and create isolated family accounts with guardians, children, roles, profile identifiers, and audit visibility.
**Verified:** 2026-06-07T16:35:00Z
**Status:** HUMAN NEEDED — all automated checks pass; live OIDC/runtime confirmation required
**Re-verification:** Yes — after CR-01 through CR-06 and WR-01 through WR-07 code fixes

---

## Re-Verification Summary

All six blockers and warnings from the initial verification (2026-06-07T04:00:00Z) have been resolved in code:

| Fix ID | Issue | Resolution Verified |
|--------|-------|-------------------|
| CR-01 | `requireAuthenticatedIdentity` set `identity.id = zitadelSub`; membership lookups always failed | `resolveKredsIdentityId` added to `authorization.ts`; called by every route and page before DB membership queries |
| CR-02 | `revokeInvitation` had no family scope check; guardian could revoke another family's invite | Route pre-validates `invitation.familyId == guardianFamilyId` with a DB query before calling `revokeInvitation` |
| CR-03 | Decline case had no auth check; unauthenticated callers could decline invitations | `requireAuthenticatedIdentity(session)` called at top of `decline` case — returns 401 on failure |
| CR-04 | Token comparison used non-constant-time string equality | `verifyInvitationToken` now uses `crypto.timingSafeEqual(Buffer, Buffer)` |
| CR-05 | `unique_pending_invite` index lacked WHERE predicate; blocked re-inviting a previously-declined user | Index now uses `.where(sql\`${table.status} = 'pending'\`)` partial predicate |
| CR-06 | `createAuditEvent` did not sanitize metadata on write; forbidden keys could reach the DB | `createAuditEvent` now calls `sanitizeAuditMetadata` before `tx.insert` |

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Parent can authenticate through ZITADEL, create a family account, and all family-scoped data is isolated by `family_id`. | VERIFIED | `resolveKredsIdentityId` (authorization.ts:26-38) performs `SELECT id FROM kreds_identities WHERE zitadel_subject = $zitadelSub`. All routes and pages (`/api/families`, `/family/children`, `/family/onboarding`, `/family/invitations`, `/family/audit`, `/api/families/children`, `/api/families/invitations`) now call this before membership queries. `createFamilyForGuardian` atomically upserts identity, creates family, creates guardian membership, writes audit event. |
| 2 | Parent can invite or register another guardian and create child profiles without public child self-registration. | VERIFIED | Invitation lifecycle: `createInvitation`, `acceptInvitation`, `declineInvitation`, `revokeInvitation` all present and wired. CR-03 fixed: `decline` case calls `requireAuthenticatedIdentity`. CR-02 fixed: route pre-validates `invitation.familyId == guardianFamilyId` before revoke. Child creation requires active guardian + explicit consent. No public registration path exists. |
| 3 | Parent can assign Kreds guardian or child roles stored in the domain model, and family members only see data from their own family. | VERIFIED | `family_role` enum `('guardian', 'child')` stored in `family_memberships.role`. Roles are stored in Kreds DB, not ZITADEL claims. All data-path queries filter by `family_id`. `family_id` column present on all family-scoped tables with indexes. |
| 4 | Parent can customize child profiles with simple avatars or visual identifiers. | VERIFIED | `avatar-presets.ts`: 6 avatar IDs (`oak-sprout`, `cedar-sapling`, `olive-branch`, `mustard-seed`, `fig-leaf`, `river-stone`), 6 accent colors (`moss`, `gold`, `sky`, `berry`, `clay`, `sage`), all `as const`. Type guards `isValidAvatarPreset` and `isValidAccentColor` used in `createChildProfile` and `updateChildProfile`. No photo/URL/file/camera semantics. |
| 5 | Parent can review an audit trail for identity, membership, and profile changes. | VERIFIED | `listFamilyAuditTimeline` (audit.ts:91): requires active guardian, filters by `family_id`, sanitizes metadata. `createAuditEvent` (audit.ts:163): CR-06 fix — sanitizes on write before DB insert. `FORBIDDEN_METADATA_KEYS` set: `rawToken`, `tokenHash`, `rawDiff`, `fullIdentityPayload`, `token`, `hash`. Audit page renders chronological timeline with readable event labels. |

**Score: 5/5 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `auth.ts` | ZITADEL Auth.js config | VERIFIED | ZITADEL provider, JWT strategy, sub preserved, email_verified gate |
| `src/app/api/auth/[...nextauth]/route.ts` | App Router GET/POST handlers | VERIFIED | Exports GET/POST from auth.ts handlers |
| `src/lib/env.ts` | Auth env vars validated | VERIFIED | AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER via Zod |
| `src/lib/auth/authorization.ts` | `resolveKredsIdentityId`, `requireAuthenticatedIdentity`, `requireActiveGuardian`, `requireFamilyMember` | VERIFIED | `resolveKredsIdentityId` (lines 26-38) queries `kreds_identities WHERE zitadel_subject = zitadelSub` and returns UUID. `requireAuthenticatedIdentity` returns `{ id: zitadelSub, zitadelSub, ... }` — callers resolve UUID via `resolveKredsIdentityId`. |
| `src/lib/auth/session.ts` | Session wrapper | VERIFIED | `getSession()` and `getZitadelSub()` wrappers |
| `src/lib/db/schema/index.ts` | 7 tables, 3 enums, family_id indexes | VERIFIED | `identities`, `families`, `familyMemberships`, `guardianInvitations`, `childProfiles`, `familyAuditEvents`, `parentalConsents` with all enums, indexes, and constraints |
| `drizzle/0001_omniscient_scarlet_spider.sql` | Phase 02 migration | VERIFIED | 95-line migration with all CREATE TYPE, CREATE TABLE, indexes |
| `src/lib/families/commands.ts` | `createFamilyForGuardian` transactional | VERIFIED | Upserts by `zitadelSubject`, gets UUID, creates family + membership + audit atomically |
| `src/lib/families/audit.ts` | `createAuditEvent`, `listFamilyAuditTimeline`, `sanitizeAuditMetadata` | VERIFIED | CR-06 confirmed: `createAuditEvent` line 169 calls `sanitizeAuditMetadata(input.metadata ?? {})` before insert. `FORBIDDEN_METADATA_KEYS` set with 6 keys. |
| `src/lib/families/avatar-presets.ts` | Closed Sylvan sets | VERIFIED | 6 avatars, 6 accents, `as const`, type guards |
| `src/lib/families/child-profiles.ts` | `createChildProfile`, `updateChildProfile`, `deactivateChildProfile`, `listActiveChildProfiles` | VERIFIED | All four commands. Transactional. Consent required. Soft deactivation. Guardian membership check using `guardianIdentityId` (caller must pass resolved UUID). |
| `src/lib/families/invitations.ts` | Full invitation lifecycle + `verifyInvitationToken` with `timingSafeEqual` | VERIFIED | CR-04 confirmed: lines 82-85 use `crypto.timingSafeEqual(computed, stored)`. CR-05 confirmed: `uniquePendingInvite` index line 127-129 has `.where(sql\`${table.status} = 'pending'\`)`. |
| `src/app/api/families/route.ts` | Membership-filtered GET + POST | VERIFIED | GET: calls `resolveKredsIdentityId` then queries `family_memberships WHERE identityId = kredsIdentityId`. POST: `createFamilyForGuardian` with `zitadelSub`. |
| `src/app/api/families/children/route.ts` | Guardian-gated child creation | VERIFIED | Calls `resolveKredsIdentityId`, then membership query by UUID, then `createChildProfile` with `kredsIdentityId`. |
| `src/app/api/families/invitations/route.ts` | Invitation lifecycle API — all four actions authenticated | VERIFIED | CR-02: revoke pre-validates `invitation.familyId == guardianFamilyId` (lines 177-193). CR-03: decline calls `requireAuthenticatedIdentity(session)` (lines 242-246). All four cases authenticated. |
| `src/app/family/onboarding/page.tsx` | Family creation UI | VERIFIED | Calls `resolveKredsIdentityId` (try/catch for first visit), then membership check using `kredsIdentityId`. Redirects existing guardians to `/family/children`. |
| `src/app/family/children/page.tsx` | Children list + consent form | VERIFIED | Calls `resolveKredsIdentityId` (redirects to onboarding on failure), then membership query by UUID, then `listActiveChildProfiles(familyId)`. |
| `src/app/family/invitations/page.tsx` | Guardian invitation management | VERIFIED | Calls `resolveKredsIdentityId`, then guardian membership query by UUID. Token hash excluded from invitation list query (WR-05). |
| `src/app/family/invitations/accept/[token]/page.tsx` | Authenticated acceptance UI | VERIFIED | Auth gate with ZITADEL redirect, accept/decline forms |
| `src/app/family/audit/page.tsx` | Guardian audit timeline UI | VERIFIED | Calls `resolveKredsIdentityId`, then membership check, then `listFamilyAuditTimeline(kredsIdentityId, membership.familyId)`. Readable event labels, empty state. |
| `tests/unit/family-authorization.test.ts` | Auth predicate tests | VERIFIED | 66/66 unit tests pass |
| `tests/unit/family-constants.test.ts` | Avatar/accent constant tests | VERIFIED | Part of 66 passing unit tests |
| `tests/unit/family-invitations.test.ts` | Invitation lifecycle unit tests | VERIFIED | Part of 66 passing unit tests |
| `tests/integration/family-tenancy.test.ts` | Schema integration tests | VERIFIED (scaffolded) | 18 tests; skipped — Docker/Testcontainers unavailable |
| `tests/integration/family-child-profiles.test.ts` | Child profile integration tests | VERIFIED (scaffolded) | 17 tests; skipped — Docker unavailable |
| `tests/integration/family-invitations.test.ts` | Invitation integration tests | VERIFIED (scaffolded) | 18 tests; skipped — Docker unavailable |
| `tests/integration/family-audit-isolation.test.ts` | Cross-family isolation tests | VERIFIED (scaffolded) | 15 tests; skipped — Docker unavailable |
| `tests/e2e/family-access.spec.ts` | Unauthenticated denial smoke tests | VERIFIED (scaffolded) | 11 tests; skipped — requires live server |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `auth.ts` | `src/app/api/auth/[...nextauth]/route.ts` | `handlers` export | WIRED | Route exports GET/POST from auth.ts handlers |
| `resolveKredsIdentityId` | `kreds_identities.zitadel_subject` | `eq(identities.zitadelSubject, zitadelSub)` | WIRED | authorization.ts lines 28-30: `SELECT id FROM kreds_identities WHERE zitadel_subject = $sub` |
| `requireAuthenticatedIdentity` | all call sites | `identity.zitadelSub` → `resolveKredsIdentityId` | WIRED | Every route/page calls `resolveKredsIdentityId(identity.zitadelSub)` before DB membership queries |
| `createFamilyForGuardian` | `kreds_identities.zitadel_subject` | `zitadelSub` lookup | WIRED | Correctly uses `zitadelSubject` for upsert, returns UUID |
| `src/app/family/onboarding/page.tsx` | `/api/families` POST | HTML form action | WIRED | Form submits to /api/families |
| `src/app/family/children/page.tsx` | `createChildProfile` via `/api/families/children` | form action | WIRED | POST to /api/families/children with consent, name, age, avatar, accent |
| `src/app/family/audit/page.tsx` | `listFamilyAuditTimeline` | import + call with UUID | WIRED | Calls `listFamilyAuditTimeline(kredsIdentityId, membership.familyId)` — UUID, not zitadelSub |
| `invitations/route.ts` revoke case | `revokeInvitation` | family scope pre-validated | WIRED | Lines 177-193 verify `invitation.familyId == guardianFamilyId` before calling `revokeInvitation` |
| `invitations/route.ts` decline case | `requireAuthenticatedIdentity` | called before `declineInvitation` | WIRED | Lines 242-246: `requireAuthenticatedIdentity(session)` with 401 on failure |
| `createAuditEvent` | `sanitizeAuditMetadata` | called on write | WIRED | Line 169: `const safeMetadata = sanitizeAuditMetadata(input.metadata ?? {})` before insert |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `GET /api/families` | `memberships` | `db.select().from(familyMemberships).where(identityId = kredsIdentityId)` | YES — UUID resolved by `resolveKredsIdentityId` | FLOWING |
| `family/children/page.tsx` | `children` | `listActiveChildProfiles(familyId)` | YES — `familyId` from membership row keyed by `kredsIdentityId` | FLOWING |
| `family/audit/page.tsx` | `timeline` | `listFamilyAuditTimeline(kredsIdentityId, membership.familyId)` | YES — UUID passed, membership check passes | FLOWING |
| `family/invitations/page.tsx` | `invitations` | `db.select().from(guardianInvitations).where(familyId)` | YES — `familyId` from guardian membership row keyed by `kredsIdentityId` | FLOWING |
| `createFamilyForGuardian` | `identityId` | `kreds_identities` upsert by `zitadelSubject` | YES — real UUID returned | FLOWING |
| `acceptInvitation` | `kredsIdentityId` | `kreds_identities` upsert by `zitadelSubject` | YES — correctly resolves zitadelSub to UUID | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests pass | `pnpm vitest run tests/unit/` | 66/66 pass | PASS |
| Build compiles | `pnpm build` | Passes — 14 routes registered (ƒ dynamic) | PASS |
| Integration tests | Require Docker/Testcontainers | SKIPPED — Docker unavailable in this environment | SKIP |
| E2E tests | Require live server | SKIPPED — requires live server | SKIP |

---

## Probe Execution

No probes defined for this phase. Step 7c: SKIPPED (no `scripts/*/tests/probe-*.sh` files).

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FAM-01 | 02-02, 02-04 | Parent authenticates via ZITADEL, creates family with `family_id` isolation | SATISFIED | Auth config correct. `createFamilyForGuardian` correct. `resolveKredsIdentityId` fixes all post-creation data flows. All routes resolve UUID before membership queries. |
| FAM-02 | 02-06 | Parent can invite or register another guardian | SATISFIED | Invitation lifecycle complete. CR-03 fix: decline authenticated. CR-02 fix: revoke family-scoped. All guardian checks use resolved UUID. |
| FAM-03 | 02-05 | Parent creates child profiles, no public self-registration | SATISFIED | `createChildProfile` requires active guardian + explicit consent. `/api/families/children` resolves UUID before membership check. No public registration path. |
| FAM-04 | 02-03, 02-04 | Kreds guardian/child role stored in domain model (not ZITADEL) | SATISFIED | `family_role` enum, `family_memberships` table with `role` column, stored in Kreds DB not ZITADEL claims. |
| FAM-05 | 02-03, 02-04 | Family members see only their own family data | SATISFIED | `family_id` on all family-scoped tables. All queries filter by membership-derived `familyId`. CR-01 fix ensures membership lookups return actual data (UUID key match). |
| FAM-06 | 02-05 | Parent customizes child profiles with simple avatars or visual identifiers | SATISFIED | `AVATAR_PRESETS` (6 Sylvan IDs), `ACCENT_COLORS` (6), closed sets with type guards, no photo/URL/camera semantics. |
| FAM-07 | 02-07 | Parent reviews audit trail for identity, membership, profile changes | SATISFIED | `listFamilyAuditTimeline`: active-guardian-gated, `family_id`-filtered, sanitized metadata. `createAuditEvent` sanitizes on write (CR-06). Audit page with readable labels. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/auth/authorization.ts` | 79 | `identity.id = zitadelSub` — `KredsIdentity.id` still equals the ZITADEL sub string, not UUID | INFO | By design: `resolveKredsIdentityId` is the resolution mechanism. All callers correctly use `identity.zitadelSub` as input to `resolveKredsIdentityId`. Not a blocker — the pattern is documented at the top of the file. |
| `src/lib/families/audit.ts` | 166 | `tx: any = db` type annotation | INFO | Lost type safety for transaction parameter — compile still passes. Consistent pattern across all command files. |
| `src/lib/families/invitations.ts` | 144,215 | `tx: any` parameter annotations | INFO | Same pattern as above — all command files use `any` for Drizzle transaction typing. |
| `src/lib/families/invitations.ts` | `revokeInvitation` | Command-layer `revokeInvitation` does not enforce family isolation itself | INFO | The route layer pre-validates family scope (CR-02 fix). The command is not fully defensive, but the API boundary is correctly protected. Lower-risk since the command is not a public API. |

No blocker anti-patterns found. No unresolved debt markers (TBD/FIXME/XXX) in phase-modified files.

---

## Human Verification Required

### 1. Live ZITADEL Authentication Flow

**Test:** With real ZITADEL credentials configured (`AUTH_ZITADEL_ID`, `AUTH_ZITADEL_SECRET`, `AUTH_ZITADEL_ISSUER`), sign in and confirm that `session.user.id` contains the ZITADEL sub value.
**Expected:** Auth.js JWT callback preserves `profile.sub` as `token.sub`, session callback sets `session.user.id = token.sub`. The sub should be the raw ZITADEL identifier string, not null or undefined.
**Why human:** Requires live ZITADEL app registration with valid client ID/secret — cannot be verified programmatically in a non-configured environment.

### 2. Post-Creation Flow (CR-01 fix in live environment)

**Test:** Create a family via the onboarding form (`/family/onboarding`), then navigate to `/family/children`. Observe whether the page loads the children list or redirects back to onboarding.
**Expected:** Children page loads with the active children list and creation form. The `resolveKredsIdentityId` call succeeds (identity exists in `kreds_identities` from family creation), the membership lookup using the UUID returns the family, and the page renders.
**Why human:** Requires live ZITADEL session and a running PostgreSQL database with a created family. This is the primary runtime confirmation that CR-01 is working end-to-end.

### 3. Unauthenticated Invitation Decline (CR-03 fix in live environment)

**Test:** With a valid pending invitation token, send an unauthenticated POST to `/api/families/invitations` with body `{ action: 'decline', token: '<valid-token>' }` (no auth cookies).
**Expected:** 401 Unauthorized — confirms `requireAuthenticatedIdentity(session)` in the decline case rejects the request correctly.
**Why human:** Easier to demonstrate in a running environment with a real token. The code is correct; this is runtime confirmation.

---

## Gaps Summary

No gaps remain. All six code-review blockers and warnings from the initial verification have been resolved and verified in the codebase:

- **CR-01** (BLOCKER): `resolveKredsIdentityId` is now exported from `authorization.ts` and called by every route and page that queries `family_memberships` — confirmed at `src/app/api/families/route.ts:24`, `src/app/api/families/children/route.ts:29`, `src/app/api/families/invitations/route.ts:62,140`, `src/app/family/onboarding/page.tsx:34`, `src/app/family/children/page.tsx:39`, `src/app/family/invitations/page.tsx:39`, `src/app/family/audit/page.tsx:62`.
- **CR-02** (WARNING): Revoke case in `invitations/route.ts` lines 177-193 queries `guardianInvitations WHERE id = invitationId AND familyId = guardianFamilyId` before calling `revokeInvitation` — confirmed.
- **CR-03** (BLOCKER): Decline case lines 241-246 calls `requireAuthenticatedIdentity(session)` with `catch` block returning 401 — confirmed.
- **CR-04**: `verifyInvitationToken` lines 82-85 uses `crypto.timingSafeEqual(Buffer.from(...), Buffer.from(...))` — confirmed.
- **CR-05**: `uniquePendingInvite` index in `schema/index.ts` lines 127-129 uses `.where(sql\`${table.status} = 'pending'\`)` — confirmed.
- **CR-06**: `createAuditEvent` line 169 calls `const safeMetadata = sanitizeAuditMetadata(input.metadata ?? {})` before the DB insert — confirmed.

Three human verification items remain (live OIDC flow, post-creation routing, unauthenticated decline) because they require a running application with live ZITADEL credentials and a connected database. All automated checks are clean: 66/66 unit tests pass, build compiles with 14 routes registered, no debt markers, no stub patterns in critical paths.

---

_Verified: 2026-06-07T16:35:00Z_
_Verifier: Claude (gsd-verifier) — Re-verification after CR-01 through CR-06 and WR-01 through WR-07_
