---
phase: 05-parent-panel
plan: "03"
subsystem: ui-components
tags: [react, client-components, tdd, parent-panel, form, accessibility]
dependency_graph:
  requires:
    - "05-01 (CATEGORY_META, Category, rewardLabel, WEEKDAY_LABELS, ALL_DAYS, ParentTask)"
    - "05-02 (TaskToggle — reutilizado como ApprovalToggle)"
  provides:
    - "CategoryChips (5 chips de categoria com aria-pressed, cor da categoria quando selecionado)"
    - "RewardStepper (botões ± 40×40px, Mordomia verde em value=0, clamp em 0)"
    - "RecurrencePills (7 pills por índice 0–6 sem colisão de labels, link Todos os dias)"
    - "AssigneeSelector (multi-seleção com aria-pressed, avatar 32px, checkmark SVG)"
    - "TaskFormPanel (painel 336px com idle/create/edit, DeleteButton condicional)"
    - "TaskFormData, EMPTY_FORM, taskToFormData (contrato consumido pelo Plano 04)"
  affects:
    - "05-04 (ParentPanelView consome TaskFormPanel + TaskFormData + taskToFormData)"
tech_stack:
  added: []
  patterns:
    - "Componentes controlados puros (recebem value + onChange, sem estado interno de domínio)"
    - "TDD RED → GREEN: 8 testes para TaskFormPanel"
    - "RecurrencePills usa seleção por índice (0–6) para evitar colisão entre labels D/S/T/Q/Q/S/S"
    - "DeleteButton render condicional {mode === 'edit' && (...)} — PTASK-10 invariante crítico"
    - "TaskToggle reutilizado como ApprovalToggle sem duplicação de código"
key_files:
  created:
    - src/components/parent/category-chips.tsx
    - src/components/parent/reward-stepper.tsx
    - src/components/parent/recurrence-pills.tsx
    - src/components/parent/assignee-selector.tsx
    - src/components/parent/task-form-panel.tsx
    - tests/unit/task-form-panel.test.tsx
  modified: []
decisions:
  - "RecurrencePills representa seleção por índice (0–6) internamente — evita colisão entre labels repetidas D/S/T/Q/Q/S/S"
  - "ApprovalToggle reutiliza TaskToggle de 05-02 diretamente (label 'Requer aprovação') — sem wrapper desnecessário"
  - "TaskFormPanel expõe data-testid='task-form-panel' no aside para testes de integração do Plano 04"
  - "CTA usa disabled + aria-disabled juntos — compatibilidade com AT e leitores de tela"
  - "Botão X presente em ambos create e edit (não apenas edit) — UX consistente: permite cancelar em qualquer momento"
metrics:
  duration: "25 minutes"
  completed_date: "2026-06-26"
  tasks_completed: 2
  files_changed: 6
---

# Phase 05 Plan 03: Task Form Panel and Sub-components Summary

5 componentes controlados de form criados em `src/components/parent/`: chips de categoria com cor dinâmica, stepper de recompensa com label Mordomia/R$, pills de recorrência com seleção por índice, seletor de atribuição multi-seleção e painel form principal com 3 estados (idle/create/edit) e DeleteButton condicional exclusivo ao modo edit.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Sub-componentes do form — CategoryChips, RewardStepper, RecurrencePills, AssigneeSelector | `1cbc883` | src/components/parent/category-chips.tsx, src/components/parent/reward-stepper.tsx, src/components/parent/recurrence-pills.tsx, src/components/parent/assignee-selector.tsx |
| 2 RED | TaskFormPanel RED test (PTASK-06, PTASK-10) | `8f314b1` | tests/unit/task-form-panel.test.tsx |
| 2 GREEN | TaskFormPanel implementation (PTASK-06, PTASK-10) | `0701609` | src/components/parent/task-form-panel.tsx |

---

## What Was Built

### Task 1 — Sub-componentes do form

**CategoryChips** (`src/components/parent/category-chips.tsx`):
- Props: `{ value: Category | null; onChange: (c: Category) => void }`
- 5 chips derivados de `CATEGORY_META` (quarto, higiene, estudos, casa, espiritual)
- Chip selecionado: `background` e `border` usam a cor da categoria (Accent item 5 do UI-SPEC)
- Chip não selecionado: bg `var(--color-kreds-card)`, border `#E2DECF`
- `aria-pressed` em cada chip

**RewardStepper** (`src/components/parent/reward-stepper.tsx`):
- Props: `{ value: number; onChange: (v: number) => void }`
- Botões `−` e `+` com `aria-label` "Diminuir recompensa" / "Aumentar recompensa", 40×40px
- `value === 0` → texto "Mordomia" em `var(--color-kreds-primary)` (verde), fontSize 18, fontWeight 700
- `value > 0` → "R$ X" em `#27372C`
- Clamp em 0: botão `−` não decrementa abaixo de zero (cursor `not-allowed` e cor `#C2C9BC`)
- Usa `rewardLabel()` de `@/lib/seed/parent-seed`

**RecurrencePills** (`src/components/parent/recurrence-pills.tsx`):
- Props: `{ value: string[]; onChange: (days: string[]) => void }`
- 7 pills com labels de `WEEKDAY_LABELS` (['D','S','T','Q','Q','S','S']), indexadas 0–6
- Seleção por índice para evitar colisão entre labels idênticas (ex: 3 ocorrências de 'S')
- Pill selecionada: bg `#3E6B4F`, texto branco; não selecionada: bg `var(--color-kreds-card)`, border `#E2DECF`
- `aria-pressed` por pill, fontSize 13, fontWeight 700
- Link "Todos os dias" chama `onChange(ALL_DAYS)` selecionando todos os 7 dias

**AssigneeSelector** (`src/components/parent/assignee-selector.tsx`):
- Props: `{ familyChildren: FamilyChild[]; value: string[]; onChange: (ids: string[]) => void }`
- Multi-seleção: clique alterna id no array `value`
- Selecionado: bg `#EEF3EA`, border `#3E6B4F`, checkmark verde SVG 16×16px
- Avatar 32px circular com inicial maiúscula sobre `accentColor`
- `aria-pressed` em cada botão de criança

### Task 2 — TaskFormPanel (TDD RED → GREEN)

**RED** (`tests/unit/task-form-panel.test.tsx`):
- 8 testes cobrindo: placeholder em idle, header/CTA/ausência-de-delete em create, header/CTA/presença-de-delete em edit, CTA desabilitado com aria-disabled, largura 336px via style inline, callbacks onSave/onDelete/onCancel

**GREEN** (`src/components/parent/task-form-panel.tsx`):
- Exporta `TaskFormData`, `EMPTY_FORM`, `taskToFormData`, `TaskFormPanel`
- Container `<aside data-testid="task-form-panel">` com `width: 336`, `flexShrink: 0`, `borderRadius: 20`, shadow `0 16px 36px -26px rgba(40,55,45,.5)`
- **Modo idle:** placeholder elegante — heading "Nova tarefa" + body "Selecione uma tarefa ou clique em + para criar", sem campos, sem DeleteButton
- **Modo create:** header "Nova tarefa" + botão X, form completo, CTA "Adicionar tarefa", **SEM** DeleteButton
- **Modo edit:** header "Editar tarefa" + botão X, form completo, CTA "Salvar alterações", **COM** DeleteButton
- CTA habilitado: bg gradiente verde `#5A8A66 → #3E6B4F`, `var(--shadow-cta)`
- CTA desabilitado: bg `#C2C9BC`, label "Selecione uma criança", `disabled` + `aria-disabled="true"`, `cursor: not-allowed`
- **DeleteButton** (`{mode === 'edit' && (...)}`) — renderizado somente em edit; bg `#FBF1EC`, border `#E6CFC4`, texto `#B14A2E`, ícone lixeira SVG `aria-hidden`; hover `#F6E4DC`
- ApprovalToggle: `<TaskToggle checked={formData.approval} ... label="Requer aprovação" />`

---

## TDD Gate Compliance

- RED commit: `8f314b1` (test(05-03): RED — suite para TaskFormPanel)
- GREEN commit: `0701609` (feat(05-03): TaskFormPanel com idle/create/edit + DeleteButton condicional)
- REFACTOR: não necessário — código limpo na fase GREEN
- 8 testes PASSANDO: ✓

---

## Deviations from Plan

### Auto-fixed Issues

Nenhum bug encontrado durante a implementação.

### Design Adjustments

**1. Botão X presente em create E edit (plano especificava só edit)**
- **Found during:** Task 2 implementação
- **Reason:** UX mais consistente — usuário pode cancelar criação de tarefa sem perder dados acidentalmente; o plano menciona botão X no header, mas o CONTEXT.md D-07 implica que o usuário pode entrar em modo create ao clicar "+ Nova tarefa" e precisar cancelar. Esta é uma melhoria mínima sem impacto no contrato de testes (onCancel já era props obrigatória).
- **Impact:** Mínimo — onCancel já era prop obrigatória. Nenhum teste quebrado.

---

## Known Stubs

Nenhum. Os componentes são puramente controlados (recebem props + callbacks). Nenhum dado hardcoded fluindo para UI — o `EMPTY_FORM` é o estado inicial correto (título vazio, sem categoria, reward 0, sem dias, sem atribuição, sem aprovação).

---

## Threat Flags

Nenhum. T-05-05 (XSS via título): `TaskTitleInput` usa `value={formData.title}` com input controlado — React escapa automaticamente. Nenhum `dangerouslySetInnerHTML` utilizado. T-05-06 (delete sem confirmação): aceito por design conforme T-05-06 disposition no threat model do plano.

---

## Self-Check: PASSED

- FOUND: src/components/parent/category-chips.tsx
- FOUND: src/components/parent/reward-stepper.tsx
- FOUND: src/components/parent/recurrence-pills.tsx
- FOUND: src/components/parent/assignee-selector.tsx
- FOUND: src/components/parent/task-form-panel.tsx
- FOUND: tests/unit/task-form-panel.test.tsx
- FOUND: commit 1cbc883 (Task 1 — sub-componentes)
- FOUND: commit 8f314b1 (TDD RED)
- FOUND: commit 0701609 (TDD GREEN)
