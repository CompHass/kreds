---
phase: 03
slug: child-garden
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 + @testing-library/react + jsdom |
| **Config file** | `vitest.config.ts` (raiz do projeto) |
| **Quick run command** | `pnpm test tests/unit/garden-*.test.*` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds (unit only) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test tests/unit/garden-*.test.*`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | GARD-03 | — | N/A | unit | `pnpm test tests/unit/garden-stage.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | GARD-01 | — | N/A | unit | `pnpm test tests/unit/garden-header.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 0 | GARD-02 | — | N/A | unit | `pnpm test tests/unit/garden-hero.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 0 | GARD-04 | — | N/A | unit | `pnpm test tests/unit/garden-hero.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 0 | GARD-09 | — | N/A | unit | `pnpm test tests/unit/garden-hero.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 0 | GARD-05,GARD-08 | — | N/A | unit | `pnpm test tests/unit/garden-view.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 0 | GARD-06 | — | N/A | unit | `pnpm test tests/unit/garden-season.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-08 | 01 | 0 | GARD-07 | — | N/A | unit | `pnpm test tests/unit/garden-bubble.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-09 | 01 | 0 | GARD-10 | T-03-01 | Overlay acessível apenas com child-session válido (middleware) | unit | `pnpm test tests/unit/garden-celebration.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/garden-stage.test.ts` — stub para GARD-03 (getPlantStage função pura)
- [ ] `tests/unit/garden-header.test.tsx` — stub para GARD-01 (GardenHeader)
- [ ] `tests/unit/garden-hero.test.tsx` — stubs para GARD-02, GARD-04, GARD-09 (GardenHero, WaterTracker, DecorativeFlowers)
- [ ] `tests/unit/garden-view.test.tsx` — stubs para GARD-05, GARD-08 (GardenView interatividade, HarvestButton)
- [ ] `tests/unit/garden-season.test.ts` — stub para GARD-06 (SeasonBadge)
- [ ] `tests/unit/garden-bubble.test.ts` — stub para GARD-07 (SpeechBubble)
- [ ] `tests/unit/garden-celebration.test.tsx` — stub para GARD-10 (CelebrationOverlay)

*Framework já instalado — vitest, @testing-library/react, jsdom — nenhum pacote adicional necessário.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Animações CSS (kredsSun, kredsDrift, kredsPop, kredsConfetti) visualmente corretas | GARD-02, GARD-03, GARD-10 | CSS animations não verificáveis via jsdom | Abrir /child/[id]/garden no browser; observar sol girando, nuvens drifting, confetes no overlay |
| Transição de portão → jardim (D-03) sem flash | GARD-02 | Timing de animação (1s cubic-bezier) | Fazer login como criança; portão deve fechar suavemente antes do jardim aparecer |
| Overlay confetes distribução visual (20 elementos) | GARD-10 | Posicionamento visual não testável via unit | Clicar "Colher" com canHarvest=true; verificar 20 confetes espalhados na tela |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
