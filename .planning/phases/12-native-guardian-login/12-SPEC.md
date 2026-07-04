# Phase 12: Native Guardian Login — Specification

**Created:** 2026-07-04
**Ambiguity score:** 0.16 (gate: ≤ 0.20)
**Requirements:** 12 locked

## Goal

Guardian email/password login and signup happen natively inside Kreds via Zitadel Session API v2 and the Management API — replacing the OIDC hosted-login/registration redirect for the Credentials flow only. Google/Apple/Passkey stay on the existing OIDC redirect (unavoidable federation + WebAuthn scope, explicitly deferred).

## Background

`src/components/auth/guardian-login-form.tsx` already collects email/password but `src/app/actions/guardian-auth.ts` discards them and calls `signIn('zitadel')` (full OIDC redirect to the Zitadel hosted login page). The "Criar conta" link points to a dead `#`. `auth.ts` captures `token.systemRoles` from the OIDC `urn:zitadel:iam:org:project:roles` claim, but grep confirms **zero consumers** of `systemRoles` anywhere else in the codebase today — it's currently dead code. The schema already has `identities` (`kreds_identities`), `families`, and `family_memberships` (with `invitedByIdentityId` / `unique_pending_invite` support for pending guardian invites) ready to back a native signup flow. Live Zitadel org policy check (2026-07-04, Management API) confirmed: lockout policy is default (`maxPasswordAttempts` unset → disabled), password age policy is default (no forced expiry), login policy has no `forceMFA` (OTP/U2F offered but optional). Password complexity policy: min length 8, requires uppercase, lowercase, number, and symbol. The only account state Phase 12 must handle beyond a normal password check is **email-not-verified** — already gated in `auth.ts`'s OIDC `signIn` callback (`/login?error=email-not-verified`), reused here.

## Requirements

1. **Native credentials login**: Guardian email/password login authenticates via Zitadel Session API v2 (create session + password check) instead of an OIDC redirect.
   - Current: `loginWithCredentials` in `guardian-auth.ts` discards the form's email/password and calls `signIn('zitadel')`, redirecting to the Zitadel hosted login page.
   - Target: A next-auth Credentials provider calls the Session API v2 to create a session and verify the password server-side; on success it establishes the same next-auth JWT session used today (session shape unchanged downstream).
   - Acceptance: Submitting valid guardian email/password on `/login` never navigates to `auth.hasslab.pro`; the resulting session has the same `session.user.id`/`email`/`name` shape as the current OIDC path.

2. **Generic invalid-credentials error**: Wrong password or unknown email both produce the same user-facing message.
   - Current: No native credentials error path exists (OIDC redirect handled all failures on Zitadel's own hosted page).
   - Target: Both "email not found" and "wrong password" from the Session API surface as one generic message: "E-mail ou senha inválidos" — no field-specific hint.
   - Acceptance: Submitting a non-existent email and submitting a valid email with a wrong password both render the identical error string; no network-timing or response-shape difference is observable from the client.

3. **Role repopulation via Management API**: `systemRoles` stays populated on the Credentials path (parity with the OIDC claim).
   - Current: `systemRoles` is derived only from the OIDC `urn:zitadel:iam:org:project:roles` claim; nothing else in the codebase reads it today.
   - Target: On successful Credentials login, the Management API is queried for the user's grants and `token.systemRoles` is populated the same way as the OIDC path.
   - Acceptance: A guardian with a Zitadel role grant sees `session.user.systemRoles` populated after a native Credentials login, matching what the OIDC path would have produced. A Management API failure/timeout during this fetch does NOT block login — `systemRoles` falls back to `[]` (same non-blocking try/catch pattern already used for the `kreds_identities` upsert in `auth.ts`).

4. **Email-not-verified reuse**: The existing email-verification gate applies identically on the native path.
   - Current: `auth.ts`'s OIDC `signIn` callback redirects to `/login?error=email-not-verified` when `profile.email_verified === false`.
   - Target: The native Credentials flow checks the Session API's user profile and redirects to the exact same `/login?error=email-not-verified` route/query string — no separate error UI.
   - Acceptance: A guardian whose Zitadel account has `email_verified=false` attempting native login lands on `/login?error=email-not-verified`, identical to the current OIDC behavior.

5. **Native signup**: A new guardian account is created via the Zitadel Management API without leaving Kreds.
   - Current: No signup page exists; "Criar conta" links to `#`.
   - Target: A signup form collects email/password, creates a Zitadel human user via the Management API, and logs the user in immediately — provisional login is allowed even though the new user's `email_verified` is `false`.
   - Acceptance: Completing signup with a new email results in an authenticated session without a blocking email-verification wall; the account exists in Zitadel and in `kreds_identities`.

6. **Duplicate-email signup**: Signing up with an email that already exists in Zitadel is rejected generically.
   - Current: No signup flow exists.
   - Target: Zitadel's own `AlreadyExists` response on user creation is surfaced as a generic message ("Este e-mail já está cadastrado.") with a link to `/login` — no detail on whether the existing account has a family, membership, or verification state.
   - Acceptance: Signing up twice with the same email shows the generic duplicate message on the second attempt and does not create a second Zitadel user or a second `kreds_identities` row.

7. **Family bootstrap on signup**: A brand-new guardian gets a usable family, not a dead end.
   - Current: Root/family redirects bounce a member-less guardian back to `/login` — there is no automatic family creation.
   - Target: Immediately after Zitadel user creation succeeds, one Postgres transaction inserts `kreds_identities`, a new `families` row, and a `family_memberships` row (`role='guardian'`) — unless the signup email matches an existing pending invite (see Prohibitions), in which case the identity attaches to the invited family instead of creating a new one.
   - Acceptance: A new signup (no matching invite) lands the guardian on their own family's dashboard with zero manual setup steps. If the Postgres transaction fails after the Zitadel user was already created, the next successful login self-heals by retrying the same identity/family/membership upsert (same non-blocking pattern as requirement 3) — no manual cleanup and no orphaned Zitadel user requiring deletion.

8. **Password reset backend**: `/login/reset` (currently UI-only) is wired to a real Zitadel-backed flow.
   - Current: The reset-password screen exists visually (masked email + resend state) but has no backend.
   - Target: Submitting a reset request triggers Zitadel's password-reset email flow via the Management API (or Zitadel's self-service reset), regardless of whether the submitted email exists.
   - Acceptance: Submitting any email on `/login/reset` — existing or not — shows the same generic success confirmation; an existing account actually receives a reset email from Zitadel.

9. **Password policy passthrough**: Kreds does not reimplement Zitadel's password complexity rules.
   - Current: No password validation exists for a native flow.
   - Target: Signup/reset submit the password directly to Zitadel; any policy violation (min 8 chars, uppercase, lowercase, number, symbol — confirmed live) is surfaced to the user using Zitadel's own returned error message, not a client-side reimplementation.
   - Acceptance: Submitting a password that violates the live org policy (e.g., 7 characters) shows Zitadel's policy-violation message; no separate Kreds-side complexity regex exists in the codebase.

10. **IAM_LOGIN_CLIENT secret**: A new server-only service-account secret is required at runtime.
    - Current: The Zitadel service account used for admin/ops tasks is not a runtime dependency of the app; only build/deploy tooling touches it.
    - Target: A new `IAM_LOGIN_CLIENT` k8s Secret is added to the `kreds` namespace and read only in server-only modules (Session API + Management API calls for login/signup/reset/role-fetch).
    - Acceptance: The app fails to boot with a clear, explicit error (fail-closed, same pattern as `env.ts`'s existing required-var validation) if `IAM_LOGIN_CLIENT` is missing or malformed — it never silently falls back to an unauthenticated or degraded mode.

11. **Social/Passkey unchanged**: Google, Apple, and Passkey login are explicitly out of scope.
    - Current: `loginWithProvider` and `loginWithPasskey` in `guardian-auth.ts` call `signIn('zitadel', ..., { identity_provider })` / `signIn('zitadel')`.
    - Target: No change to `loginWithProvider`/`loginWithPasskey` or `SocialAuthButtons` in this phase.
    - Acceptance: `guardian-auth.ts`'s `loginWithProvider`/`loginWithPasskey` functions are byte-identical (or behavior-identical) after Phase 12 — only `loginWithCredentials` and the new signup/reset actions change.

12. **No password persistence**: The guardian's plaintext password is never written to a database table, cache, or log.
    - Current: N/A — no native path exists yet, so no persistence risk exists yet.
    - Target: The plaintext password is held only in memory for the duration of a single Session API / Management API call; it is never stored in any Postgres column, cache entry, or Pino/console log line, and never appears in an error response body.
    - Acceptance: Code review confirms no code path writes the password variable to `db.insert(...)`, a cache client, `console.*`, `pino`, or a thrown/returned error object. (See Prohibitions for the negative test.)

## Boundaries

**In scope:**
- Native email/password login via Zitadel Session API v2 (Credentials provider), replacing the OIDC redirect for this one flow
- Native signup via Zitadel Management API (human user creation) + Postgres family/membership bootstrap
- Generic (non-enumerating) error messaging for invalid login, duplicate signup, and password reset
- Role repopulation (`systemRoles`) via Management API grants fetch on the Credentials path
- Password-reset backend wiring for the existing `/login/reset` UI
- New `IAM_LOGIN_CLIENT` k8s Secret and its server-only usage
- Pending-invite-aware family attach on signup (attach instead of creating a duplicate family)

**Out of scope:**
- Google/Apple social login migration to native — federation always redirects to the provider's own consent screen regardless of Zitadel hosted vs. native, so there is no benefit to migrating it now
- Passkey/WebAuthn native ceremony — separate, large scope (browser WebAuthn API integration); stays on OIDC redirect this phase
- MFA enforcement UI (OTP/U2F) — org login policy does not force MFA today (confirmed live); no UI needed until the org policy changes
- Account lockout / forced password-change UI — org lockout and password-age policies are both default/disabled today (confirmed live); revisit if the org policy changes
- Client-side password complexity reimplementation — Zitadel's own policy-violation error is passed through instead (requirement 9)
- Deleting/rolling back the Zitadel user if the Postgres family-bootstrap transaction fails — handled instead via self-healing retry on next login (requirement 7)

## Constraints

- The guardian's plaintext password now transits the Kreds backend (previously it went directly from browser to Zitadel's hosted page) — TLS-only, never logged, never persisted (requirement 12 / Prohibitions).
- `IAM_LOGIN_CLIENT` becomes a new runtime dependency of the app (previously this class of secret was ops-only) — must exist as a k8s Secret in the `kreds` namespace before deploy.
- Live-confirmed Zitadel org policy (2026-07-04): password complexity = min 8 chars + upper + lower + number + symbol; lockout policy = default/disabled; password age policy = default/no forced expiry; login policy = no forced MFA (OTP/U2F optional only). Do not build UI for account states the org does not currently enforce.
- `systemRoles` fetch failure must never block a successful password check (non-blocking, same pattern as the existing `kreds_identities` upsert try/catch in `auth.ts`).
- No new client-side password validation regex — server passes through Zitadel's own policy error text.

## Acceptance Criteria

- [ ] Native email/password login succeeds via Session API v2 without any redirect to `auth.hasslab.pro`
- [ ] Wrong password and unknown email produce the identical generic error message and response shape
- [ ] `systemRoles` is populated via Management API grants fetch on successful Credentials login; a grants-fetch failure never blocks login
- [ ] Email-not-verified guardians land on `/login?error=email-not-verified` (native path matches OIDC path exactly)
- [ ] Signup creates a Zitadel user + `kreds_identities` + `families` + `family_memberships` (guardian role) and logs the user in without requiring email verification first
- [ ] Duplicate-email signup shows a generic message and creates no duplicate Zitadel user or `kreds_identities` row
- [ ] Signup email matching a pending invite attaches to the invited family instead of creating a new one
- [ ] A Postgres failure after Zitadel user creation self-heals on next login (no orphaned Zitadel user, no manual cleanup required)
- [ ] `/login/reset` triggers a real Zitadel password-reset email and shows the same generic success message for existing and non-existing emails
- [ ] Password-policy violations surface Zitadel's own error message; no Kreds-side complexity regex exists
- [ ] App fails to boot with an explicit error if `IAM_LOGIN_CLIENT` is missing/malformed
- [ ] `guardian-auth.ts`'s `loginWithProvider`/`loginWithPasskey` and `SocialAuthButtons` are unchanged in behavior

## Edge Coverage

**Coverage:** 15/18 applicable edges resolved (covered) · 3 dismissed · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| concurrency | R1 (login) | ✅ covered | Double-submit is a client-side no-op (SpinnerButton already disables during loading); concurrent Session API calls are independently harmless — see Acceptance 1 |
| empty | R2 (generic error) | ✅ covered | Server Action rejects empty email/password with the same generic message, not a 500 — see Acceptance 2 |
| encoding | R2 (email compare) | ⛔ dismissed | Delegated entirely to Zitadel's own case-insensitive email identifier handling — no Kreds-side logic |
| concurrency | R3 (roles) | ✅ covered | Grants-fetch failure never blocks login, falls back to `systemRoles=[]` — see requirement 3 / Acceptance 3 |
| unclassified | R4 (email-not-verified) | ✅ covered | Reuses exact `/login?error=email-not-verified` redirect/query string — see requirement 4 |
| concurrency | R5 (signup) | ✅ covered | Zitadel's own unique-email constraint at user-creation time is the source of truth (no separate check-then-create race) — see requirement 6 |
| empty | R6 (duplicate signup) | ✅ covered | Empty email blocked client + server, generic validation error (distinct from the duplicate-email message) |
| encoding | R6 (email compare) | ⛔ dismissed | Same as R2 encoding — delegated to Zitadel |
| unclassified | R7 (atomicity) | ✅ covered | Self-healing retry on next login rather than Zitadel-user rollback — see requirement 7 / Acceptance 7 |
| empty | R8 (no password logging) | ⛔ dismissed | Not a data-shape edge — reclassified as a Prohibition (must-NOT), see Prohibitions table |
| encoding | R8 (no password logging) | ⛔ dismissed | Same as above — reclassified as Prohibition |
| unclassified | R9 (reset) | ✅ covered | Always generic success message regardless of whether the email exists — see requirement 8 |
| unclassified | R10 (social unchanged) | ✅ covered | Dismissed as "no behavior change" is itself the covered outcome — captured as Acceptance 12/requirement 11 (no test needed beyond the unchanged-behavior acceptance criterion) |
| boundary | R11 (password policy) | ✅ covered | Delegated to Zitadel's live policy + error passthrough — no Kreds-side boundary logic to test (requirement 9) |
| empty | R11 (password policy) | ✅ covered | Duplicate of R2's empty-password handling — no separate logic |
| encoding | R11 (password policy) | ✅ covered | Delegated to Zitadel — "symbol"/unicode definition is whatever Zitadel's policy check uses |
| precision | R11 (password policy) | ✅ covered | Not applicable — no numeric rounding in a password-policy passthrough |
| unclassified | R12 (secret boot) | ✅ covered | Fail-closed boot error if `IAM_LOGIN_CLIENT` missing/malformed — see requirement 10 / Acceptance 11 |

## Prohibitions (must-NOT)

**Coverage:** 5/5 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| Guardian password must NOT appear in any log line (Pino, `console.*`, stack trace) | R12 | resolved | judgment — code review of every catch/log call touching the password variable; no mechanical negative test specified this session |
| Guardian password must NOT appear in any error message/response body returned to the client | R2, R12 | resolved | judgment — code review of every error path constructing a client-facing message |
| Guardian plaintext password must NOT be persisted to any Postgres table, column, or cache | R12 | resolved | judgment — code review confirming the password variable only reaches Session API/Management API call sites, never a `db.insert`/`db.update` or cache client |
| Signup must NOT create a new `families` row when the signup email matches an existing pending invite (`family_memberships.invitedByIdentityId` / `unique_pending_invite`) — must attach to the invited family instead | R7 | resolved | judgment — verified against the pending-invite lookup query at signup time; no automated fixture specified this session |
| Signup must NOT accept `role`, `familyId`, or any permission field from client input — the guardian membership role is always hardcoded server-side | R7 | resolved | judgment — code review of the signup Server Action's input schema (Zod) confirming no role/familyId field is read from the request body |
| `IAM_LOGIN_CLIENT` must NOT be read outside a server-only module, imported into a Client Component, or exposed via a `NEXT_PUBLIC_` prefix | R10 | resolved | judgment — code review confirming `import 'server-only'` guards the module reading this secret, consistent with existing `env.ts` conventions |

All prohibitions in this phase are non-canon (bespoke to Kreds' family/invite model and this phase's new secret) except generic user-enumeration avoidance, which is covered by the Acceptance Criteria for requirements 2/6/8 rather than minted twice here.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.88  | 0.75 | ✓      | Native Credentials login+signup only; social/passkey explicitly deferred |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Explicit in/out-of-scope lists, including why social/passkey are excluded |
| Constraint Clarity | 0.85  | 0.65 | ✓      | Org policies confirmed live (lockout/password-age/MFA all default/off; complexity policy captured) |
| Acceptance Criteria| 0.78  | 0.70 | ✓      | 12 pass/fail criteria + edge/prohibition coverage tables |
| **Ambiguity**      | 0.16  | ≤0.20| ✓      |                                    |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective    | Question summary         | Decision locked                    |
|-------|----------------|--------------------------|-------------------------------------|
| 1 | Researcher | Repopulate `systemRoles` even though unused today? | Yes — repopulate now via Management API grants fetch |
| 1 | Researcher | Which account states does the org actually enforce? | Verified live: only email-not-verified; lockout/MFA/password-age all default/off |
| 2 | Simplifier | Signup email-verification: block login or allow provisional? | Provisional login allowed despite `email_verified=false` |
| 2 | Simplifier | Signup family bootstrap: inline or separate flow? | Inline — create family+membership in the same signup flow |
| 3 | Boundary Keeper | Does social/passkey migrate to native too? | Clarified federation/WebAuthn cost; locked to "email/password native now, social/passkey stays OIDC, tracked as future roadmap item" |
| 3 | Boundary Keeper | Is `/login/reset` backend in scope? | Yes — wired to real Zitadel-backed reset flow |
| 3 | Boundary Keeper | Duplicate-email signup behavior? | Generic error + link to `/login`, no account detail leakage |
| 4 | Failure Analyst | What must NEVER happen (verifier-rejection scenario)? | Both locked: password never leaks to logs/errors; signup atomicity (no orphaned family/identity) |
| 4 | Failure Analyst | Exact UX for wrong-password vs unknown-email? | Single generic "E-mail ou senha inválidos" message, no enumeration |
| 5.5 | Edge probe | 18 edges raised across all 12 requirements | 15 covered, 3 dismissed (all delegated to Zitadel or reclassified as prohibitions) |
| 5.6 | Prohibition probe | Pending-invite collision, role injection, password persistence, secret leakage | All 6 prohibitions resolved as judgment-tier negative acceptance criteria |

---

*Phase: 12-native-guardian-login*
*Spec created: 2026-07-04*
*Next step: /gsd-discuss-phase 12 — implementation decisions (how to build what's specified above)*
