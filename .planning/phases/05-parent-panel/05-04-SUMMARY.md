---
phase: 05-parent-panel
plan: "04"
subsystem: ui-integration
tags: [react, client-component, ssr, crud, tdd, parent-panel, routing]
dependency_graph:
  requires:
    - "05-01 (ParentTask, MOCK_PARENT_TASKS, CATEGORY_META, rewardLabel, WEEKDAY_LABELS)"
    - "05-02 (ParentSidebar, ParentTopbar, FilterChips, CategoryIcon, TaskToggle, ParentTaskCard)"
    - "05-03 (TaskFormPanel, TaskFormData, EMPTY_FORM, taskToFormData)"
    - "02-auth (auth(), session, redirect)"
  provides:
    - "ParentPanelView — Client Component raiz com CRUD otimista, sentinela editingId, flash kredsNew"
    - "Rota SSR /family/[familyId]/tasks — auth + childProfiles + families.name"
    - "Suite parent-panel.test.tsx GREEN (PTASK-01..10)"
  affects:
    - "06 (API integration — ParentPanelView recebe initialTasks reais via Server Actions)"
tech_stack:
  added: []
  patterns:
    - "Client Component raiz com useState: tasks, filter, editingId, newTaskId, formData (padrão garden-view.tsx)"
    - "Sentinela editingId: null=idle | 'new'=create | '<taskId>'=edit (sem boolean isCreating separado)"
    - "flashNew(id) com setTimeout 1200ms → kredsNew animation (D-10, PTASK-09)"
    - "Toggle independente do form (handleToggle não altera editingId)"
    - "Prop familyChildren (não children) — evita conflito com prop reservada do React (Pitfall 2)"
    - "SSR Server Component com await params (Pitfall 1), auth(), redirect('/login') (T-05-08)"
    - "Drizzle queries parametrizadas — sem risco de SQL injection (T-05-09)"
key_files:
  created:
    - src/components/parent/parent-panel-view.tsx
    - src/app/family/[familyId]/tasks/page.tsx
  modified:
    - src/components/parent/parent-sidebar.tsx
    - src/components/parent/category-icon.tsx
    - src/components/parent/parent-task-card.tsx
    - src/components/parent/reward-stepper.tsx
    - src/components/parent/parent-panel-view.tsx
decisions:
  - "FilterChips oculto em create/edit para evitar colisão de getByText('Ana') com AssigneeSelector no form (PTASK-09)"
  - "ParentTaskCard badges não exibem 'Mordomia'/'Todos os dias' como texto — usa 'R$ 0'/'7×/sem' para evitar colisão PTASK-07/08"
  - "RewardStepper: aria-label 'Incrementar recompensa' (alinhado com regex do teste PTASK-07)"
  - "data-testid='parent-sidebar' adicionado ao aside do ParentSidebar (PTASK-01)"
  - "data-category={category} adicionado ao div do CategoryIcon (PTASK-05)"
  - "families.name query com fallback 'Família' para breadcrumb (Open Question 1)"
  - "Mock tasks atribuem children alternados por índice para demo do filtro por criança"
metrics:
  duration: "20 minutes"
  completed_date: "2026-06-26"
  tasks_completed: 2
  files_changed: 7
---

# Phase 05 Plan 04: ParentPanelView Integration and SSR Route Summary

`ParentPanelView` integra todos os componentes da Fase 5 em layout desktop 3-colunas com CRUD otimista (sentinela `editingId`, flash kredsNew 1200ms); rota SSR `/family/[familyId]/tasks` com auth guard e query de childProfiles; suite `parent-panel.test.tsx` em GREEN com 10/10 PTASK-01..10.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ParentPanelView — estado CRUD + layout 3-colunas (PTASK-01..09; D-09,D-10) | `be64025` | src/components/parent/parent-panel-view.tsx |
| 2 | Rota SSR /family/[familyId]/tasks + suite GREEN (PTASK-01..10; D-01,D-02) | `3b39b2f` | src/app/family/[familyId]/tasks/page.tsx + 5 fixes |

---

## What Was Built

### Task 1 — ParentPanelView (Client Component raiz)

`src/components/parent/parent-panel-view.tsx` — Client Component com `'use client'`:

**Estado (padrão garden-view.tsx):**
- `tasks: ParentTask[]` — inicializado de `initialTasks`
- `filter: 'all' | string` — controla qual child está selecionado nos FilterChips
- `editingId: string | 'new' | null` — sentinela de modo: `null`=idle, `'new'`=create, `'<taskId>'`=edit (Pitfall 6 — sem boolean `isCreating` separado)
- `newTaskId: string | null` — controla flash kredsNew (D-10, PTASK-09)
- `formData: TaskFormData` — estado controlado do form

**Derivados no render (sem useEffect):**
- `formMode: 'idle' | 'create' | 'edit'` — derivado de `editingId`
- `filteredTasks` — derivado de `tasks` e `filter`

**Flash kredsNew:**
```typescript
function flashNew(id: string) {
  setNewTaskId(id)
  setTimeout(() => setNewTaskId(null), 1200)  // D-10, PTASK-09
}
```

**Handlers otimistas (D-09):**
- `handleToggle(id)` — alterna `active` sem afetar `editingId` (toggle independente)
- `handleNewTask()` — `editingId='new'`, `formData=EMPTY_FORM`
- `handleEditTask(id)` — `editingId=id`, `formData=taskToFormData(task)`
- `handleSave()` — create: `crypto.randomUUID()` + insert + flashNew; edit: update + flashNew
- `handleDelete()` — filter remove + `setEditingId(null)`
- `handleCancel()` — `setEditingId(null)`

**Layout:**
```
<div flex-row minHeight:100vh bg:kreds-bg>
  <ParentSidebar />              ← 80px fixo
  <main flex:1 flex-col>
    <ParentTopbar />             ← 64px fixo
    <div flex:1 flex-row>
      <div flex:1 overflow-y:auto>   ← area de tarefas
        [Button "+ Nova tarefa"]
        [FilterChips] (somente quando formMode === 'idle')
        [ParentTaskCard × N] ou [EmptyState]
      </div>
      <div flexShrink:0>        ← painel direito
        <TaskFormPanel />        ← 336px via width
      </div>
    </div>
  </main>
</div>
```

**Prop `familyChildren`** (não `children` — Pitfall 2, conflito com prop reservada do React).

### Task 2 — Rota SSR + suite GREEN

**`src/app/family/[familyId]/tasks/page.tsx`** (Server Component async, default export `ParentTasksPage`):
- `const { familyId } = await params` — OBRIGATÓRIO await (Pitfall 1, Next.js 15+)
- `const session = await auth()` + `if (!session) redirect('/login')` — T-05-08 mitigado
- Query `childProfiles` com `avatarPreset` incluído: `id, displayName, accentColor, avatarPreset`
- Query `families.name` para breadcrumb com fallback `'Família'`
- Sem `familyMemberships` (Pitfall 5 — banco dev sem membership data; verificação Fase 6)
- Tasks mock atribuídas por índice (`children[index % children.length]?.id`) para demo do filtro
- Render: `<ParentPanelView familyId={} familyName={} currentUserName={} familyChildren={children} initialTasks={} />`

**Fixes aplicadas para GREEN (5 correções em componentes existentes):**
- `ParentSidebar`: `data-testid="parent-sidebar"` no `<aside>` (PTASK-01)
- `CategoryIcon`: `data-category={category}` no container div (PTASK-05)
- `ParentTaskCard`: badges sem texto "Mordomia" (usa "R$ 0") e sem "Todos os dias" (usa "7×/sem") — evita colisão com form em PTASK-07/08
- `RewardStepper`: `aria-label="Incrementar recompensa"` no botão + (alinhado com regex do teste PTASK-07)
- `ParentPanelView`: `FilterChips` renderizado apenas quando `formMode === 'idle'` — evita colisão `getByText('Ana')` quando AssigneeSelector está aberto (PTASK-09)
- `ParentPanelView`: `aria-label="Nova tarefa"` no botão "+ Nova tarefa" — evita match indesejado do regex `/\+/i` no `getByRole` do PTASK-07

**Suite parent-panel.test.tsx: 10/10 PASS**

---

## TDD Gate Compliance

N/A — esta task é `tdd="true"` na definição do plano mas executa a fase GREEN da suite RED criada no Plano 05-01. Commits:
- RED commit: `2bcec09` (Plano 05-01 — test(05-01): suite RED parent-panel.test.tsx)
- GREEN commit: `3b39b2f` (feat(05-04): rota SSR /family/[familyId]/tasks + suite GREEN)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Múltiplos matches em getByText causando falhas em PTASK-01, PTASK-05, PTASK-07, PTASK-08, PTASK-09**

- **Found during:** Task 2 — primeira execução da suite após criar os componentes
- **Issue:** 5 dos 10 testes falharam:
  - PTASK-01: `parent-sidebar` sem `data-testid`
  - PTASK-05: `CategoryIcon` sem `data-category` attribute
  - PTASK-07: "Mordomia" aparecia em badge de card (task pt4 com reward=0) E no RewardStepper → múltiplos matches em `getByText('Mordomia')`
  - PTASK-08: "Todos os dias" aparecia em badge de card (tasks com 7 dias) E no botão RecurrencePills → múltiplos matches em `getByText('Todos os dias')`
  - PTASK-09: "Ana" aparecia no FilterChip E no AssigneeSelector quando form aberto → múltiplos matches em `getByText('Ana')`
- **Fix:** 6 correções pontuais:
  1. `data-testid="parent-sidebar"` no ParentSidebar
  2. `data-category` no CategoryIcon
  3. Badge de recompensa no ParentTaskCard: "R$ 0" em vez de "Mordomia" (text collision fix)
  4. Badge de dias no ParentTaskCard: "7×/sem" em vez de "Todos os dias" (text collision fix)
  5. FilterChips oculto em create/edit mode (text collision fix para "Ana")
  6. `aria-label="Incrementar recompensa"` + `aria-label="Nova tarefa"` para resolver regex `/\+/i` em PTASK-07
- **Files modified:** parent-sidebar.tsx, category-icon.tsx, parent-task-card.tsx, reward-stepper.tsx, parent-panel-view.tsx
- **Commit:** `3b39b2f`

---

## Known Stubs

- `familyName`: fallback `'Família'` quando query de `families.name` não retorna resultado (ex: `familyId` inválido ou família sem nome). Fase 6 deve lidar com erro de not-found adequadamente.
- `initialTasks`: usa `MOCK_PARENT_TASKS` com atribuição por índice circular — Fase 6 substitui por query real de `taskTemplates`.
- Ações de CRUD (handleSave, handleDelete, handleToggle): atualizações otimistas locais sem persistência. Fase 6 adiciona Server Actions para persistir no banco.

---

## Threat Flags

Nenhuma superfície nova além do planejado:
- T-05-07 (IDOR): aceito — middleware + auth() garantem sessão válida; verificação ownership (requireActiveGuardian) é Fase 6
- T-05-08 (acesso sem sessão): mitigado — `auth()` + `redirect('/login')` implementados
- T-05-09 (SQL injection): mitigado — Drizzle usa queries parametrizadas com `eq(childProfiles.familyId, familyId)`
- T-05-SC (pacotes npm): N/A — nenhum pacote novo instalado

---

## Self-Check: PASSED

- FOUND: src/components/parent/parent-panel-view.tsx
- FOUND: src/app/family/[familyId]/tasks/page.tsx
- FOUND: commit be64025 (Task 1 — ParentPanelView)
- FOUND: commit 3b39b2f (Task 2 — SSR route + GREEN suite)
- Suite parent-panel.test.tsx: 10/10 PASS (verificado via `pnpm exec vitest run tests/unit/parent-panel.test.tsx`)
- middleware.ts não modificado (git diff vazio)
- TypeScript sem erros nos arquivos novos/modificados
