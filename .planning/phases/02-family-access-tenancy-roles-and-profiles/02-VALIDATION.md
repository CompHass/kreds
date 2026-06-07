---
phase: 02
slug: family-access-tenancy-roles-and-profiles
status: planned
nyquist_compliant: true
wave_0_complete: planned
created: 2026-06-06
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x, Playwright 1.60.x, Drizzle Kit |
| **Config file** | `vitest.config.ts`, `playwright.config.ts`, `drizzle.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm build` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | FAM-01, FAM-02, FAM-03, FAM-04, FAM-05, FAM-06, FAM-07 | T-02-W0 | Validation scaffolds exist before feature code | unit/integration/e2e | `pnpm test -- tests/unit/family-authorization.test.ts tests/unit/family-constants.test.ts tests/unit/family-invitations.test.ts` | planned by 02-01 | ⬜ pending |
| 02-02-01 | 02 | 1 | FAM-01 | T-02-01 | Auth.js/ZITADEL env and route are configured without collecting child data | unit/build | `pnpm test -- tests/unit/family-authorization.test.ts && pnpm build` | planned | ⬜ pending |
| 02-03-01 | 03 | 2 | FAM-01, FAM-04, FAM-05, FAM-07 | T-02-02 | Schema supports identity, memberships, family_id isolation, and audit | migration/integration | `pnpm db:generate && pnpm db:push && pnpm test -- tests/integration/family-tenancy.test.ts` | planned | ⬜ pending |
| 02-04-01 | 04 | 3 | FAM-01, FAM-04, FAM-05, FAM-07 | T-02-03 | Family creation maps ZITADEL identity to Kreds guardian membership and redirects to first child setup | unit/integration | `pnpm test -- tests/unit/family-authorization.test.ts tests/integration/family-tenancy.test.ts` | planned | ⬜ pending |
| 02-05-01 | 05 | 4 | FAM-03, FAM-04, FAM-05, FAM-06, FAM-07 | T-02-04 | Child profiles collect only allowed fields, are guardian-managed, and soft-deactivate | unit/integration | `pnpm test -- tests/unit/family-constants.test.ts tests/integration/family-child-profiles.test.ts` | planned | ⬜ pending |
| 02-06-01 | 06 | 4 | FAM-02, FAM-04, FAM-05, FAM-07 | T-02-05 | Guardian invitation lifecycle records pending, accepted, expired, revoked, and declined states | unit/integration | `pnpm test -- tests/unit/family-invitations.test.ts tests/integration/family-invitations.test.ts` | planned | ⬜ pending |
| 02-07-01 | 07 | 5 | FAM-01, FAM-02, FAM-03, FAM-04, FAM-05, FAM-06, FAM-07 | T-02-06 | Parent-facing flows preserve family isolation and audit visibility end to end | e2e/build | `pnpm test && pnpm build` | planned | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is explicitly planned as `02-01-PLAN.md`. It creates the failing test scaffolds and fixtures before feature implementation:

- [ ] Add unit/integration test coverage for family-scoped authorization helpers and membership lookup.
- [ ] Add schema/domain tests for guardian invitations, child profiles, soft deactivation, and audit events.
- [ ] Add API/route tests or component-level tests for onboarding and family-scoped access where practical.
- [ ] Add privacy inventory validation assertion for child age in years, explicit consent evidence, and future optional child identity readiness.
- [ ] Existing infrastructure covers test runner installation; no new test framework install is expected.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ZITADEL hosted login UX | FAM-01 | External IdP behavior may not be fully reproducible in local automated tests without configured test tenant credentials | Verify local app redirects/authenticates with configured ZITADEL test credentials if available; otherwise verify mocked/session boundary tests are green and document the missing live IdP check. |
| Email delivery for guardian invitations | FAM-02 | Email transport may be stubbed in v1 planning/execution | Verify invitation records and token acceptance in automated tests; if real email is not configured, document transport as stubbed. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references through `02-01-PLAN.md`
- [x] No watch-mode flags
- [x] Feedback latency target < 120s for targeted checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned; execution closes checkboxes when tests exist and pass.
