---
phase: 04
slug: child-tasks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-22
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` (raiz do projeto) |
| **Quick run command** | `npm run test -- --reporter=verbose tests/unit/child-tasks.test.tsx tests/unit/bottom-nav.test.tsx` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- tests/unit/child-tasks.test.tsx tests/unit/bottom-nav.test.tsx`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | CTASK-01..05 | — | N/A | setup | `npm run test` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | CTASK-01, CTASK-02 | — | N/A | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | CTASK-03 | — | N/A | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 1 | CTASK-04 | — | N/A | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 2 | CTASK-05 | — | N/A | unit | `npm run test -- tests/unit/bottom-nav.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/child-tasks.test.tsx` — stubs para CTASK-01, CTASK-02, CTASK-03, CTASK-04
- [ ] `tests/unit/bottom-nav.test.tsx` — stubs para CTASK-05
- [ ] `tests/setup.ts` — adicionar mock global de `IntersectionObserver` (necessário para BottomNav em jsdom)

*Infraestrutura de teste existente cobre o framework; apenas novos arquivos de teste e mock precisam ser criados.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Progress bar anima de 0% para valor correto no mount | CTASK-04 | Animação CSS não verificável em jsdom | Abrir `/child/[childId]/garden`, observar progress bar do cofrinho animar de 0 para 25% |
| Bottom nav muda ícone ativo ao scrollar | CTASK-05 | IntersectionObserver mockeado não reflete scroll real | Scrollar a página e verificar que o ícone ativo muda corretamente |
| Flores decorativas aparecem ao clicar "Plantar" | CTASK-03 | Animação CSS + estado derivado | Clicar "Plantar" → verificar que flores aparecem no jardim hero |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
