---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 + Playwright 1.60.0 |
| **Config file** | `vitest.config.ts` (existe) / `playwright.config.ts` (existe) |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && pnpm lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build && pnpm lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DS-01 | — | N/A (CSS only) | build smoke | `pnpm build` | ❌ Wave 0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DS-02 | — | N/A (CSS only) | manual | Browser DevTools: `document.fonts.check('700 16px "Plus Jakarta Sans"')` | ❌ Manual | ⬜ pending |
| 1-01-03 | 01 | 1 | DS-03 | — | N/A (CSS only) | build smoke | `pnpm build` + grep `animate-kreds-breath` em `.next/static/css/*.css` | ❌ Wave 0 | ⬜ pending |
| 1-01-04 | 01 | 1 | DS-04 | — | N/A (CSS only) | build smoke | `pnpm build` + grep `rounded-card-md` em `.next/static/css/*.css` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Nenhum novo arquivo de teste necessário para esta fase
- Validação primária é via `pnpm build` (CSS gerado correto) + inspeção manual no browser

*Infraestrutura existente (Vitest + Playwright) cobre as necessidades desta fase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plus Jakarta Sans renderiza em todos os textos do app | DS-02 | Fontes CSS não têm API de asserção automatizada confiável | Abrir `localhost:3000`, inspecionar DevTools → Computed → font-family deve mostrar "Plus Jakarta Sans" |
| Tokens de cor visíveis no DevTools | DS-01 | Verificação visual de design fidelity | Inspecionar `--color-kreds-primary: #3E6B4F` em Styles do `<html>` ou `:root` |
| Animações `animate-kreds-*` funcionam | DS-03 | Animações CSS requerem verificação visual | Adicionar classe `animate-kreds-breath` a um elemento na page.tsx e ver animação no browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
