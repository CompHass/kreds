---
slug: child-balance-issues
status: diagnosed
trigger: manual
created: 2026-06-08
---

# Debug Session: child-balance-issues

## Symptoms

1. Clicar em "Saldo (Criança)" na tela `/family/children` redireciona para tela com título "Sylvan Growth" e menu Forest/Missions/Garden/Legacy
2. Título "Sylvan Growth" aparece no topo — nome errado
3. Botão "Plantar Novo Sonho" não faz nada
4. Responsável não sabe onde cadastrar PIN da criança

## Root Cause Report

### Bug 1 — Título "Sylvan Growth" hardcoded
**File:** `src/app/(app)/child/[childId]/balance/page.tsx:69`
**Root cause:** Texto `Sylvan Growth` hardcoded no header do componente. Nome antigo/interno do app, deveria ser "Kreds".
**Fix:** Trocar para "Kreds".

### Bug 2 — "Plantar Novo Sonho" sem funcionalidade
**File:** `src/app/(app)/child/[childId]/balance/page.tsx:236-271`
**Root cause:** `<button>` sem `onClick`. Funcionalidade de metas/sonhos (GOAL-01 a GOAL-07 em REQUIREMENTS.md) não implementada.
**Fix:** Feature não existe ainda. Botão deve mostrar estado "em breve" ou ser removido.

### Bug 3 — Tela é a view da CRIANÇA acessada pelo responsável
**File:** `src/app/(app)/child/[childId]/balance/page.tsx`
**Root cause:** A página usa `requireCurrentFamilyContext()` (sessão de responsável), então o responsável pode acessá-la. Mas a UI é a interface da criança, com nav (Forest/Missions/Garden/Legacy). O link "Saldo (Criança)" em `/family/children:295` leva propositalmente para essa view.
**Status:** Comportamento parcialmente intencional — é uma "preview" do que a criança vê. Mas confunde porque mistura rotas do responsável (`/family/dashboard`, `/family/tasks`) com rotas da criança no nav.

### Bug 4 — PIN só pode ser definido na criação do perfil
**File:** `src/app/family/children/ChildrenForm.tsx:108-125`
**Root cause:** Campo "Child PIN (optional)" existe apenas no formulário de criação. Não há UI para definir/atualizar PIN de criança já cadastrada.
**Fix:** Adicionar botão "Definir PIN" na lista de filhos em `/family/children/page.tsx`.

## Evidence

- `src/app/(app)/child/[childId]/balance/page.tsx:69` → `Sylvan Growth` hardcoded
- `src/app/(app)/child/[childId]/balance/page.tsx:236` → `<button>` sem onClick (feature não implementada)
- `src/app/(app)/child/[childId]/balance/page.tsx:18` → `requireCurrentFamilyContext()` permite acesso do responsável
- `src/app/family/children/page.tsx:295` → link `href={/child/${child.id}/balance}` rotulado "Saldo (Criança)"
- `src/app/family/children/ChildrenForm.tsx:108` → PIN só na criação, nenhum endpoint de update de PIN encontrado

## Fixes Required

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/app/(app)/child/[childId]/balance/page.tsx:69` | "Sylvan Growth" → "Kreds" |
| 2 | `src/app/(app)/child/[childId]/balance/page.tsx:236-271` | Botão "Plantar Novo Sonho" → desabilitar ou remover até feature existir |
| 3 | `src/app/family/children/page.tsx` | Adicionar botão "Definir PIN" por filho |
| 4 | Novo endpoint | `POST /api/families/children/[childId]/set-pin` para atualizar PIN |
