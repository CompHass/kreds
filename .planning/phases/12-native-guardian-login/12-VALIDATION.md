---
phase: 12
slug: native-guardian-login
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-07
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (installed) + Testcontainers for real-Postgres integration tests |
| **Config file** | Existing Vitest config (not modified by this phase) |
| **Quick run command** | `npx vitest run <file>` (run locally, not inside the app container — production image has no devDependencies) |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~60-120 seconds (Testcontainers spin-up included) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed-file>.test.ts`
- **After every plan wave:** Run `npx vitest run` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green + R12 manual code-review checklist
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-xx | TBD | 1 | R1 | V2/V3 | Native login via Session API v2, no OIDC redirect | unit + integration | `npx vitest run src/lib/zitadel/login-client.test.ts` | ❌ W0 | ⬜ pending |
| 12-01-xx | TBD | 1 | R2, R4 | V2 (enumeration) | Generic invalid-credentials error; email-not-verified reuse | unit | `npx vitest run src/app/actions/guardian-auth.test.ts` | ❌ W0 | ⬜ pending |
| 12-01-xx | TBD | 1 | R3 | V4 | `systemRoles` repopulated via grants fetch; failure non-blocking → `[]` | unit | `npx vitest run src/lib/auth/guardian-sync.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-xx | TBD | 2 | R5, R6, R7 | V4/V5 (role injection) | Signup + family bootstrap transaction; duplicate rejected generically; pending-invite (`guardianInvitations`) attaches instead of duplicating | integration (Testcontainers) | `npx vitest run src/app/actions/guardian-signup.test.ts` | ❌ W0 | ⬜ pending |
| 12-03-xx | TBD | 2 | R8, R9 | V2 (enumeration) | Reset request always generic; policy-violation passthrough | integration | `npx vitest run src/app/actions/guardian-reset.test.ts` | ❌ W0 | ⬜ pending |
| 12-04-xx | TBD | 1 | R10 | V6 | App fails to boot without valid `IAM_LOGIN_CLIENT` | unit | `npx vitest run src/lib/env.test.ts` | ❌ W0 (extend existing) | ⬜ pending |
| 12-xx | TBD | — | R11 | — | `loginWithProvider`/`loginWithPasskey`/`SocialAuthButtons` unchanged | manual — regression diff review | — | — | ⬜ pending |
| 12-xx | TBD | — | R12 | V2 | No password persistence to DB/cache/logs | manual — code review (judgment-tier per SPEC.md Prohibitions) | grep for `password` near `db.insert`/`console.`/`pino` call sites | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Task IDs finalized once PLAN.md files exist.*

---

## Wave 0 Requirements

- [ ] `src/lib/zitadel/login-client.test.ts` — unit tests for the new REST client (mock `fetch`), covering the 404-vs-400 catch-all
- [ ] `src/app/actions/guardian-auth.test.ts` — Credentials-path error-message tests (R2, R4)
- [ ] `src/lib/auth/guardian-sync.test.ts` — identities-upsert + family self-heal + roles-fetch helper tests (R3, R7)
- [ ] `src/app/actions/guardian-signup.test.ts` — Testcontainers integration test for the transaction + pending-invite branch (R5, R6, R7) — must query `guardianInvitations`, not `family_memberships`
- [ ] `src/app/actions/guardian-reset.test.ts` — request + confirm leg tests (R8, R9)
- [ ] Extend/create `src/lib/env.test.ts` — `IAM_LOGIN_CLIENT` fail-closed boot test (R10)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `loginWithProvider`/`loginWithPasskey`/`SocialAuthButtons` byte/behavior-identical | R11 | Regression check, not new logic — no meaningful automated assertion beyond existing tests (if any) | Diff `guardian-auth.ts` before/after this phase; confirm only `loginWithCredentials` + new signup/reset actions changed |
| No password persistence to DB/cache/logs | R12 | SPEC.md itself classifies this as judgment-tier, not mechanically testable | Code review every catch/log call and every `db.insert`/`db.update` touching the password variable in new files |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
