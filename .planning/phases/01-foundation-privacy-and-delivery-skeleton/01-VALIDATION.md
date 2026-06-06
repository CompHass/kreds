---
phase: 1
slug: foundation-privacy-and-delivery-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (unit), testcontainers 12.x (integration), playwright 1.60.x (E2E) |
| **Config file** | Wave 0 installs vitest.config.ts, playwright.config.ts, testcontainers setup |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test:ci` (unit + integration + E2E) |
| **Estimated runtime** | ~60-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test:ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds for unit tests

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01-01 | 1 | FND-01 | T-01-01 | Config files created; TypeScript compiles | unit | `npx tsc --noEmit` exits 0 | ❌ W0 | ⬜ pending |
| 01-01-T2 | 01-01 | 1 | FND-01 | T-01-SC | Human verifies all packages on npmjs.com before install | manual | (blocking human checkpoint) | — | ⬜ pending |
| 01-01-T3 | 01-01 | 1 | FND-01 | — | pnpm install succeeds; dev server starts; /api/health returns 200 | e2e | `pnpm install && (pnpm dev &) && sleep 8 && curl -sf localhost:3000/api/health \| grep status` | ❌ W0 | ⬜ pending |
| 01-01-T4 | 01-01 | 1 | FND-02 | — | Migration SQL generated; families table applied; GET /api/families returns []; page renders family count | integration | `ls drizzle/*.sql && curl -sf localhost:3000/api/families` | ❌ W0 | ⬜ pending |
| 01-02-T1 | 01-02 | 2 | FND-02, FND-03 | — | Test infrastructure files exist; Testcontainers verifies families table queryable post-migration | integration | `ls vitest.config.ts playwright.config.ts tests/integration/db-connection.test.ts && pnpm vitest run tests/integration/db-connection.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | FND-03 | T-01-03, T-01-05 | Docker multi-stage build succeeds with non-root user; docker-compose starts PostgreSQL | ci | `docker build -t kreds:test . && docker-compose up -d` | ❌ W0 | ⬜ pending |
| 01-03-T1 | 01-03 | 2 | FND-04, FND-05 | T-01-04 | Privacy inventory and glossary docs exist; glossary terms accessible as typed TS constants | unit | `test -f docs/PRIVACY-INVENTORY.md && pnpm vitest run tests/unit/glossary.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — vitest configuration
- [ ] `playwright.config.ts` — playwright E2E configuration
- [ ] `test/` directory structure — unit, integration, e2e subdirs
- [ ] `pnpm add -D vitest @vitest/coverage-v8` — unit test framework
- [ ] `pnpm add -D @playwright/test` — E2E test framework
- [ ] `pnpm add -D testcontainers` — integration test infrastructure
- [ ] `drizzle-kit` installed and configured for migrations

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker image runs in Kubernetes | FND-03 | Requires K8s cluster or kind/minikube | Deploy image to local cluster, verify pod starts |
| Privacy inventory completeness | FND-04 | Legal/domain review needed | Review PRIVACY-INVENTORY.md against COPPA requirements |
| Terminology accuracy | FND-05 | Domain expert review | Verify glossary matches theological and product intent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-06-06
