---
phase: 05
slug: parent-panel
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-25
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 |
| **Config file** | `vitest.config.ts` (existente) |
| **Quick run command** | `pnpm test -- tests/unit/parent-panel.test.tsx` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~8 seconds (quick) / ~30 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- tests/unit/parent-panel.test.tsx`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-T1 | 01 | 1 | PTASK-05 | T-05-03 | Schema fields nullable/default — sem breaking change | manual | `npx drizzle-kit push` (autonomous: false) | ✅ schema/index.ts | ⬜ pending |
| 05-01-T2 | 01 | 1 | PTASK-05 | — | N/A | manual | `npx drizzle-kit push` exits 0 | ✅ schema after push | ⬜ pending |
| 05-01-T3 | 01 | 1 | PTASK-07/08 | — | N/A | unit RED | `pnpm test -- tests/unit/parent-panel.test.tsx \| grep -Eq 'Cannot find module\|failed\|FAIL'` | ❌ W0 creates | ⬜ pending |
| 05-01-T4 | 01 | 1 | PTASK-05 | — | N/A | unit | `pnpm test -- tests/unit/parent-panel.test.tsx` exits RED | ✅ after T3 | ⬜ pending |
| 05-02-T1 | 02 | 2 | PTASK-01/02 | T-05-01 | Sidebar sem ações privilegiadas expostas | visual | `pnpm build` exits 0 | ✅ components created | ⬜ pending |
| 05-02-T2 | 02 | 2 | PTASK-03/04 | — | N/A | unit | `pnpm test -- tests/unit/parent-panel.test.tsx` — FilterChips renders chips | ✅ filter-chips.tsx | ⬜ pending |
| 05-02-T3 | 02 | 2 | PTASK-05/09 | T-05-02 | Toggle não expõe taskId em URL | unit | `pnpm test -- tests/unit/parent-panel.test.tsx` — TaskCard renders kredsNew | ✅ parent-task-card.tsx | ⬜ pending |
| 05-03-T1 | 03 | 3 | PTASK-06/07/08 | T-05-04/05 | Form não submete sem título; DeleteButton ausente em modo Create | unit | `pnpm test -- tests/unit/parent-panel.test.tsx` — TaskFormPanel states | ✅ task-form-panel.tsx | ⬜ pending |
| 05-03-T2 | 03 | 3 | PTASK-10 | T-05-05 | Botão Excluir só aparece em modo Edit | unit | `pnpm test -- tests/unit/parent-panel.test.tsx` — delete button hidden in create | ✅ after T1 | ⬜ pending |
| 05-04-T1 | 04 | 4 | PTASK-01..10 | T-05-01..07 | SSR auth() protege rota; redirect para /login se não autenticado | unit+visual | `pnpm test` exits 0 GREEN | ✅ parent-panel-view.tsx | ⬜ pending |
| 05-04-T2 | 04 | 4 | PTASK-01..10 | T-05-06 | familyId vem do auth() session, não de URL param não verificado | unit | `pnpm test` exits 0 | ✅ page.tsx | ⬜ pending |
| 05-04-T3 | 04 | 4 | PTASK-01..10 | — | N/A | manual | Checkpoint visual — responsável verifica UX no browser | ✅ após T1+T2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/parent-panel.test.tsx` — stubs RED para PTASK-05/07/08/09/10 (criado em 05-01 Task 3)

*Nota: framework Vitest já instalado; sem novas dependências nesta fase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Layout 1180px: sidebar 80px + área principal + painel direito 336px | PTASK-01 | Dimensões pixel-perfect requerem inspeção visual no browser | Abrir `/family/[familyId]/tasks` em 1180px, inspecionar com devtools |
| kredsNew glow ring 1.2s ao salvar tarefa | PTASK-09 | Animação CSS temporal não capturável por Vitest | Criar tarefa e observar glow ring no card recém-adicionado |
| Filter chip selecionado em verde com mini avatar | PTASK-03/04 | Interação visual/CSS | Clicar em chip de filho e observar estado selecionado |
| `drizzle-kit push` aceita schema sem erros | PTASK-05 | Requer banco de dados local ativo | Rodar `npx drizzle-kit push` e confirmar exit 0 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (parent-panel.test.tsx)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-25
