---
phase: 02-family-access-tenancy-roles-and-profiles
reviewed: 2026-06-07T00:00:00Z
depth: standard
files_reviewed: 32
files_reviewed_list:
  - docs/PRIVACY-INVENTORY.md
  - drizzle/0001_omniscient_scarlet_spider.sql
  - drizzle/meta/0001_snapshot.json
  - drizzle/meta/_journal.json
  - src/app/api/auth/[...nextauth]/route.ts
  - src/app/api/families/children/deactivate/route.ts
  - src/app/api/families/children/route.ts
  - src/app/api/families/invitations/route.ts
  - src/app/api/families/route.ts
  - src/app/family/audit/page.tsx
  - src/app/family/children/page.tsx
  - src/app/family/invitations/accept/[token]/page.tsx
  - src/app/family/invitations/page.tsx
  - src/app/family/onboarding/page.tsx
  - src/app/page.tsx
  - src/lib/auth/authorization.ts
  - src/lib/auth/session.ts
  - src/lib/db/schema/index.ts
  - src/lib/env.ts
  - src/lib/families/audit.ts
  - src/lib/families/avatar-presets.ts
  - src/lib/families/child-profiles.ts
  - src/lib/families/commands.ts
  - src/lib/families/invitations.ts
  - src/lib/families/timezones.ts
  - tests/e2e/family-access.spec.ts
  - tests/integration/family-audit-isolation.test.ts
  - tests/integration/family-child-profiles.test.ts
  - tests/integration/family-invitations.test.ts
  - tests/integration/family-tenancy.test.ts
  - tests/unit/family-authorization.test.ts
  - tests/unit/family-constants.test.ts
  - tests/unit/family-invitations.test.ts
findings:
  critical: 6
  warning: 7
  info: 5
  total: 18
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-07
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

Phase 02 implements family tenancy, guardian roles, child profiles, guardian invitations, and the audit timeline. The domain model is well-structured and the authorization helpers are cleanly composable. However, the implementation contains one systemic identity-lookup bug that renders all post-login membership checks non-functional, a cross-family invitation revoke authorization gap, an unauthenticated decline path, a timing-unsafe token comparison, and a uniqueness constraint that permanently blocks re-invitation of previously-used email addresses. Several of these are blockers that would prevent the application from working at all in production.

---

## Critical Issues

### CR-01: Systemic identity key mismatch — all membership lookups fail in production

**File:** `src/lib/auth/authorization.ts:52`

**Issue:** `requireAuthenticatedIdentity` sets `identity.id = zitadelSub` (the raw ZITADEL `sub` string, e.g. `"zitadel|sub-abc-123"`). Every subsequent DB query in every API route and page uses `identity.id` to match against `familyMemberships.identityId`, which is a UUID column that stores the primary key of `kreds_identities`. The ZITADEL sub string and the UUID are different values; the equality will never match, so all authenticated users will be treated as having no family. This affects:

- `GET /api/families` — always returns `{ family: null, needsOnboarding: true }`
- `POST /api/families/children` — always returns "No family found"
- `POST /api/families/children/deactivate` — always returns "No family found"
- `POST /api/families/invitations` (create/revoke) — guardian check always returns 403
- `/family/children`, `/family/onboarding`, `/family/audit`, `/family/invitations` pages — all redirect or show empty state for authenticated users
- The `dbLookup` in `authorization.ts:137` performs `eq(schema.familyMemberships.identityId, identityId)` where `identityId` is a ZITADEL sub string, not a UUID

**Fix:** Every location that passes `identity.id` to a membership query must first resolve the ZITADEL sub to the Kreds identity UUID. Either:

1. Resolve the UUID at the top of each request:
```typescript
// After requireAuthenticatedIdentity():
const [kredsRow] = await db
  .select({ id: schema.identities.id })
  .from(schema.identities)
  .where(eq(schema.identities.zitadelSubject, identity.zitadelSub))
  .limit(1)
if (!kredsRow) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const kredsIdentityId = kredsRow.id
// Use kredsIdentityId (UUID) for all subsequent membership queries
```

2. Or change `KredsIdentity.id` to hold the Kreds UUID after resolving it from the session, and update `requireAuthenticatedIdentity` to accept a Kreds identity record instead of a raw session. This is the deeper fix that eliminates the confusion at the type level.

---

### CR-02: Cross-family invitation revoke — guardian can revoke another family's invitation

**File:** `src/app/api/families/invitations/route.ts:127-149`

**Issue:** The `revoke` action verifies the requester is an active guardian (line 127-145) and retrieves their `familyId`, but never checks that the target `invitationId` belongs to that same family before calling `revokeInvitation`. A guardian from Family A who knows any invitation UUID belonging to Family B can revoke it.

```typescript
// Current: familyId is fetched but NEVER used in the revoke call
const result = await revokeInvitation(invitationId, identity.id)
```

**Fix:** Add an ownership check before passing to `revokeInvitation`, or add the family constraint to `revokeInvitation` itself:

```typescript
// In the revoke case, after fetching memberships[0]:
const guardianFamilyId = memberships[0].familyId

// Verify the invitation belongs to this guardian's family
const [targetInvitation] = await db
  .select({ id: schema.guardianInvitations.id, familyId: schema.guardianInvitations.familyId })
  .from(schema.guardianInvitations)
  .where(
    and(
      eq(schema.guardianInvitations.id, invitationId),
      eq(schema.guardianInvitations.familyId, guardianFamilyId),
    ),
  )
  .limit(1)

if (!targetInvitation) {
  return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
}

const result = await revokeInvitation(invitationId, identity.id)
```

---

### CR-03: Invitation `decline` action requires no authentication

**File:** `src/app/api/families/invitations/route.ts:192-215`

**Issue:** The `decline` case does not call `requireAuthenticatedIdentity` before processing. Any unauthenticated HTTP client that knows (or guesses) a valid invitation token can decline it, preventing the legitimate invitee from accepting. The route-level `session = await auth()` is fetched but never validated for the `decline` path. The comment on line 25 says "any authenticated user" but the code enforces no authentication.

**Fix:**
```typescript
case 'decline': {
  // Must be authenticated — prevents anonymous token-guessing attacks
  const identity = requireAuthenticatedIdentity(session)

  const token = body.token
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }
  // ... rest of decline logic
}
```

---

### CR-04: Timing-unsafe token comparison in `verifyInvitationToken`

**File:** `src/lib/families/invitations.ts:80-82`

**Issue:** `verifyInvitationToken` compares two hex strings using JavaScript's `===` operator, which is subject to timing side-channel attacks. An attacker making many requests could theoretically distinguish valid from invalid prefixes through response time differences.

```typescript
export function verifyInvitationToken(token: string, hash: string): boolean {
  return hashInvitationToken(token) === hash  // not timing-safe
}
```

**Fix:** Use `crypto.timingSafeEqual` with Buffer comparison:

```typescript
export function verifyInvitationToken(token: string, hash: string): boolean {
  const computed = Buffer.from(hashInvitationToken(token), 'hex')
  const stored = Buffer.from(hash, 'hex')
  if (computed.length !== stored.length) return false
  return crypto.timingSafeEqual(computed, stored)
}
```

---

### CR-05: `unique_pending_invite` constraint blocks re-inviting a previously used email address permanently

**File:** `drizzle/0001_omniscient_scarlet_spider.sql:93` and `src/lib/db/schema/index.ts:127-130`

**Issue:** The unique index is defined on `(family_id, email)` with no `WHERE status = 'pending'` partial index predicate. Once any invitation for a given family+email combination reaches a terminal state (accepted, revoked, declined, expired), the constraint still exists, permanently blocking a new invitation to that email address in that family. A co-parent who declines could never be re-invited.

```sql
-- Current: blocks all future invitations regardless of terminal status
CREATE UNIQUE INDEX "unique_pending_invite" ON "guardian_invitations"
  USING btree ("family_id","email");

-- Fix: partial unique index — only one pending invitation per family+email
CREATE UNIQUE INDEX "unique_pending_invite" ON "guardian_invitations"
  USING btree ("family_id","email") WHERE status = 'pending';
```

The Drizzle schema also needs updating to reflect this partial predicate.

---

### CR-06: `createAuditEvent` stores raw sensitive metadata without sanitization on write

**File:** `src/lib/families/audit.ts:158-186`

**Issue:** `createAuditEvent` is documented as "Creates a sanitized audit event" but performs no input sanitization. It stores `input.metadata` verbatim. The `FORBIDDEN_METADATA_KEYS` sanitization only happens at read time in `listFamilyAuditTimeline`. Any caller that passes `rawToken`, `tokenHash`, or `fullIdentityPayload` in metadata will have that data persisted in the database — it is simply hidden from the read API, not prevented from storage. This violates D-18 ("Does NOT store raw technical diffs or full identity payloads").

The integration test at `tests/integration/family-audit-isolation.test.ts:329-340` explicitly passes `rawToken` and `tokenHash` in metadata and only checks that the event was persisted, not that those keys were stripped.

**Fix:** Apply sanitization on write in `createAuditEvent`, not only on read:

```typescript
export async function createAuditEvent(
  input: CreateAuditEventInput,
  tx: any = db,
): Promise<AuditEvent> {
  // Sanitize on write to prevent forbidden keys from reaching the DB at all (D-18)
  const safeMetadata = sanitizeAuditMetadata(input.metadata ?? {})

  const [row] = await tx
    .insert(schema.familyAuditEvents)
    .values({
      // ...
      metadata: safeMetadata,
    })
    .returning({ ... })

  return row as AuditEvent
}
```

---

## Warnings

### WR-01: API routes in `children/route.ts` and `children/deactivate/route.ts` fetch membership without role or status filter

**File:** `src/app/api/families/children/route.ts:35-39`, `src/app/api/families/children/deactivate/route.ts:40-44`

**Issue:** The membership query in both routes selects only `familyId` and filters only by `identityId`. No `role = 'guardian'` or `status = 'active'` filter is applied. A hypothetical child-role member (identity-linked) could bypass this API-layer check. The domain functions (`createChildProfile`, `deactivateChildProfile`) do re-check guardian role inside their transactions, so this is defense-in-depth failure rather than a full bypass — but the double-check gap is a correctness risk if those domain checks are ever changed.

**Fix:**
```typescript
const [membership] = await db
  .select({ familyId: schema.familyMemberships.familyId })
  .from(schema.familyMemberships)
  .where(
    and(
      eq(schema.familyMemberships.identityId, identity.id),
      eq(schema.familyMemberships.role, 'guardian'),
      eq(schema.familyMemberships.status, 'active'),
    ),
  )
  .limit(1)
```

---

### WR-02: `if (!identity)` dead code after `requireAuthenticatedIdentity` — incorrect error handling pattern

**File:** `src/app/api/families/route.ts:21-23`, `src/app/api/families/invitations/route.ts:52-54, 114-116, 159-161`

**Issue:** `requireAuthenticatedIdentity` always throws if authentication fails — it never returns `null`. The `if (!identity)` guard after every call is unreachable dead code. More critically, because the function throws, callers that wrap it in a `try/catch` at the outer level (as in `GET /api/families`) will catch the auth error and return 401 correctly, but in the invitations route the outer `try/catch` at line 223 will catch auth errors for `create`, `revoke`, and `accept` cases and return them as generic 400 errors instead of 401.

**Fix:** Remove the dead `if (!identity)` guards, document that the function throws, and add a top-level auth check outside the switch for routes where all actions require authentication:

```typescript
export async function POST(request: NextRequest) {
  const session = await auth()

  // All invitation actions require authentication
  let identity: KredsIdentity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ...then enter switch
}
```

---

### WR-03: `POST /api/families` catches all errors and returns 400, leaking internal error messages

**File:** `src/app/api/families/route.ts:124-129`

**Issue:** The catch block returns `err.message` directly as the API response body for any `Error` instance. Domain validation messages such as `"ZITADEL sub is required for family creation"` or database-level errors would be exposed to clients.

**Fix:** Distinguish expected user-input errors from unexpected server errors. Use an allowlist of safe messages or a custom error class:

```typescript
} catch (err) {
  if (err instanceof UserInputError) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  // Don't leak internal messages
  return NextResponse.json({ error: 'Failed to create family' }, { status: 500 })
}
```

---

### WR-04: Internal error message exposed to the browser in `audit/page.tsx`

**File:** `src/app/family/audit/page.tsx:85`

**Issue:** When `listFamilyAuditTimeline` throws an unexpected error (e.g., a database connection failure), the raw `err.message` is rendered directly into the HTML page. This could expose internal infrastructure details to any user who encounters a server error.

```tsx
<p>{err.message}</p>  {/* leaks internal DB or application errors */}
```

**Fix:** Replace with a generic user-facing message:
```tsx
<p>An error occurred loading your audit history. Please try again later.</p>
```

---

### WR-05: `invitations/page.tsx` fetches all columns including `token_hash` unnecessarily

**File:** `src/app/family/invitations/page.tsx:68-71`

**Issue:** The page uses `.select()` (no column list) on `guardianInvitations`, which fetches all columns including `token_hash`. While this is a Next.js Server Component and the hash is not rendered in the HTML output, it unnecessarily transfers a sensitive column from the database. If the query result is ever serialized (e.g., passed to a client component or cached in a serialized form), the hash would leak.

**Fix:** Use an explicit column selection that excludes `token_hash`:
```typescript
const invitations = await db
  .select({
    id: schema.guardianInvitations.id,
    email: schema.guardianInvitations.email,
    status: schema.guardianInvitations.status,
    invitedByIdentityId: schema.guardianInvitations.invitedByIdentityId,
    acceptedByIdentityId: schema.guardianInvitations.acceptedByIdentityId,
    expiresAt: schema.guardianInvitations.expiresAt,
    createdAt: schema.guardianInvitations.createdAt,
  })
  .from(schema.guardianInvitations)
  .where(eq(schema.guardianInvitations.familyId, familyId))
  .orderBy(desc(schema.guardianInvitations.createdAt))
```

---

### WR-06: Invitation email not validated for format in the API layer

**File:** `src/app/api/families/invitations/route.ts:57-59`, `src/lib/families/invitations.ts:144-147`

**Issue:** The invitation creation only checks `if (!email)` (presence) and `normalizedEmail` truthiness (non-empty after trim). No email format validation is performed. A guardian can create an invitation with a value like `"not-an-email"` which will be stored and displayed but can never be accepted by a real user through ZITADEL authentication.

**Fix:** Add format validation at the API boundary:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
}
```

---

### WR-07: `parseInt` on `ageYears` silently accepts mixed-type strings like `"8abc"`

**File:** `src/app/api/families/children/route.ts:57`

**Issue:** `parseInt(body.ageYears ?? '0', 10)` will parse `"8abc"` as `8`. The domain validation in `createChildProfile` catches `NaN` (from `""`) but accepts the parsed integer `8` from a malformed string. This is a minor input hygiene gap since the parsed integer is still in-range, but indicates the parsing is not strict.

**Fix:** Reject non-numeric strings before parsing:
```typescript
const rawAge = body.ageYears ?? ''
if (!/^\d+$/.test(rawAge)) {
  return NextResponse.json({ error: 'Age must be a whole number' }, { status: 400 })
}
const ageYears = parseInt(rawAge, 10)
```

---

## Info

### IN-01: `requireActiveGuardian` imported but never used in two files

**File:** `src/app/api/families/invitations/route.ts:6`, `src/app/family/invitations/page.tsx:6`

**Issue:** Both files import `requireActiveGuardian` from `@/lib/auth/authorization` but never call it. The invitations API route uses a manual inline guardian check instead. These are dead imports.

**Fix:** Remove `requireActiveGuardian` from both import statements.

---

### IN-02: `src/lib/auth/session.ts` exports two functions that are never imported anywhere

**File:** `src/lib/auth/session.ts:7-17`

**Issue:** `getSession()` and `getZitadelSub()` are exported but no file in `src/` imports them. All callers use `auth()` from the `auth` module directly. `getZitadelSub` also uses an untyped `any` parameter. This is dead code.

**Fix:** Either remove the file or make it the canonical access point and update callers to use it consistently.

---

### IN-03: `guardianEmail` stored in family creation audit event metadata contradicts D-18

**File:** `src/lib/families/commands.ts:127-130`

**Issue:** The `family.created` audit event stores `guardianEmail: input.email` in its metadata. D-18 states that audit metadata should not include full identity payloads. While the email is not in the `FORBIDDEN_METADATA_KEYS` set (so it passes through `sanitizeAuditMetadata`), persisting a guardian's email address in a queryable audit log is unnecessary for the event's purpose. The email is already on the `kreds_identities` record.

**Fix:** Remove `guardianEmail` from the audit event metadata, or replace with a non-identifying reference such as `guardianIdentityId`.

---

### IN-04: All integration tests use `postgres:18-alpine` which does not exist

**File:** `tests/integration/family-audit-isolation.test.ts:33`, `tests/integration/family-tenancy.test.ts:18`, `tests/integration/family-invitations.test.ts:26`, `tests/integration/family-child-profiles.test.ts:25`

**Issue:** PostgreSQL 18 has not been released (current stable is PostgreSQL 17 as of mid-2026). The Testcontainers image `postgres:18-alpine` will fail to pull, causing every integration test suite to fail in `beforeAll` with a container startup error.

**Fix:** Change to `postgres:17-alpine` or `postgres:16-alpine`:
```typescript
container = await new PostgreSqlContainer('postgres:17-alpine').start()
```

---

### IN-05: Broken verification query in `family-audit-isolation.test.ts`

**File:** `tests/integration/family-audit-isolation.test.ts:346-356`

**Issue:** The test at line 329 ("should write audit events without raw tokens...") attempts to verify the persisted event using a `.where()` clause that evaluates to `undefined` regardless of branch:

```typescript
.where(
  (schema.familyAuditEvents as any).id.equals
    ? undefined
    : undefined,
)
```

Both branches return `undefined`, so the `where()` clause is effectively absent. The test `[persisted]` destructuring will silently match the first row in the table regardless of the event just written, making the persistence assertion meaningless.

**Fix:**
```typescript
const [persisted] = await db
  .select()
  .from(schema.familyAuditEvents)
  .where(eq(schema.familyAuditEvents.id, event.id))

expect(persisted).toBeDefined()
expect(persisted.metadata).not.toHaveProperty('rawToken')
expect(persisted.metadata).not.toHaveProperty('tokenHash')
```

---

_Reviewed: 2026-06-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
