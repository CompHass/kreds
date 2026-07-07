# Phase 12: Native Guardian Login - Research

**Researched:** 2026-07-07
**Domain:** Zitadel Session API v2 + Management API integration with next-auth v5 (Auth.js) Credentials provider, Postgres transactional signup bootstrap
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Secret / service account shape**
- **D-01:** New dedicated Zitadel service account for `IAM_LOGIN_CLIENT` — does NOT reuse `iam-admin`'s credentials. Minimum scope: create user (signup), create session + password check (login), read grants (roles), trigger password reset. Smaller blast radius than reusing a full IAM-admin service account.
- **D-02:** Service account authenticates via JWT-profile key (same mechanism already validated live this session for `iam-admin`) — not a traditional client_secret, since that's how Zitadel service accounts work.
- **D-03:** The entire JSON key becomes the value of a single env var `IAM_LOGIN_CLIENT` (JSON string), parsed/validated in `src/lib/env.ts` with zod — same pattern already used for `PIN_ENCRYPTION_KEY`/`CHILD_SESSION_SECRET`. A parse failure already crashes boot (zod `.parse()` throws), satisfying Requirement 10's fail-closed behavior with no extra code.
- **D-04:** The module that reads `IAM_LOGIN_CLIENT` and makes Session API/Management API calls is `server-only` (same pattern as `src/lib/auth/child-guard.ts`, `src/lib/crypto/pin-cipher.ts`) — never imported by a Client Component.

**Credentials provider integration in `auth.ts`**
- **D-05:** Add a second `Credentials` provider to `auth.ts`'s existing `providers` array, alongside the existing `Zitadel` (OIDC) provider — do not replace it, do not create a separate NextAuth instance.
- **D-06:** The Credentials provider's `authorize()` calls Session API v2 (create session + password check) and, on success, fetches the user's profile (email, email_verified, name) via Management API get-user — returns a `user` object shaped as the `jwt`/`session` callbacks already expect (same fields used today: `sub`/`email`/`email_verified`/`name`).
- **D-07:** The existing `jwt` callback (today only handles `profile?.sub` from the OIDC flow) gains a parallel branch for the Credentials flow, using `account?.provider === 'credentials'` to differentiate. The `kreds_identities` upsert logic (today only inside the OIDC branch) is extracted into a shared helper used by both branches — avoids duplicating the sync logic.
- **D-08:** The `systemRoles` fetch via Management API grants runs inside the Credentials branch of the `jwt` callback, inside a non-blocking try/catch (same pattern as the identities upsert) — failure never blocks login (Requirement 3 of SPEC.md).
- **D-09:** The generic error message (Requirement 2 of SPEC.md) is implemented by throwing a custom error inside `authorize()` with a fixed message ("E-mail ou senha inválidos") for BOTH cases (email not found, wrong password) — next-auth propagates this message to the client via `signIn()`'s return/throw.

**Signup flow**
- **D-10:** New `/signup` route (same level as `/login`, `/login/reset`) — Server Component page + Client Component form, same SSR-page/client-view pattern used in `/family/[familyId]/tasks` and `/children`.
- **D-11:** Form fields: email, password, confirm password (client-side-only "match" validation — Zitadel never receives the confirmation, only the final password). NO family-name field in the initial form — family name gets a `'Família'` fallback (same fallback pattern already used for the 05-04 breadcrumb).
- **D-12:** New Server Action `src/app/actions/guardian-signup.ts` (name mirrors `guardian-auth.ts`) containing the full logic: 1) create Zitadel user via Management API, 2) check for a pending invite by email, 3a) if an invite exists: attach to the invited family; 3b) if not: single Postgres transaction creating `kreds_identities` + `families` (name `'Família'`) + `family_memberships` (`role='guardian'`), 4) internally call `signIn('credentials', ...)` to log the user in immediately.
- **D-13:** Self-healing (Requirement 7 of SPEC.md) lives INSIDE the same shared helper from D-07 — every time the `jwt` callback runs (Credentials OR OIDC login), it checks whether the identity has at least one active `family_memberships` row; if not, it attempts to create one (same bootstrap logic as D-12, idempotent). No separate job/cron — runs inline on the next successful login, same spirit as the existing identities upsert.
- **D-14:** The "Criar conta" link in `guardian-login-form.tsx` (currently `href="#"`) now points to `/signup`.

**Password reset**
- **D-15:** `/login/reset` (UI already exists) calls a new Server Action that triggers Zitadel's Management API to send the reset email (`SetPasswordNotification`/equivalent flow) — Kreds never generates or sees the reset link/token, only triggers the send. No redirect to Zitadel's hosted UI.
- **D-16:** The response is always the same success screen (masked email + "resend" state), regardless of whether the email exists in Zitadel or not — same anti-enumeration principle as the other generic messages.

### Claude's Discretion
- Exact error/copy text for the signup form (placeholders, labels).
- Exact payload shape of `authorize()`'s error (single message vs. error code + message).
- Exact name/format of the signup Zod validation schema's fields.
- Exact name of the new Zitadel Console service account and its granular roles/permissions (the implementation should choose the smallest set of Zitadel roles covering: create-user, create-session, read-grants, send-password-reset). See this research's Open Question 2 for the concrete recommendation (`ORG_USER_MANAGER`, org-scoped).
- Where exactly the shared helper (D-07/D-13) lives in the code (e.g., `src/lib/auth/guardian-sync.ts` vs. inline in `auth.ts`). This research recommends `src/lib/auth/guardian-sync.ts` (see Recommended Project Structure).

### Deferred Ideas (OUT OF SCOPE)
- **Passkey/WebAuthn native ceremony** — separate, large future roadmap item (browser WebAuthn API integration); stays on OIDC redirect this phase.
- **Google/Apple migration to native** — no real benefit (federation always redirects to the provider's own consent screen regardless), stays on OIDC.
- **MFA/lockout/forced-password-change UI** — org does not enforce any of these today (re-verified live this session, 2026-07-07 — no drift since the 2026-07-04 SPEC.md check); revisit only if Zitadel org policy changes.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| R1 | Native credentials login via Session API v2 (create session + password check), no OIDC redirect, same session shape as today | Combined single-call `POST /v2/sessions` verified live (Pattern 1); Architecture Diagram traces the full request path |
| R2 | Generic invalid-credentials error (no enumeration, no shape/timing leak) | Live-verified 404-vs-400 distinction in Zitadel's own responses (Pitfall 3); `CredentialsSignin` subclass pattern (Pattern 2) closes the gap at the app layer |
| R3 | `systemRoles` repopulated via Management API grants fetch, non-blocking on failure | Live-verified `/management/v1/users/grants/_search` shape; noted that the `kreds` project currently has zero roles defined (Code Examples, Environment Availability) — positive-case test needs new test data |
| R4 | Email-not-verified reuses the exact `/login?error=email-not-verified` redirect | Pitfall 6 documents the v2 API's field-omission behavior for `isVerified`, required to implement this check correctly on the native path |
| R5 | Native signup creates a Zitadel user + Kreds identity without leaving the app | v2 `POST /v2/users/human` endpoint verified via Context7 docs (Standard Stack, State of the Art) |
| R6 | Duplicate-email signup rejected generically | Live-verified `already_exists` 409 error shape (Package/API research, "AlreadyExists" pattern) |
| R7 | Family bootstrap on signup, pending-invite-aware attach instead of duplicate family | **Schema correction found**: pending-invite lookup must query `guardianInvitations`, not `family_memberships` (Pitfall 2, Pattern 3) — CONTEXT.md/SPEC.md cite the wrong table |
| R8 | Password-reset backend wired to `/login/reset`, always-generic response | Live-verified request/response shapes for `password_reset` and `password` endpoints; **scope gap found**: a confirm-leg page is needed to avoid falling back to Zitadel's hosted UI (Pitfall 4, Open Question 1) |
| R9 | Password policy passthrough, no client-side reimplementation | Live-reverified org policy (Code Examples) confirms SPEC.md's 2026-07-04 findings still hold as of 2026-07-07 — no drift |
| R10 | `IAM_LOGIN_CLIENT` secret, fail-closed boot | Existing `env.ts`/zod fail-closed pattern; live-verified key format requires Node `crypto`, not `jose.importPKCS8` (Pitfall 1); existing `kreds-extra-secret` k8s Secret identified as the likely target (Environment Availability) |
| R11 | Social/Passkey (`loginWithProvider`/`loginWithPasskey`/`SocialAuthButtons`) unchanged | Confirmed via direct read of `guardian-auth.ts` this session — no code path in this research touches those functions |
| R12 | No password persistence to DB/cache/logs | Confirmed via grep this session: no `pino`/logger usage exists yet in `src/`; only precedent is a credential-free `console.error` in `auth.ts` — documented as a judgment-tier code-review check (Validation Architecture, Security Domain) |
</phase_requirements>

## Summary

This phase replaces the OIDC-redirect login/signup for guardians with direct server-to-server calls to Zitadel's Session API v2 (login) and User/Management APIs (signup, roles, reset), wired into a `Credentials` provider added alongside the existing `Zitadel` OIDC provider in `auth.ts`. All the Zitadel wire-level shapes needed to plan concretely were verified live in this session against `https://auth.hasslab.pro` (org: CompHass) using the `iam-admin` service account already documented in this repo's `kreds-auth-debug` skill: session creation (single combined call, not two-step), user lookup, org policies, and project/app IDs. **CLAUDE.md's documented Zitadel project ID and app ID are both stale** — the live project ID is `379172107176640540` and app ID is `379172304023715868` (see Package/Config drift note below); this should be corrected in CLAUDE.md as a side-effect of this phase.

The single most important wire-level finding: **`POST /v2/sessions` accepts `checks.user` and `checks.password` in the SAME request** — a password check does not require the two-step create-then-PATCH dance CONTEXT.md's D-06 implies. This means `authorize()` can create a fully-checked session in one HTTP call. A live test also confirmed the two failure modes return genuinely different HTTP status codes and body shapes (404 `NOT_FOUND` for unknown login name vs. 400 `INVALID_ARGUMENT` for wrong password) — which makes it essential that `authorize()` catches *both* outcomes (and any other non-2xx) and converts them to one identical thrown error, never letting the raw Zitadel status/shape reach the client. This is exactly what D-09 already commits to; this research confirms the underlying APIs do differ and therefore the catch-all is load-bearing, not cosmetic.

A significant scope gap was found in **Requirement 8 (password reset)**: SPEC.md/CONTEXT.md only describe triggering the reset e-mail, but Zitadel's default reset-link behavior points at Zitadel's own hosted UI unless the trigger call passes a custom `sendLink.urlTemplate` pointing at a Kreds URL — and Kreds has no page today to receive that link and submit `verificationCode` + new password back to Zitadel's `POST /v2/users/{userId}/password`. Without building that second page, either the reset email silently sends users to `auth.hasslab.pro` (violating the phase's own boundary) or the flow is genuinely incomplete. This is flagged as an Open Question for the planner — see below.

Also found: **`family_memberships.invitedByIdentityId` / `unique_pending_invite` do not exist in the schema.** Those columns live on `guardianInvitations`, a separate, currently-unused table. CONTEXT.md/SPEC.md cite the wrong table for the pending-invite lookup Requirement 7 depends on — this is corrected below and must be corrected in the plan.

**Primary recommendation:** Add a single server-only Zitadel REST client module (plain `fetch`, no new npm dependency) exposing `createSession`, `getUser`, `createHumanUser`, `getUserGrants`, `requestPasswordReset`, `setPasswordWithCode` — used by a new `Credentials` provider in `auth.ts`, by `guardian-signup.ts`, and by a new `guardian-reset.ts` action. Sign the service-account JWT assertion with Node's built-in `crypto` (not `jose`'s `importPKCS8`, which rejects Zitadel's PKCS#1-formatted key — verified live, see Pitfalls).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Native login (Session API v2 call) | API/Backend (Next.js Server Action + `auth.ts` Credentials `authorize()`) | Database (`kreds_identities` upsert) | Password never reaches the browser tier beyond the existing HTML form; all Zitadel calls are server-to-server |
| Native signup (Management/v2 user creation) | API/Backend (new Server Action) | Database (transactional family bootstrap) | Same as above — new user creation is a server-to-server call, never client-side |
| Role repopulation (`systemRoles`) | API/Backend (`jwt` callback, Credentials branch) | — | Non-blocking side-effect of the login call, same tier as the session check itself |
| Password reset trigger + completion | API/Backend (two Server Actions: request + confirm) | — | Both legs are server-to-server Zitadel calls; the completion leg needs a new Frontend page (Browser tier) only to collect the verification code + new password, not to talk to Zitadel directly |
| `IAM_LOGIN_CLIENT` secret load | API/Backend (`env.ts`, server-only module) | — | Same fail-closed boot pattern as `PIN_ENCRYPTION_KEY`/`CHILD_SESSION_SECRET` |
| Family/membership bootstrap on signup | Database (single Drizzle transaction) | API/Backend (transaction orchestration) | Ledger-style invariant (guardian must land in exactly one family) — matches existing `db.transaction()` pattern in `engine.ts` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next-auth` | `5.0.0-beta.31` (already installed — **do not upgrade mid-phase**) | Credentials provider host | Already the project's auth framework; `AuthError`/`CredentialsSignin` confirmed exported from the installed version's `index.d.ts` [VERIFIED: local node_modules type declaration] |
| Node built-in `crypto` | Node 22/24 (project runtime) | Sign the JWT-profile assertion for the new `IAM_LOGIN_CLIENT` service account | `createPrivateKey`/`createSign` auto-detect PKCS#1 vs PKCS#8 PEM; verified live this session against the real `iam-admin` key (see Pitfalls) [VERIFIED: live test this session] |
| Zitadel REST APIs (`/v2/sessions`, `/v2/users/human`, `/v2/users/{id}`, `/v2/users/{id}/password_reset`, `/v2/users/{id}/password`, `/management/v1/users/grants/_search`) | Live instance at `auth.hasslab.pro` | Login, signup, role-grants fetch, password reset | No new package required — these are plain JSON-over-HTTPS endpoints; confirmed reachable and their shapes verified live this session [VERIFIED: live API calls this session] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `4.4.3` (installed) | Validate `IAM_LOGIN_CLIENT` JSON shape in `env.ts`, validate signup form fields | Same pattern already used for `PIN_ENCRYPTION_KEY` |
| `drizzle-orm` | `0.45.2` (installed) | Signup transaction (`db.transaction`) | Matches `engine.ts`'s existing pattern (see Pitfalls re: 23505 handling) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `fetch`-based Zitadel client | `@zitadel/client` / `@zitadel/node` (official TS SDK, npm `@zitadel/client@1.3.1`, `@zitadel/node@3.0.18` per jsDelivr) | Official SDK targets gRPC-Connect transport and has documented ESM/CJS friction under `moduleResolution: nodenext` as of recent community reports [CITED: web search, GitHub discussions]. For the ~6 endpoints this phase needs, a thin typed `fetch` wrapper is lower-risk and matches this repo's existing hand-rolled `server-only` module convention (`child-guard.ts`, `pin-cipher.ts`). Revisit the SDK only if the number of Zitadel endpoints used grows significantly in a future phase. |
| `jose` for the service-account JWT assertion | Node `crypto` directly | `jose`'s `importPKCS8` throws `TypeError: "pkcs8" must be PKCS#8 formatted string"` against the real `iam-admin` key, which is PKCS#1 (`-----BEGIN RSA PRIVATE KEY-----`) — verified live. Node's `crypto.createPrivateKey()` accepts either format transparently. `jose` remains fine for this repo's existing `CHILD_SESSION_SECRET` HS256 JWTs; just not for this specific RS256 service-account assertion. |

**Installation:** No new packages required for this phase — the client is hand-rolled `fetch` + Node built-ins already present in the project.

**Version verification:** `next-auth@5.0.0-beta.31`, `zod@4.4.3`, `drizzle-orm@0.45.2`, `jose@6.2.3` confirmed installed via `package.json`/`node_modules` inspection this session [VERIFIED: local package.json].

## Package Legitimacy Audit

**No new external packages are introduced by this phase.** All required functionality is covered by already-installed dependencies (`next-auth`, `zod`, `drizzle-orm`, Node built-in `crypto`/`fetch`) plus direct HTTPS calls to Zitadel's own REST API. The Package Legitimacy Gate is not applicable — nothing new to check against the registry.

If a future iteration of this phase decides to adopt `@zitadel/client`/`@zitadel/node` instead of the hand-rolled client, run the gate at that time; do not add them speculatively now.

## Architecture Patterns

### System Architecture Diagram

```
Guardian browser (existing /login, /login/reset UI + new /signup UI)
        |
        | POST form data (email/password) — TLS, same-origin
        v
Next.js Server Action  (guardian-auth.ts: loginWithCredentials)
        |
        | signIn('credentials', formData)
        v
auth.ts — Credentials.authorize(credentials)
        |
        | 1. POST /v2/sessions { checks: { user: { loginName }, password: { password } } }
        |    -> single call, combined user+password check (verified live)
        v
   Zitadel Session API v2
        |
   +----+-------------------------------------------+
   | success: sessionToken + factors                | failure: 404 (user) or 400 (password)
   v                                                 v
2. GET /v2/users/{userId}  (profile: email, email_verified, displayName)
        |
        | authorize() returns { id, email, email_verified, name }
        v
auth.ts jwt callback (Credentials branch, parallel to existing OIDC branch)
        |
        +--> shared helper: upsert kreds_identities (try/catch, non-blocking)
        +--> shared helper: self-heal family_memberships if guardian has none (Req 7)
        +--> GET grants via management/v1/users/grants/_search -> token.systemRoles (try/catch, non-blocking)
        v
session callback -> session.user.{id,email,name,systemRoles}  (same shape as OIDC path)


Signup (new):
Guardian browser -> /signup form
        |
        v
Server Action guardian-signup.ts
        |
        | 1. POST /v2/users/human  (create Zitadel user; catch 409 already_exists -> generic message)
        | 2. SELECT guardianInvitations WHERE email=? AND status='pending'  (NOT family_memberships!)
        |      no invite -> db.transaction: insert identities + families('Família') + family_memberships(guardian)
        |      invite found -> attach identity to invited family instead
        | 3. signIn('credentials', ...) internally to establish session immediately
        v
   Same auth.ts Credentials path as above


Password reset (two legs):
/login/reset (exists) -> Server Action -> POST /v2/users/{id}/password_reset
        { sendLink: { notificationType: EMAIL, urlTemplate: "https://kreds.hasslab.pro/login/reset/confirm?..." } }
        -> always-generic success screen (regardless of whether email exists)

NEW /login/reset/confirm page (gap — see Open Questions) -> Server Action
        -> POST /v2/users/{id}/password { newPassword: {...}, verificationCode }
```

### Recommended Project Structure

```
src/
├── lib/
│   └── zitadel/
│       ├── login-client.ts    # server-only fetch wrapper: createSession, getUser, getUserGrants,
│       │                      #   createHumanUser, requestPasswordReset, setPasswordWithCode
│       └── service-account.ts # server-only: build/cache the signed JWT assertion + access token
├── lib/auth/
│   └── guardian-sync.ts       # shared helper (D-07/D-13): identities upsert + family self-heal,
│                               #   called from both OIDC and Credentials jwt-callback branches
├── app/
│   ├── actions/
│   │   ├── guardian-auth.ts   # loginWithCredentials now uses 'credentials' provider (unchanged: loginWithProvider/loginWithPasskey)
│   │   ├── guardian-signup.ts # new — Requirement 5/6/7
│   │   └── guardian-reset.ts  # new — Requirement 8 (both request + confirm legs)
│   ├── signup/
│   │   └── page.tsx           # new — SSR page + client form, mirrors /login structure
│   └── login/
│       └── reset/
│           └── confirm/
│               └── page.tsx   # new — receives ?userId=&code= from the reset email (see Open Questions)
auth.ts                        # + Credentials provider, jwt/session callback branch by account.provider
```

### Pattern 1: Combined user+password Session API v2 call

**What:** `POST /v2/sessions` with both `checks.user.loginName` and `checks.password.password` in the same request body — one round trip, not create-then-PATCH.
**When to use:** Every native login attempt in `authorize()`.
**Example:**
```typescript
// Verified live against https://auth.hasslab.pro this session.
// Source pattern confirmed by Context7 zitadel/zitadel docs (username-password.mdx) +
// live test showing the combined-call variant is accepted.
const res = await fetch(`${ZITADEL_ISSUER}/v2/sessions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${serviceAccountToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    checks: {
      user: { loginName: email },
      password: { password },
    },
  }),
})

if (!res.ok) {
  // 404 = user not found (code 5 / NOT_FOUND), 400 = wrong password (code 3 / INVALID_ARGUMENT,
  // detail type CredentialsCheckError with failedAttempts) — BOTH must map to the same generic error.
  throw new InvalidGuardianCredentialsError()
}

const { sessionId, sessionToken } = await res.json()
```

### Pattern 2: CredentialsSignin subclass for the generic error message

**What:** Extend `CredentialsSignin` (exported from `next-auth`, confirmed present in the installed beta) rather than throwing a plain `Error`, per next-auth's own documented pattern for surfacing a custom message through `authorize()`.
**When to use:** Requirement 2's generic invalid-credentials message.
**Example:**
```typescript
// Source: Context7 nextauthjs/next-auth docs — "Handle Custom Error Messages in Credentials Provider"
import { CredentialsSignin } from 'next-auth'

class InvalidGuardianCredentialsError extends CredentialsSignin {
  code = 'E-mail ou senha inválidos'
}
```
Since `auth.ts` has no custom `pages.signIn` configured (confirmed by reading the file), `signIn('credentials', formData)` called from the App Router Server Action does **not** redirect through the built-in error-page query-string path — it re-throws the error directly, which `guardian-auth.ts`'s Server Action (and, above it, `guardian-login-form.tsx`'s existing try/catch on `e.message`) must catch and translate. This matches the client component's current NEXT_REDIRECT-vs-other-error branching exactly — no client-side changes needed beyond the "Criar conta" link (D-14).

### Pattern 3: Signup transaction with pending-invite check (Requirement 7) — CORRECTED table reference

**What:** Before inserting a new `families` row, check for a pending invite by e-mail.
**Correction:** CONTEXT.md (line 61-62, 98) and SPEC.md (Requirement 7, Prohibitions) both cite `family_memberships.invitedByIdentityId` / `unique_pending_invite`. **These columns do not exist on `family_memberships`** — grep of `src/lib/db/schema/index.ts` confirms `invitedByIdentityId` and the `unique_pending_invite` unique index (`ON (familyId, email) WHERE status = 'pending'`) live on the separate **`guardianInvitations`** table (lines 108-134), keyed by `email` (text), not by identity. `family_memberships` has no `invitedByIdentityId` column and no email column at all — it links identities/child profiles to families, post-acceptance.
**Why it matters:** The signup Server Action must query `guardianInvitations` (`WHERE email = ? AND status = 'pending'`), not `family_memberships`. No code in this repo currently reads or writes `guardianInvitations` — this will be the first consumer.
**Example:**
```typescript
// src/lib/db/schema/index.ts:108-134 (verified this session)
const pendingInvite = await db.query.guardianInvitations.findFirst({
  where: and(
    eq(schema.guardianInvitations.email, email),
    eq(schema.guardianInvitations.status, 'pending'),
  ),
})

if (pendingInvite) {
  // attach identity to pendingInvite.familyId, then mark invite 'accepted'
} else {
  // db.transaction: insert identities + families('Família') + family_memberships(role:'guardian')
}
```

### Anti-Patterns to Avoid
- **Catching Postgres `23505` (unique_violation) *inside* the `db.transaction()` callback:** this repo already learned (STATE.md, decision `06-03`) that catching inside the callback silently swallows the error after the transaction has aborted. Catch it *outside* the `db.transaction(...)` call, at the call site in the Server Action.
- **Reusing `iam-admin`'s credentials for `IAM_LOGIN_CLIENT`:** per D-01, a dedicated service account keeps blast radius smaller; `iam-admin` is an ops/debug credential, not meant to be a runtime app dependency.
- **Trusting `jose.importPKCS8` for the service-account key without checking format:** Zitadel's JWT-profile key JSON is PKCS#1 PEM (`RSA PRIVATE KEY`), not PKCS#8 (`PRIVATE KEY`) — verified live. `jose` will throw at boot if used naively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password complexity validation | Custom regex for min-length/upper/lower/number/symbol | Zitadel's own policy-violation error passthrough (Requirement 9) | Policy is live-configurable in Zitadel Console; a hand-rolled regex will drift from the org's actual policy the moment someone changes it there |
| Service-account OAuth2 token exchange | Custom OAuth client code beyond a single `fetch` | The `urn:ietf:params:oauth:grant-type:jwt-bearer` flow already documented/used by this repo's `kreds-auth-debug` skill | Same token-exchange shape already verified working for `iam-admin`; reuse the pattern for `IAM_LOGIN_CLIENT` rather than inventing a new one |
| Enumeration-safe error comparison | Any timing-safe compare of "email exists" vs "password wrong" | A single generic catch-all in `authorize()`/the reset action that maps ANY non-2xx Zitadel response to one identical thrown error | Zitadel's 404-vs-400 responses (verified live, different HTTP status *and* body shape) mean partial handling would leak which case occurred; only a true catch-all closes this |

**Key insight:** Every "hand-roll risk" in this phase is really about not re-deriving policy or timing decisions that Zitadel already owns and can change independently (live) — the safe pattern throughout is "call Zitadel, catch broadly, translate to one generic outcome."

## Common Pitfalls

### Pitfall 1: `jose.importPKCS8` rejects the real service-account key format
**What goes wrong:** `TypeError: "pkcs8" must be PKCS#8 formatted string"` at the moment you try to sign the JWT-profile assertion for a new Zitadel service account key.
**Why it happens:** Zitadel's JWT-profile key JSON's `key` field is a PKCS#1 RSA private key (`-----BEGIN RSA PRIVATE KEY-----`), and `jose`'s `importPKCS8` only accepts PKCS#8 (`-----BEGIN PRIVATE KEY-----`).
**How to avoid:** Use Node's built-in `crypto.createPrivateKey({ key, format: 'pem' })` + `crypto.createSign('RSA-SHA256')` — both auto-detect PKCS#1 vs PKCS#8. Verified working live this session against the real `iam-admin` key; the same code path will work unchanged for the new `IAM_LOGIN_CLIENT` key once it's generated in the same Console flow.
**Warning signs:** Any `jose`-based helper that throws at the exact line calling `importPKCS8` with a key file whose PEM header reads `RSA PRIVATE KEY`.

### Pitfall 2: Wrong table for pending-invite lookup (Requirement 7)
**What goes wrong:** Querying `family_memberships` for `invitedByIdentityId`/`unique_pending_invite` — columns and index that don't exist on that table — either a compile error (if using Drizzle's typed schema) or, if someone adds ad-hoc raw SQL, a silent no-op/wrong-table query.
**Why it happens:** CONTEXT.md and SPEC.md both cite `family_memberships` for this; the correct table is `guardianInvitations` (confirmed via schema read this session).
**How to avoid:** Point the signup Server Action's pending-invite lookup at `guardianInvitations` (keyed by `email`), not `family_memberships`.
**Warning signs:** TypeScript error "Property 'invitedByIdentityId' does not exist on type..." when accessing `schema.familyMemberships`.

### Pitfall 3: Session API's 404-vs-400 distinction leaking through an incomplete catch
**What goes wrong:** A naive `try { ... } catch { throw genericError }` that only wraps the password-check step (not the whole call, or not every non-2xx branch) can let the 404 "user not found" response's distinct shape/status reach the client untranslated.
**Why it happens:** The combined single-call `POST /v2/sessions` still returns genuinely different HTTP status codes for "user not found" (404, `ErrorDetail`) vs "wrong password" (400, `CredentialsCheckError` with `failedAttempts`) — verified live.
**How to avoid:** Wrap the entire `fetch` + `res.ok` check in one block that throws the same `InvalidGuardianCredentialsError` regardless of which branch triggered it; never forward Zitadel's raw status code or body to the client.
**Warning signs:** Any code path that inspects the Zitadel error's `code`/`message` field and produces different UI copy per case.

### Pitfall 4: Password-reset email defaults to Zitadel's hosted UI unless `urlTemplate` is set
**What goes wrong:** Calling `POST /v2/users/{id}/password_reset` with just `{ sendLink: { notificationType: 'NOTIFICATION_TYPE_Email' } }` (no `urlTemplate`) sends an email whose link points at Zitadel's own hosted reset page — the exact behavior this phase is trying to eliminate.
**Why it happens:** `urlTemplate` is optional in the API but not optional in practice for this phase's boundary ("no redirect to `auth.hasslab.pro`" / hosted screens).
**How to avoid:** Always pass `urlTemplate: "https://kreds.hasslab.pro/login/reset/confirm?userID={{.UserID}}&code={{.Code}}&orgID={{.OrgID}}"` and build the corresponding `/login/reset/confirm` page (see Open Questions — this page does not exist today and is not explicitly scoped in SPEC.md's 12 requirements).
**Warning signs:** Testing the reset flow end-to-end (not just the "trigger" acceptance criterion) and finding the received email's link lands on `auth.hasslab.pro`.

### Pitfall 5: Zitadel org/project IDs drift silently
**What goes wrong:** Code or docs hard-code a project/app ID that has since been deleted/recreated, causing 404s that look like permission errors.
**Why it happens:** Verified live this session: CLAUDE.md's documented `kreds` project ID (`376396522276782110`) and app ID (`376397200093151262`) **both 404** against the live Management API. The actual current values are project `379172107176640540`, app `379172304023715868`, under org `CompHass` (`376448551879704606`) — a *different* org from the `iam-admin` service account's home org (`ZITADEL`, `372631774263574555`), which is why cross-org calls need the `x-zitadel-orgid` header.
**How to avoid:** This phase's code should not hard-code project/app IDs at all — it only needs the org's issuer URL (`AUTH_ZITADEL_ISSUER`, already in `env.ts`) and the new service account's own credentials, which are org-scoped, not project-scoped. Update CLAUDE.md's stale IDs as a documentation side-effect of this phase (low-risk, high-value).
**Warning signs:** Any 404 from a Management API call whose `x-zitadel-orgid` header isn't set, or that references an ID copied from CLAUDE.md/AGENTS.md without a live check.

### Pitfall 6: `email.isVerified` is *absent*, not `false`, in the v2 GetUser response
**What goes wrong:** Code that checks `user.human.email.isVerified === false` never matches, because Zitadel's v2 API (protobuf-JSON) omits boolean fields entirely when they're at their zero/default value.
**Why it happens:** Verified live: a real unverified user's `GET /v2/users/{id}` response has no `isVerified` key under `human.email` at all.
**How to avoid:** Check `user.human?.email?.isVerified !== true` (treat missing as unverified), mirroring the existing OIDC `signIn` callback's `profile?.email_verified === false` check conceptually but adapted for the field-omission behavior of the v2 REST API.
**Warning signs:** A newly-signed-up user (whose `email_verified` is expected to be `false`) incorrectly passing an `=== false` check that never fires.

## Code Examples

### Session API v2 — combined create + password check (live-verified request/response shapes)

```bash
# Source: verified live this session against https://auth.hasslab.pro (org CompHass)
# Unknown login name:
curl -X POST https://auth.hasslab.pro/v2/sessions \
  -H "Authorization: Bearer $SERVICE_TOKEN" -H 'Content-Type: application/json' \
  -d '{"checks":{"user":{"loginName":"nobody@example.com"}}}'
# -> HTTP 404
# {"code":5,"message":"User could not be found (QUERY-Dfbg2)",
#  "details":[{"@type":"...ErrorDetail","id":"QUERY-Dfbg2","message":"User could not be found"}]}

# Known login name + wrong password, combined single call:
curl -X POST https://auth.hasslab.pro/v2/sessions \
  -H "Authorization: Bearer $SERVICE_TOKEN" -H 'Content-Type: application/json' \
  -d '{"checks":{"user":{"loginName":"guardian01@example.com"},"password":{"password":"wrong"}}}'
# -> HTTP 400
# {"code":3,"message":"Password is invalid (COMMAND-3M0fs)",
#  "details":[{"@type":"...CredentialsCheckError","id":"COMMAND-3M0fs",
#              "message":"Password is invalid","failedAttempts":1}]}
```

### Role-grants fetch (Requirement 3) — verified live shape

```bash
# Source: verified live this session
curl -X POST https://auth.hasslab.pro/management/v1/users/grants/_search \
  -H "Authorization: Bearer $SERVICE_TOKEN" -H "x-zitadel-orgid: $ORG_ID" -H 'Content-Type: application/json' \
  -d '{"queries":[{"userIdQuery":{"userId":"'"$USER_ID"'"}}]}'
# -> { "result": [ { "userId": ..., "projectId": ..., ... } ] }  -- NOTE: no roleKeys field
#    populated in this org today because the "kreds" project currently has ZERO project roles
#    defined (verified: /management/v1/projects/{id}/roles/_search returns an empty result).
#    Requirement 3's acceptance criterion ("guardian with a role grant sees systemRoles populated")
#    cannot be manually verified against live data until at least one project role + grant exists —
#    flag as a test-data prerequisite for the plan's verification step.
```

### Live org policies confirming SPEC.md's 2026-07-04 findings still hold (re-verified 2026-07-07)

```json
// GET /management/v1/policies/password/complexity -> isDefault: true
{"minLength": "8", "hasUppercase": true, "hasLowercase": true, "hasNumber": true, "hasSymbol": true}
// GET /management/v1/policies/lockout -> isDefault: true (no maxPasswordAttempts set)
// GET /management/v1/policies/password/age -> isDefault: true (no forced expiry)
// GET /management/v1/policies/login -> secondFactors: [OTP, U2F] but no forceMFA field (optional only)
```
No drift detected since SPEC.md's 2026-07-04 live check — all four policies are still instance-default, confirming the SPEC's Constraints section is still accurate as of this research date [VERIFIED: live API calls, org CompHass, 2026-07-07].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Zitadel Management API v1 `POST /management/v1/users/human/_import` for user creation | Zitadel v2 API `POST /v2/users/human` | Zitadel v2 API generation (current stable) | Use the v2 endpoint for signup (Requirement 5) — it's the one shown in Zitadel's own current README/quickstart docs, not the v1 management import endpoint |
| Manual OIDC redirect for every login | Session API v2 (server-side password check without a browser redirect) | Zitadel's documented "Custom Login UI" integration path (current) | This is the entire premise of the phase — confirmed as Zitadel's own supported pattern for headless/native login UIs, not a workaround |

**Deprecated/outdated:** None specific to this phase's endpoints found — all Session API v2 and v2 user endpoints used here are current, not legacy/deprecated paths.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ORG_USER_MANAGER` (org-scoped, not IAM-wide) is the practical minimal built-in Zitadel role for the new `IAM_LOGIN_CLIENT` service account | Don't Hand-Roll / Standard Stack | Custom fine-grained roles (e.g., only `user.write` + `session.write`) are only configurable by editing `defaults.yaml` on a self-hosted instance; this wasn't verified live (would require modifying the org's role config, out of scope for read-only research). If a narrower built-in role exists, `ORG_USER_MANAGER` is broader than necessary but not incorrect. |
| A2 | A plain thrown `Error("...")` from `authorize()` reliably preserves its `.message` through to the Server Action's catch block, vs. requiring the documented `CredentialsSignin` subclass pattern | Pattern 2 | If the plain-Error path silently gets wrapped/generalized by next-auth internals, the generic error text might not reach the client as intended — mitigated by recommending the `CredentialsSignin` subclass (the more explicitly documented mechanism) rather than relying on the plain-Error pattern |
| A3 | Adding `IAM_LOGIN_CLIENT` as a new key in the existing `kreds-extra-secret` k8s Secret (rather than creating a brand-new Secret object) is acceptable, following the precedent of `CHILD_SESSION_SECRET`/`PIN_ENCRYPTION_KEY` | Environment Availability | If the infra/ops preference is genuinely a dedicated new Secret object (as CONTEXT.md's wording literally suggests), this is a trivial GitOps manifest change either way — no functional risk, just a naming/organization preference to confirm |
| A4 | The gap in Requirement 8 (missing `/login/reset/confirm` page) is an oversight rather than an intentional "trigger only" scope decision | Open Questions | If SPEC.md's authors intended reset to be trigger-only this phase (e.g., a future phase completes it), building the confirm page now would be scope creep; if unintentional, skipping it ships a broken end-user flow. Needs explicit resolution before planning Requirement 8's tasks. |

## Open Questions

1. **Does Requirement 8 (password reset) include the "confirm new password" page, or only the trigger?**
   - What we know: SPEC.md's Requirement 8 acceptance criterion only tests that "an existing account actually receives a reset email" and that the response is always-generic. It does not mention a page to consume the emailed link.
   - What's unclear: Without a Kreds-hosted `/login/reset/confirm`-style page and a `urlTemplate` pointed at it, the emailed link defaults to Zitadel's own hosted reset UI — which contradicts the phase's overall goal ("guardians ... never see the Zitadel hosted login/registration screens") even though Requirement 8 itself doesn't explicitly forbid it.
   - Recommendation: Treat building the confirm page + `setPasswordWithCode` action as in-scope for Requirement 8 (it's required for the phase's own stated goal to hold true), and have the planner add it as an explicit task rather than silently descoping it. Flag for user confirmation given the ambiguity — cheap to build (mirrors the existing `/login/reset` page's form pattern) but changes the task count for Requirement 8.

2. **Exact granular Zitadel Console role for the new `IAM_LOGIN_CLIENT` service account.**
   - What we know: `session.write` is the documented permission for `CreateSession`; user creation/reset/grants-read are all "user management" category permissions. `ORG_USER_MANAGER` is the closest built-in role that is org-scoped (not instance-wide).
   - What's unclear: Whether a narrower built-in role exists specifically for this instance's configured `defaults.yaml` (self-hosted Zitadel can customize role-permission mappings) — not verified live since it would require inspecting instance config beyond the Management API's own scope.
   - Recommendation: Start with `ORG_USER_MANAGER` scoped to the `CompHass` org only (never `IAM_OWNER`/instance-wide); this is Claude's-discretion territory per CONTEXT.md and doesn't block planning — it's a one-time manual Zitadel Console setup step, likely a `checkpoint:human-verify` task in the plan.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Zitadel instance (`auth.hasslab.pro`) | All 12 requirements | ✓ | Live-verified 2026-07-07 | — |
| `iam-admin` service account (existing) | Live-config verification only (not a runtime dependency of the app) | ✓ | JWT-profile key, verified live | — |
| New `IAM_LOGIN_CLIENT` service account | Runtime login/signup/reset/grants calls (Requirement 10) | ✗ (does not exist yet) | — | Must be created manually in Zitadel Console as part of this phase's tasks — no code fallback; app fails closed at boot without it (by design, Requirement 10) |
| `kreds-extra-secret` k8s Secret (existing) | Where `IAM_LOGIN_CLIENT` likely gets added | ✓ | Currently holds `CHILD_SESSION_SECRET`, `PIN_ENCRYPTION_KEY` | — |
| At least one Zitadel project role + grant on the `kreds` project | Manually verifying Requirement 3's acceptance criterion end-to-end | ✗ (project currently has zero roles defined) | — | Requirement 3's non-blocking fallback (`systemRoles = []`) already covers the "no roles" case functionally; only the *positive* test case (a populated role) needs test data created first |

**Missing dependencies with no fallback:**
- New `IAM_LOGIN_CLIENT` service account — must be created in Zitadel Console before this phase's code can be exercised end-to-end (by design; the app is meant to fail closed without it).

**Missing dependencies with fallback:**
- Zitadel project roles for `systemRoles` positive-case testing — the non-blocking empty-array fallback already satisfies the requirement's core safety property; only manual verification of the "has a role" branch needs new test data.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (installed, per CLAUDE.md stack table) + Testcontainers for real-Postgres integration tests (established pattern, see `08-03`'s integration test decision in STATE.md) |
| Config file | Existing Vitest config (not modified by this phase) |
| Quick run command | `npx vitest run <file>` (STATE.md `08-03`/`08-04` note: run via local `npx vitest run`, not inside the docker container, since the app image is a production runner with no devDependencies) |
| Full suite command | `npx vitest run` |

### Phase Requirement → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|--------------|
| R1 | Native login succeeds via Session API v2, no redirect to auth.hasslab.pro | unit (mock Zitadel client) + integration (real DB for identities upsert) | `npx vitest run src/lib/zitadel/login-client.test.ts` | ❌ Wave 0 |
| R2 | Wrong password / unknown email produce identical generic error | unit | `npx vitest run auth.test.ts` (or new `src/app/actions/guardian-auth.test.ts`) | ❌ Wave 0 |
| R3 | `systemRoles` populated via grants fetch; failure non-blocking | unit (mock grants fetch success + failure) | `npx vitest run src/lib/auth/guardian-sync.test.ts` | ❌ Wave 0 |
| R4 | Email-not-verified redirects identically to OIDC path | unit | same as R2 | ❌ Wave 0 |
| R5/R6/R7 | Signup creates user + bootstraps family, duplicate rejected generically, pending-invite attaches instead of duplicating | integration (Testcontainers, real Postgres transaction + mocked Zitadel calls) | `npx vitest run src/app/actions/guardian-signup.test.ts` | ❌ Wave 0 |
| R8 | Reset triggers real email, always-generic response; confirm leg sets new password | integration (mocked Zitadel calls) + manual (real email receipt) | `npx vitest run src/app/actions/guardian-reset.test.ts` | ❌ Wave 0 |
| R9 | Password-policy violation surfaces Zitadel's own message | unit (mock 400 response with policy-violation shape) | same as R5/R6 signup test file | ❌ Wave 0 |
| R10 | App fails to boot without valid `IAM_LOGIN_CLIENT` | unit | `npx vitest run src/lib/env.test.ts` | ❌ Wave 0 (extend existing `env.ts` tests if present, else create) |
| R11 | `loginWithProvider`/`loginWithPasskey`/`SocialAuthButtons` unchanged | regression — diff review, not a new test | manual code review / existing snapshot tests if any | — |
| R12 | No password persistence to DB/cache/logs | code review (judgment-tier per SPEC.md's own Prohibitions table) — not mechanically testable | manual — grep for `password` near `db.insert`/`console.`/`pino` call sites in new files | — |

### Sampling Rate
- **Per task commit:** targeted `npx vitest run <changed-file>.test.ts`
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + the R12 manual code-review checklist before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/zitadel/login-client.test.ts` — unit tests for the new REST client (mock `fetch`), covering the 404-vs-400 catch-all (Pitfall 3)
- [ ] `src/app/actions/guardian-auth.test.ts` — Credentials-path error-message tests (R2, R4)
- [ ] `src/lib/auth/guardian-sync.test.ts` — shared identities-upsert + family self-heal + roles-fetch helper tests (R3, R7)
- [ ] `src/app/actions/guardian-signup.test.ts` — Testcontainers integration test for the transaction + pending-invite branch (R5, R6, R7) — must query `guardianInvitations`, not `family_memberships` (Pitfall 2)
- [ ] `src/app/actions/guardian-reset.test.ts` — request + confirm leg tests (R8, R9)
- [ ] Extend/create `src/lib/env.test.ts` — `IAM_LOGIN_CLIENT` fail-closed boot test (R10)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | yes | Delegate all password verification to Zitadel Session API v2 — never compare/hash passwords in Kreds code (Requirement 12) |
| V3 Session Management | yes | Reuse next-auth's existing JWT session strategy (`session.strategy: 'jwt'`) unchanged — the Credentials provider only changes how the *user* is authenticated, not how the resulting Kreds session is issued/stored |
| V4 Access Control | yes | `systemRoles` fetch failures never silently grant elevated access — non-blocking fallback is `[]` (least privilege), matching existing pattern |
| V5 Input Validation | yes | `zod` schemas for signup form fields (email, password, confirm-password) and for `IAM_LOGIN_CLIENT`'s JSON shape |
| V6 Cryptography | yes | JWT-profile assertion signed with RS256 via Node's built-in `crypto` (never hand-roll the signature algorithm itself — only the assertion-building glue is custom) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| User enumeration via login/signup/reset error differences | Information Disclosure | Single generic message + identical response shape for all three flows (Requirements 2, 6, 8) — verified live that Zitadel's own responses *do* differ (404 vs 400), making the app-level catch-all the actual control, not incidental |
| Credential stuffing / brute force against the new native login endpoint | Denial of Service / Spoofing | Delegated to Zitadel's own lockout policy (currently default/disabled per live check) — Requirement 9/Constraints explicitly defer building app-level rate limiting to a future phase if the org policy changes; document this as a residual risk, not a gap in this phase's scope |
| Role/family injection via signup payload | Elevation of Privilege | Prohibition (SPEC.md) already requires the signup Server Action's Zod schema to reject client-supplied `role`/`familyId` fields — role is hardcoded `'guardian'` server-side |
| Password leaking into logs/error responses | Information Disclosure | No `pino`/logger usage exists yet in `src/` (confirmed via grep) — the only existing precedent is a plain `console.error` in `auth.ts`'s identities-upsert catch block, which never includes credential material; new code must follow the same discipline (log the *error*, never the request body) |

## Sources

### Primary (HIGH confidence)
- Live API calls this session against `https://auth.hasslab.pro` (org CompHass, using the existing `iam-admin` service account per this repo's `kreds-auth-debug` skill): `/v2/sessions` (success/failure shapes), `/v2/users/{id}` (profile shape, `isVerified` omission), `/management/v1/policies/{password/complexity,lockout,password/age,login}`, `/management/v1/projects/_search`, `/management/v1/projects/{id}/apps/_search`, `/management/v1/projects/{id}/roles/_search`, `/management/v1/users/grants/_search`
- Context7 `/zitadel/zitadel` — Session API v2 create/update session, v2 human user creation, password reset request/change endpoints
- Context7 `/nextauthjs/next-auth` — Credentials provider `authorize()`, `CredentialsSignin` custom error pattern, Server Action sign-in pattern
- Local codebase reads this session: `auth.ts`, `src/app/actions/guardian-auth.ts`, `src/components/auth/guardian-login-form.tsx`, `src/lib/env.ts`, `src/lib/db/schema/index.ts`, `src/modules/ledger/engine.ts`, `package.json`

### Secondary (MEDIUM confidence)
- WebSearch (with source URLs) on Zitadel service-account minimal roles for Session API v2 (`ORG_USER_MANAGER` finding) — cross-referenced against Zitadel's own GitHub discussions
- WebSearch on `@zitadel/client`/`@zitadel/node` maturity/ESM issues — used only to justify the hand-roll-vs-SDK decision, not adopted

### Tertiary (LOW confidence)
- None — all claims above either verified live this session or cited to official Zitadel/next-auth docs via Context7

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all versions confirmed from installed `package.json`
- Architecture: HIGH — core Session API v2 combined-call behavior and error shapes verified live, not assumed
- Pitfalls: HIGH — all 6 pitfalls are live-verified or grep-verified against this exact codebase, not generic Zitadel/next-auth folklore

**Research date:** 2026-07-07
**Valid until:** 2026-08-06 (30 days — stable APIs, but Zitadel org policy/role config can drift; re-verify live before this phase's execution if more than a few weeks pass, per this repo's own `kreds-auth-debug` skill convention)
