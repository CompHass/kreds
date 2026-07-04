# Phase 12: Native Guardian Login - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 12-native-guardian-login
**Areas discussed:** Secret shape, Credentials provider wiring, Signup flow, Password reset

---

## Which areas to discuss

| Option | Description | Selected |
|--------|-------------|----------|
| Formato do secret IAM_LOGIN_CLIENT | JSON-key file vs client_id/secret env vars | (deferred to discretion) |
| Integração do Credentials provider no auth.ts | Provider wiring, callback branching | (deferred to discretion) |
| Fluxo de signup (rota, form, bootstrap de família) | Route, form fields, family bootstrap location | (deferred to discretion) |
| Reset de senha via Zitadel | Self-service vs Management-API-triggered | (deferred to discretion) |

**User's choice:** "[No preference]" on which areas to discuss, then explicitly: "pode decidir tudo como achar melhor e qualquer coisa eu abro bug para ajustar" (decide everything with your best judgment; I'll file a bug to adjust if something's off).

**Notes:** User declined the structural confirmation question on secret shape (new dedicated Zitadel service account vs reusing `iam-admin`) and instead delegated all four areas to Claude's engineering judgment. All decisions below are Claude's recommendations, not user-confirmed choices — expect possible follow-up bug/quick-task adjustments post-implementation.

---

## Claude's Discretion

All four areas (secret shape, Credentials provider wiring, signup flow, password reset) were resolved entirely by Claude's judgment per explicit user delegation:

- **Secret shape (D-01 to D-04):** dedicated new Zitadel service account (not reusing `iam-admin`), JWT-profile key auth, single JSON-string env var `IAM_LOGIN_CLIENT` validated via zod in `env.ts`, server-only module access.
- **Credentials provider wiring (D-05 to D-09):** second provider in `auth.ts`'s existing `providers` array, `authorize()` calls Session API v2 + Management API get-user, shared identities-upsert helper extracted for both OIDC and Credentials branches, generic error message thrown in `authorize()`.
- **Signup flow (D-10 to D-14):** new `/signup` route (SSR-page + client-view pattern), email/password/confirm-password fields only (no family-name field, defaults to `'Família'`), new `src/app/actions/guardian-signup.ts` Server Action, self-healing family-membership check folded into the same shared helper as identities-upsert, "Criar conta" link updated to point to `/signup`.
- **Password reset (D-15, D-16):** Management-API-triggered email send (Kreds never sees the reset token/link), always-generic success response.

Also left to implementation-time discretion: exact error copy/text, exact `authorize()` error payload shape, exact Zod field names for signup validation, exact new service-account name/granular roles in Zitadel Console, and the exact file location of the shared identities/family-sync helper.

## Deferred Ideas

- Passkey/WebAuthn native ceremony — separate future roadmap item (already noted in SPEC.md).
- Google/Apple migration to native — no real benefit (federation always redirects to the provider), stays OIDC.
- MFA/lockout/forced-password-change UI — org doesn't enforce these today (confirmed live); revisit only if Zitadel org policy changes.
