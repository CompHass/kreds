---
phase: 04-child-tasks
plan: 02
subsystem: task-components
tags: [tdd, components, ui, tasks, accessibility]
dependency_graph:
  requires:
    - 04-01 (GardenSeed interface com savings/goal; testes RED em child-tasks.test.tsx)
  provides:
    - TaskCard (CTASK-01, CTASK-02) — toggle visual + check button 38×38px
    - TitheCard (CTASK-03) — botão Plantar / estado Feito ✓
    - SavingsCard (CTASK-04) — progress bar animada on-mount com role=progressbar
  affects:
    - src/components/tasks/task-card.tsx
    - src/components/tasks/tithe-card.tsx
    - src/components/tasks/savings-card.tsx
    - tests/unit/child-tasks.test.tsx (GREEN após este plano)
tech_stack:
  added: []
  patterns:
    - TDD GREEN phase — implementação satisfazendo contratos RED de 04-01
    - 'use client' components com inline style e CSS variables
    - Props por cima — estado de domínio não gerenciado nos filhos
    - Double requestAnimationFrame para animação CSS on-mount (SavingsCard)
    - role="checkbox" em button para satisfazer getByRole('checkbox') nos testes
key_files:
  created:
    - src/components/tasks/task-card.tsx
    - src/components/tasks/tithe-card.tsx
    - src/components/tasks/savings-card.tsx
  modified: []
decisions:
  - "role='checkbox' no button do TaskCard em vez de apenas aria-pressed — o teste usa getByRole('checkbox'), portanto o role explícito é necessário para satisfazer o contrato RED"
  - "SVG inline de flor 4 pétalas no TitheCard conforme D-10 (pétalas #C98AA0, centro #E3C57C)"
  - "double requestAnimationFrame em SavingsCard para garantir que browser renderiza width:0 antes de animar (Pitfall 3 do RESEARCH.md)"
metrics:
  duration: 10min
  completed: 2026-06-22
  tasks: 3
  files: 3
---

# Phase 04 Plan 02: Componentes TaskCard, TitheCard e SavingsCard Summary

TaskCard, TitheCard e SavingsCard implementados como client components 'use client' com inline styles, satisfazendo todos os contratos RED de CTASK-01..04; 14/14 testes GREEN; tsc verde nos novos arquivos.

## What Was Built

**Task 1 — TaskCard (CTASK-01, CTASK-02):**
Criado `src/components/tasks/task-card.tsx`. Componente recebe `task: GardenTask` e `onComplete: (taskId: string) => void`. Renderiza `<button role="checkbox">` com:
- Background `#ffffff` (pendente) / `#EEF3EA` (concluída) com transição `.3s ease`
- Borda `#EDE9DF` (pendente) / `#D6E2CC` (concluída)
- Check button 38×38px circular: borda `2px solid #D7DBCC` desmarcado, fundo `#3E6B4F` marcado com SVG checkmark branco
- `aria-pressed={task.done}`, `disabled={task.done}`, `aria-label` por estado
- Título 15px/600: `#27372C` (pendente) ou `#4E6E3E` (concluída)
- `onComplete(task.id)` disparado apenas quando `!task.done`

**Task 2 — TitheCard (CTASK-03):**
Criado `src/components/tasks/tithe-card.tsx`. Componente recebe `done: boolean` e `onPlant: () => void`. Card com background `var(--color-kreds-card)` e ícone SVG de flor 4 pétalas inline. Botão "Plantar" com `linear-gradient(135deg, #C98AA0 0%, #A55E76 100%)`; após done: background `#B07E91`, label "Feito ✓", `disabled` + `aria-disabled`. `aria-label` por estado ("Plantar dízimo" / "Dízimo plantado"). Sem estado interno.

**Task 3 — SavingsCard (CTASK-04):**
Criado `src/components/tasks/savings-card.tsx`. Componente recebe `savings: number` e `goal: number`. `useState(0)` para `barWidth` com double `requestAnimationFrame` em `useEffect` para animar de 0% até `(savings/goal)*100%`. Título "Cofrinho" 18px/700, valor "R$ {savings}" 20px/700 em `#3E6B4F`, meta "Meta: R$ {goal}" 12px/600. Track da progress bar com `role="progressbar"` / `aria-valuenow` / `aria-valuemin` / `aria-valuemax`; fill com `linear-gradient(90deg, #5A8A66 0%, #3E6B4F 100%)` e `transition: 'width .6s cubic-bezier(.2,.8,.3,1)'`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | ba13b60 | feat(04-02): criar TaskCard com toggle visual e check button (CTASK-01, CTASK-02) |
| Task 2 | a223404 | feat(04-02): criar TitheCard com botão Plantar / estado Feito (CTASK-03) |
| Task 3 | 02e6871 | feat(04-02): criar SavingsCard com progress bar animada on-mount (CTASK-04) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] role="checkbox" no button do TaskCard**
- **Found during:** Task 1 (verificação pós-implementação)
- **Issue:** O plano especificava `aria-pressed` + `aria-label` no botão para satisfazer CTASK-02, mas o contrato RED no teste usa `screen.getByRole('checkbox')` — que exige `role="checkbox"` explícito em um `<button>` (buttons têm role implícito "button", não "checkbox").
- **Fix:** Adicionado `role="checkbox"` no elemento `<button>` do TaskCard. `aria-pressed` mantido para semântica de estado. Resultado: `getByRole('checkbox')` funciona; testes passam corretamente.
- **Files modified:** `src/components/tasks/task-card.tsx`
- **Commit:** ba13b60

## TDD Gate Compliance

- RED gate: ee4243b (04-01) — PASS (testes importando módulos ausentes)
- GREEN gate: ba13b60, a223404, 02e6871 — PASS (14/14 testes passam)
- REFACTOR gate: não necessário — código limpo na primeira implementação

## Known Stubs

Nenhum stub introduzido. Os três componentes são implementações completas conforme UI-SPEC. Valores de `savings: 25` e `goal: 100` são dados de seed mockados documentados em D-15, já presentes desde o Plano 04-01.

## Threat Flags

Nenhum. Componentes são puramente visuais/UI sem acesso a rede, autenticação ou sistema de arquivos.

## Self-Check: PASSED

- [x] `src/components/tasks/task-card.tsx` existe — FOUND
- [x] `src/components/tasks/tithe-card.tsx` existe — FOUND
- [x] `src/components/tasks/savings-card.tsx` existe — FOUND
- [x] `grep -c "background: task.done ? '#EEF3EA' : '#ffffff'" task-card.tsx` = 1 — PASS
- [x] `grep -c "onComplete(task.id)" task-card.tsx` = 2 (definição + call) — PASS
- [x] `grep -c "aria-pressed" task-card.tsx` = 1 — PASS
- [x] `grep -c "linear-gradient(135deg, #C98AA0 0%, #A55E76 100%)" tithe-card.tsx` = 1 — PASS
- [x] `grep -c "role=\"progressbar\"" savings-card.tsx` = 1 — PASS
- [x] `grep -c "requestAnimationFrame" savings-card.tsx` = 3 (2 calls + declaração) — PASS
- [x] 14/14 testes passam em child-tasks.test.tsx — GREEN CONFIRMED
- [x] Commit ba13b60 existe — FOUND
- [x] Commit a223404 existe — FOUND
- [x] Commit 02e6871 existe — FOUND
