---
phase: 02-family-access-tenancy-roles-and-profiles
fixed_at: 2026-06-07T00:00:00Z
review_path: .planning/phases/02-family-access-tenancy-roles-and-profiles/02-REVIEW.md
iteration: 1
findings_in_scope: 13
fixed: 12
skipped: 1
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-07
**Source review:** `.planning/phases/02-family-access-tenancy-roles-and-profiles/02-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 13 (6 Critical + 7 Warning)
- Fixed: 12
- Skipped: 1 (WR-02 was already resolved as part of CR-01 commit)

## Fixed Issues

### CR-01: Systemic identity key mismatch — all membership lookups fail in production

**Files modified:** `src/lib/auth/authorization.ts`, `src/app/api/families/route.ts`, `src/app/api/families/children/route.ts`, `src/app/api/families/children/deactivate/route.ts`, `src/app/api/families/invitations/route.ts`, `src/app/family/audit/page.tsx`, `src/app/family/children/page.tsx`, `src/app/family/onboarding/page.tsx`, `src/app/family/invitations/page.tsx`
**Commit:** `12a9e8b`
**Applied fix:** Added `resolveKredsIdentityId(zitadelSub)` helper to `authorization.ts` that performs the `kreds_identities` lookup by ZITADEL sub and returns the UUID primary key. Updated all 8 call sites (API routes and Server Component pages) to resolve the UUID immediately after `requireAuthenticatedIdentity()` and use it for all subsequent DB membership queries. The onboarding page handles the case where the identity row does not yet exist (first visit before family creation). Note: CR-02 (cross-family revoke) and CR-03 (unauthenticated decline) were also fixed within this same commit since the invitations route was rewritten as part of the CR-01 fix.

---

### CR-02: Cross-family invitation revoke authorization gap

**Files modified:** `src/app/api/families/invitations/route.ts`
**Commit:** `12a9e8b`
**Applied fix:** Added ownership verification in the `revoke` case: after confirming the requester is an active guardian, the code now queries `guardianInvitations` filtering by both `invitationId` AND the guardian's `familyId`. If no matching invitation is found (it belongs to a different family), returns 404. Applied as part of the CR-01 rewrite of the invitations route.

---

### CR-03: Invitation `decline` action requires no authentication

**Files modified:** `src/app/api/families/invitations/route.ts`
**Commit:** `12a9e8b`
**Applied fix:** Added `requireAuthenticatedIdentity(session)` call at the start of the `decline` case with a 401 return on failure. Applied as part of the CR-01 rewrite of the invitations route.

---

### CR-04: Timing-unsafe token comparison in `verifyInvitationToken`

**Files modified:** `src/lib/families/invitations.ts`
**Commit:** `29e852f`
**Applied fix:** Replaced `hashInvitationToken(token) === hash` with `crypto.timingSafeEqual` using `Buffer.from(..., 'hex')` on both sides, with a length check before comparison to avoid throwing on mismatched buffer lengths.

---

### CR-05: `unique_pending_invite` constraint blocks re-inviting previously used emails

**Files modified:** `drizzle/0001_omniscient_scarlet_spider.sql`, `src/lib/db/schema/index.ts`
**Commit:** `05c1365`
**Applied fix:** Added `WHERE status = 'pending'` partial predicate to the SQL migration index definition. Updated the Drizzle schema's `uniqueIndex` to chain `.where(sql\`${table.status} = 'pending'\`)`. This allows a new invitation to be created for a family+email pair after any terminal state (accepted, revoked, declined, expired).

---

### CR-06: `createAuditEvent` stores raw sensitive metadata without sanitization on write

**Files modified:** `src/lib/families/audit.ts`
**Commit:** `23a7f17`
**Applied fix:** Added `sanitizeAuditMetadata(input.metadata ?? {})` call at the top of `createAuditEvent` and passed `safeMetadata` to the `values()` insert. Forbidden keys (rawToken, tokenHash, etc.) are now stripped before reaching the database, not only at read time.

---

### WR-01: Children routes fetch membership without role or status filter

**Files modified:** `src/app/api/families/children/route.ts`, `src/app/api/families/children/deactivate/route.ts`
**Commit:** `38825eb`
**Applied fix:** Added `and()` conditions with `eq(role, 'guardian')` and `eq(status, 'active')` to both membership queries, added `and` to the `drizzle-orm` import in both files.

---

### WR-03: `POST /api/families` catches all errors and returns 400 leaking messages

**Files modified:** `src/app/api/families/route.ts`
**Commit:** `84d5a70`
**Applied fix:** Replaced the blanket `err.message` return with targeted handling: auth errors (message starts with "Authentication required") return 401; all other errors return 500 with a generic "Failed to create family" message without leaking internal details.

---

### WR-04: Internal error message exposed to the browser in `audit/page.tsx`

**Files modified:** `src/app/family/audit/page.tsx`
**Commit:** `3bd250b`
**Applied fix:** Replaced `<p>{err.message}</p>` with `<p>An error occurred loading your audit history. Please try again later.</p>`. Changed catch clause from `catch (err: any)` to `catch` to eliminate the unused binding.

---

### WR-05: `invitations/page.tsx` fetches all columns including `token_hash`

**Files modified:** `src/app/family/invitations/page.tsx`
**Commit:** `3b8cd5a`
**Applied fix:** Replaced `.select()` (all columns) with an explicit column map that includes `id`, `email`, `status`, `invitedByIdentityId`, `acceptedByIdentityId`, `expiresAt`, and `createdAt`, omitting `token_hash` and `familyId`.

---

### WR-06: Invitation email not validated for format in the API layer

**Files modified:** `src/app/api/families/invitations/route.ts`
**Commit:** `370dc95`
**Applied fix:** Added `emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/` format check after the presence check in the `create` case. Returns 400 with "Invalid email address format" if the regex does not match.

---

### WR-07: `parseInt` on `ageYears` silently accepts mixed-type strings

**Files modified:** `src/app/api/families/children/route.ts`
**Commit:** `2bbba44`
**Applied fix:** Added `/^\d+$/.test(rawAge)` check before `parseInt`. If the raw string does not consist entirely of digits, returns 400 with "Age must be a whole number". Extracted `ageYears` as a named variable to pass cleanly to `createChildProfile`.

---

## Skipped Issues

### WR-02: `if (!identity)` dead code after `requireAuthenticatedIdentity`

**File:** `src/app/api/families/route.ts:21-23`, `src/app/api/families/invitations/route.ts:52-54, 114-116, 159-161`
**Reason:** Already resolved as part of the CR-01 fix. The `if (!identity)` dead-code guards in `route.ts` were removed during the CR-01 refactor of that file, and the invitations route was rewritten from scratch in the same commit eliminating all dead guards. No separate commit needed.
**Original issue:** `requireAuthenticatedIdentity` always throws on failure, so the `if (!identity)` guard after every call is unreachable dead code; auth errors in the invitations switch were being caught and returned as 400 instead of 401.

---

_Fixed: 2026-06-07_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
