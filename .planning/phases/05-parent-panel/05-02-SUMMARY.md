---
phase: 05-parent-panel
plan: "02"
subsystem: ui-components
tags: [react, client-components, tdd, parent-panel, accessibility]
dependency_graph:
  requires:
    - "05-01 (ParentTask interface, CATEGORY_META, rewardLabel, MOCK_PARENT_TASKS)"
  provides:
    - "ParentSidebar (80px sidebar com nav icons SVG inline + avatar)"
    - "ParentTopbar (64px header com breadcrumb verde + badge usuário)"
    - "FilterChips (chips Todas + por criança, aria-pressed, chip ativo verde)"
    - "CategoryIcon (5 categorias com SVG inline e cores do CATEGORY_META)"
    - "TaskToggle (switch 42×24px acessível, role=switch, aria-checked)"
    - "ParentTaskCard (card com CategoryIcon, TaskToggle, EditButton, flash kredsNew)"
  affects:
    - "05-03 (ParentPanelView consome todos estes componentes)"
    - "05-04 (TaskFormPanel reutiliza TaskToggle como ApprovalToggle)"
tech_stack:
  added: []
  patterns:
    - "SVG inline por categoria com lookup no CATEGORY_META (color + softBg)"
    - "Prop justAdded → animation var(--animate-kreds-new) (padrão kredsNew D-10)"
    - "TDD RED → GREEN no ParentTaskCard: 6 testes passando"
    - "Cliente Component 'use client' com inline styles + CSS vars (padrão do projeto)"
    - "aria-label obrigatório em todos os botões sem texto visível"
key_files:
  created:
    - src/components/parent/parent-sidebar.tsx
    - src/components/parent/parent-topbar.tsx
    - src/components/parent/filter-chips.tsx
    - src/components/parent/category-icon.tsx
    - src/components/parent/task-toggle.tsx
    - src/components/parent/parent-task-card.tsx
    - tests/unit/parent-task-card.test.tsx
  modified: []
decisions:
  - "CategoryIcon importa CATEGORY_META de @/lib/seed/parent-seed para obter color/softBg — sem duplicação de constantes"
  - "ParentTaskCard tem data-testid='parent-task-card' para compatibilidade com PTASK-09 no parent-panel.test.tsx"
  - "Teste RGB: React converte #3E6B4F para rgb(62, 107, 79) no DOM — matcher ajustado para aceitar ambos formatos"
metrics:
  duration: "25 minutes"
  completed_date: "2026-06-26"
  tasks_completed: 3
  files_changed: 7
---

# Phase 05 Plan 02: UI Components Shell and Task Card Summary

6 componentes de apresentação criados em `src/components/parent/`: sidebar desktop 80px, topbar 64px com breadcrumb verde, chips de filtro por criança, ícone de categoria SVG inline com 5 variantes coloridas, switch acessível 42×24px e card de tarefa com flash kredsNew via prop `justAdded`.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ParentSidebar + ParentTopbar (PTASK-01, PTASK-02) | `ab2199d` | src/components/parent/parent-sidebar.tsx, src/components/parent/parent-topbar.tsx |
| 2 | FilterChips + CategoryIcon + TaskToggle (PTASK-03, PTASK-05, PTASK-04) | `8f1985f` | src/components/parent/filter-chips.tsx, src/components/parent/category-icon.tsx, src/components/parent/task-toggle.tsx |
| 3 RED | ParentTaskCard RED test (PTASK-04, PTASK-05, PTASK-09) | `fb57fa0` | tests/unit/parent-task-card.test.tsx |
| 3 GREEN | ParentTaskCard implementation (PTASK-04, PTASK-05, PTASK-09) | `32408a3` | src/components/parent/parent-task-card.tsx |

---

## What Was Built

### Task 1 — ParentSidebar + ParentTopbar

**ParentSidebar** (`src/components/parent/parent-sidebar.tsx`):
- `<aside>` com largura fixa 80px, `minHeight: 100vh`, `flexShrink: 0`
- Logo 40×40px com gradiente verde (`linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)`)
- 5 botões de nav 44×44px com SVG inline e `aria-label` obrigatório (Tarefas, Crianças, Jardim, Relatórios, Configurações)
- Primeiro ícone (Tarefas) ativo: bg `#E7EFE8`, stroke `#3E6B4F` (Accent item 8 do UI-SPEC)
- Avatar 38px circular no rodapé com `marginTop: 'auto'`

**ParentTopbar** (`src/components/parent/parent-topbar.tsx`):
- `<header>` com `height: 64`, `flexShrink: 0`
- Breadcrumb: `familyName` em `color: 'var(--color-kreds-primary)'`, fontWeight 700, fontSize 15
- Spacer `flex: 1`
- Badge usuário: pill branco com border `#ECE7DB`, nome em muted + avatar circular 32px com inicial maiúscula

### Task 2 — FilterChips + CategoryIcon + TaskToggle

**FilterChips** (`src/components/parent/filter-chips.tsx`):
- Props: `familyChildren`, `active`, `onChange`
- Renderiza chip "Todas" + um por criança; `aria-pressed={isActive}` em cada botão
- Chip ativo: bg `#3E6B4F`, texto branco; chip inativo: bg `#FBFAF5`, border `#E2DECF`
- Mini avatar 24px (inicial sobre `accentColor`) nos chips de criança

**CategoryIcon** (`src/components/parent/category-icon.tsx`):
- Props: `{ category: Category; size?: number }` (default 44px)
- Importa `CATEGORY_META` de `@/lib/seed/parent-seed` para `color` e `softBg`
- Renderiza container `borderRadius: 13` com fundo `softBg` + SVG inline específico por categoria
- 5 SVGs distintos: quarto (cama), higiene (escova), estudos (livro), casa (home), espiritual (cruz)
- Todos os SVGs com `aria-hidden="true"`

**TaskToggle** (`src/components/parent/task-toggle.tsx`):
- Props: `{ checked, onChange, label }`
- `<button role="switch" aria-checked={checked} aria-label={label}>`
- Track 42×24px, bg `#3E6B4F` (checked) / `#D7DBCC` (unchecked), `transition: background .2s ease`
- Knob 18×18px branco, `position: absolute`, `left: checked ? 20 : 3`, `transition: left .2s ease`

### Task 3 — ParentTaskCard (TDD RED → GREEN)

**RED** (`tests/unit/parent-task-card.test.tsx`):
- 6 testes cobrindo: independência toggle/lápis (PTASK-04), cor de categoria no DOM (PTASK-05), animation kredsNew em justAdded=true (PTASK-09), ausência de animation em justAdded=false, opacity e border em estados inactive/editing, título e rewardLabel visíveis

**GREEN** (`src/components/parent/parent-task-card.tsx`):
- Props: `{ task: ParentTask; justAdded: boolean; editing: boolean; onToggle, onEdit }`
- Container `data-testid="parent-task-card"` para testes PTASK-09
- `animation: justAdded ? 'var(--animate-kreds-new)' : undefined` — padrão exato do task-card.tsx
- `opacity: task.active ? 1 : 0.5` para estado inativo
- `border: editing ? '#3E6B4F' : 'var(--color-kreds-border)'`, `background: editing ? '#F4F8F2' : '#FBFAF5'`
- EditButton 32×32px: `aria-label='Editar tarefa: {title}'`, `aria-pressed={editing}`, estado visual verde quando editing
- TaskToggle: `onChange={() => onToggle(task.id)}` — completamente independente do onEdit

---

## TDD Gate Compliance

- RED commit: `fb57fa0` (test(05-02): adicionar suite RED para ParentTaskCard)
- GREEN commit: `32408a3` (feat(05-02): implementar ParentTaskCard com flash kredsNew)
- REFACTOR: não necessário — código já limpo na fase GREEN
- 6 testes PASSANDO: ✓

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Matcher de teste com hex vs RGB**

- **Found during:** Task 3 (fase GREEN — primeiro run dos testes)
- **Issue:** O teste verificava `#3E6B4F` no style attribute do DOM, mas o React converte `border: '#3E6B4F'` para `rgb(62, 107, 79)` ao renderizar em jsdom. O teste falhou com "expected string to match /#3E6B4F/i".
- **Fix:** Regex do matcher ajustada para `/#3E6B4F|rgb\(62,\s*107,\s*79\)/i` — aceita ambos formatos.
- **Files modified:** `tests/unit/parent-task-card.test.tsx`
- **Commit:** `32408a3` (incluído no commit GREEN)

---

## Known Stubs

Nenhum. Todos os 6 componentes são "burros" (recebem props + callbacks); nenhum gerencia estado de lista. Os dados fluem do `ParentPanelView` (Plano 03) para estes componentes.

---

## Threat Flags

Nenhum. Componentes puramente visuais — renders via JSX text node (XSS prevenido automaticamente pelo React). Nenhum `dangerouslySetInnerHTML` utilizado. T-05-03 mitigado.

---

## Self-Check: PASSED

- FOUND: src/components/parent/parent-sidebar.tsx
- FOUND: src/components/parent/parent-topbar.tsx
- FOUND: src/components/parent/filter-chips.tsx
- FOUND: src/components/parent/category-icon.tsx
- FOUND: src/components/parent/task-toggle.tsx
- FOUND: src/components/parent/parent-task-card.tsx
- FOUND: tests/unit/parent-task-card.test.tsx
- FOUND: commit ab2199d (ParentSidebar + ParentTopbar)
- FOUND: commit 8f1985f (FilterChips + CategoryIcon + TaskToggle)
- FOUND: commit fb57fa0 (RED test)
- FOUND: commit 32408a3 (GREEN implementation)
