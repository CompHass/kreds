# Phase 5: Parent Panel - Pattern Map

**Mapped:** 2026-06-25
**Files analyzed:** 10 (novos/modificados)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/family/[familyId]/tasks/page.tsx` | page (Server Component) | request-response | `src/app/family/access/[familyId]/page.tsx` | exact |
| `src/components/parent/parent-panel-view.tsx` | component (Client root) | event-driven | `src/components/garden/garden-view.tsx` | exact |
| `src/components/parent/parent-task-card.tsx` | component | event-driven | `src/components/tasks/task-card.tsx` | exact |
| `src/components/parent/parent-sidebar.tsx` | component | request-response | `src/components/tasks/bottom-nav.tsx` | role-match |
| `src/components/parent/parent-topbar.tsx` | component | request-response | `src/components/garden/garden-header.tsx` | role-match |
| `src/components/parent/filter-chips.tsx` | component | event-driven | `src/components/tasks/task-card.tsx` | role-match |
| `src/components/parent/task-form-panel.tsx` | component | event-driven | `src/components/tasks/tithe-card.tsx` | role-match |
| `src/components/parent/category-icon.tsx` | component (utility) | transform | `src/components/tasks/task-card.tsx` | partial |
| `src/lib/seed/parent-seed.ts` | seed/mock data | transform | `src/lib/seed/garden-seed.ts` | exact |
| `src/lib/db/schema/index.ts` | schema (modificar) | CRUD | `src/lib/db/schema/index.ts` (existing) | exact |

---

## Pattern Assignments

### `src/app/family/[familyId]/tasks/page.tsx` (page, request-response)

**Analog:** `src/app/family/access/[familyId]/page.tsx`

**Imports pattern** (linhas 1-6):
```typescript
import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
// + adicionar: import { families } from '@/lib/db/schema'
// + adicionar: import { ParentPanelView } from '@/components/parent/parent-panel-view'
// + adicionar: import { MOCK_PARENT_TASKS } from '@/lib/seed/parent-seed'
```

**Params pattern** (linha 8-13 do analog — OBRIGATÓRIO await params):
```typescript
export default async function ParentTasksPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params   // CRITICO: params é Promise no Next.js 15+
```

**Auth pattern** (linhas 15-16):
```typescript
  const session = await auth()
  if (!session) redirect('/login')
```

**SSR query pattern** (linhas 18-25):
```typescript
  const children = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
      avatarPreset: childProfiles.avatarPreset,  // adicionar vs. analog (necessário p/ filter chips)
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))
```

**Render pattern** (linhas 27-97 do analog — adaptar para ParentPanelView):
```typescript
  return (
    <ParentPanelView
      familyId={familyId}
      familyName="Família Teste"            // TODO Fase 6: query real de families.name
      currentUserName={session.user?.name ?? ''}
      familyChildren={children}             // ATENÇÃO: NÃO usar 'children' (reservado React)
      initialTasks={MOCK_PARENT_TASKS}
    />
  )
```

**Diferenças do analog:**
- Adicionar `avatarPreset` na query de childProfiles (o analog não busca esse campo)
- Usar nome `familyChildren` na prop (não `children`)
- Pode adicionar query extra de `families.name` para breadcrumb real
- Não fazer lookup de `familyMemberships` nesta fase (banco dev sem membership data)

---

### `src/components/parent/parent-panel-view.tsx` (Client Component raiz, event-driven)

**Analog:** `src/components/garden/garden-view.tsx`

**Diretiva e imports** (linhas 1-19):
```typescript
'use client'

import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { FilterChips } from './filter-chips'
import { ParentTaskCard } from './parent-task-card'
import { TaskFormPanel } from './task-form-panel'
import { type ParentTask, MOCK_PARENT_TASKS } from '@/lib/seed/parent-seed'
```

**Interface de props** (adaptar do GardenViewProps, linhas 22-32):
```typescript
interface ParentPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  familyChildren: Array<{    // ATENÇÃO: não usar 'children' (conflito React prop)
    id: string
    displayName: string
    accentColor: string
    avatarPreset: string
  }>
  initialTasks: ParentTask[]
}
```

**Estado raiz** (linhas 34-44 do analog — adaptar):
```typescript
export function ParentPanelView({ familyId, familyName, currentUserName, familyChildren, initialTasks }: ParentPanelViewProps) {
  const [tasks, setTasks] = useState<ParentTask[]>(initialTasks)
  const [filter, setFilter] = useState<'all' | string>('all')
  // editingId: null=idle, 'new'=create mode, '<taskId>'=edit mode (D-09, Pitfall 6)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [newTaskId, setNewTaskId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM)

  // Mode derivado — sem estado separado (anti-pattern: usar boolean isCreating)
  const formMode: 'idle' | 'create' | 'edit' = editingId === 'new'
    ? 'create'
    : editingId !== null
      ? 'edit'
      : 'idle'
```

**Derivados** (linhas 44-49 do analog):
```typescript
  // Tarefas filtradas por filho selecionado
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.assigned.includes(filter))
```

**Flash kredsNew** (linha 56-63 do analog — padrão setTimeout):
```typescript
  function flashNew(id: string) {
    setNewTaskId(id)
    setTimeout(() => setNewTaskId(null), 1200)
  }
```

**Handlers de mutação otimista** (linhas 53-79 do analog — adaptar):
```typescript
  function handleToggle(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, active: !t.active } : t))
  }

  function handleCreate(data: TaskFormData) {
    const newId = crypto.randomUUID()
    const newTask: ParentTask = { id: newId, ...data, active: true }
    setTasks(prev => [...prev, newTask])
    setEditingId(null)
    flashNew(newId)
  }

  function handleEdit(data: TaskFormData) {
    setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...data } : t))
    flashNew(editingId!)
    setEditingId(null)
  }

  function handleDelete(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setEditingId(null)
  }
```

**Layout 3-colunas** (adaptar estrutura do return do analog, linhas 86-167):
```typescript
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-kreds-bg)',
      display: 'flex',
      flexDirection: 'row',   // desktop: linha (vs. coluna no mobile garden)
    }}>
      <ParentSidebar />                     {/* 80px fixo */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ParentTopbar
          familyName={familyName}
          currentUserName={currentUserName}
        />
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1 }}>          {/* área principal */}
            <FilterChips
              familyChildren={familyChildren}
              active={filter}
              onChange={setFilter}
            />
            {/* lista de task cards */}
            {filteredTasks.map(task => (
              <ParentTaskCard
                key={task.id}
                task={task}
                justAdded={newTaskId === task.id}   // D-10: flash kredsNew
                onToggle={handleToggle}
                onEdit={(id) => {
                  setEditingId(id)
                  setFormData(taskToFormData(tasks.find(t => t.id === id)!))
                }}
              />
            ))}
          </div>
          <TaskFormPanel                     /* 336px fixo */
            mode={formMode}
            formData={formData}
            onChange={setFormData}
            onSave={formMode === 'create' ? handleCreate : handleEdit}
            onDelete={handleDelete}
            editingId={editingId}
            familyChildren={familyChildren}
          />
        </div>
      </main>
    </div>
  )
```

---

### `src/components/parent/parent-task-card.tsx` (component, event-driven)

**Analog:** `src/components/tasks/task-card.tsx`

**Estrutura completa do analog** (linhas 1-89 — copiar e adaptar):
```typescript
'use client'

import type { ParentTask } from '@/lib/seed/parent-seed'
import { CategoryIcon } from './category-icon'

interface ParentTaskCardProps {
  task: ParentTask
  justAdded: boolean            // D-10: controla animação kredsNew
  onToggle: (id: string) => void
  onEdit: (id: string) => void
}

export function ParentTaskCard({ task, justAdded, onToggle, onEdit }: ParentTaskCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 'var(--radius-card-md)',    // mesmo padrão do analog: 18
        background: task.active ? '#FBFAF5' : '#F5F3ED',
        border: `1px solid ${task.active ? 'var(--color-kreds-border)' : 'var(--color-kreds-border-alt)'}`,
        animation: justAdded ? 'var(--animate-kreds-new)' : undefined,  // D-10
      }}
    >
      <CategoryIcon category={task.category} />
      {/* título */}
      {/* toggle switch 42×24px */}
      {/* botão lápis */}
    </div>
  )
}
```

**Padrão de animação kredsNew** (linha 36-37 do task-card.tsx):
```typescript
// Copiar exatamente — já usado no task-card.tsx existente:
animation: task.done ? 'var(--animate-kreds-new)' : undefined,
// Para parent-task-card: usar a prop justAdded ao invés de task.done
animation: justAdded ? 'var(--animate-kreds-new)' : undefined,
```

---

### `src/components/parent/task-form-panel.tsx` (component, event-driven)

**Analog:** `src/components/tasks/tithe-card.tsx` (padrão card com estado interno + CTA)

**Padrão de card com estado** (linhas 1-89 do tithe-card.tsx):
```typescript
'use client'

// Estrutura geral do tithe-card a replicar:
// - div container com background var(--color-kreds-card) + border var(--color-kreds-border)
// - borderRadius var(--radius-card-md)
// - padding 16-24px
// - botão CTA verde: background linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)
//   boxShadow: var(--shadow-cta)
// - botão Excluir (PTASK-10, modo edit apenas): background var(--color-kreds-orange) #B5623F

// Padrão botão CTA (linhas 65-85 do tithe-card.tsx):
<button
  style={{
    border: 'none',
    borderRadius: 'var(--radius-card-sm)',
    height: 44,
    padding: '10px 20px',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-cta)',
    background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
  }}
>
  {mode === 'create' ? 'Adicionar tarefa' : 'Salvar alterações'}
</button>
```

**Estado idle — placeholder elegante** (D-05):
```typescript
// Quando mode === 'idle': mostrar placeholder
if (mode === 'idle') {
  return (
    <div style={{ width: 336, padding: 24, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <p style={{ color: 'var(--color-kreds-muted)', fontSize: 14, textAlign: 'center' }}>
        Selecione uma tarefa ou clique em + para criar
      </p>
    </div>
  )
}
```

---

### `src/components/parent/parent-sidebar.tsx` (component, request-response)

**Analog:** `src/components/tasks/bottom-nav.tsx` (navegação fixa sem estado complexo)

**Padrão de navegação fixo** — ler `src/components/tasks/bottom-nav.tsx` para o padrão de container fixo com `position: fixed` e z-index. Adaptar para sidebar vertical 80px de largura:
```typescript
'use client'

export function ParentSidebar() {
  return (
    <aside
      style={{
        width: 80,
        minHeight: '100vh',
        background: 'var(--color-kreds-card)',
        borderRight: '1px solid var(--color-kreds-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        flexShrink: 0,   // não encolher no flex row
      }}
    >
      {/* Logo + ícones de navegação */}
    </aside>
  )
}
```

---

### `src/components/parent/parent-topbar.tsx` (component, request-response)

**Analog:** `src/components/garden/garden-header.tsx` (header com dados do usuário)

**Padrão de topbar** — adaptar para layout horizontal 64px de altura:
```typescript
'use client'

interface ParentTopbarProps {
  familyName: string
  currentUserName: string
}

export function ParentTopbar({ familyName, currentUserName }: ParentTopbarProps) {
  return (
    <header
      style={{
        height: 64,
        borderBottom: '1px solid var(--color-kreds-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: 'var(--color-kreds-card)',
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb: família em verde #3E6B4F */}
      <span style={{ color: 'var(--color-kreds-primary)', fontWeight: 700 }}>
        {familyName}
      </span>
      {/* Spacer */}
      <div style={{ flex: 1 }} />
      {/* Badge do usuário logado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--color-kreds-muted)' }}>
          {currentUserName}
        </span>
        {/* Avatar circular com inicial */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--color-kreds-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 13,
        }}>
          {currentUserName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
```

---

### `src/components/parent/filter-chips.tsx` (component, event-driven)

**Analog:** `src/components/tasks/task-card.tsx` (componente com estado selecionado/não)

**Padrão de chip selecionado vs. inativo** (linhas 33-36 do task-card.tsx — padrão de cor por estado):
```typescript
'use client'

interface FilterChipsProps {
  familyChildren: Array<{ id: string; displayName: string; accentColor: string; avatarPreset: string }>
  active: 'all' | string
  onChange: (filter: 'all' | string) => void
}

export function FilterChips({ familyChildren, active, onChange }: FilterChipsProps) {
  const allChips = [{ id: 'all', displayName: 'Todas' }, ...familyChildren]

  return (
    <div style={{ display: 'flex', gap: 8, padding: '16px 0', flexWrap: 'wrap' }}>
      {allChips.map(chip => {
        const isActive = active === chip.id
        return (
          <button
            key={chip.id}
            onClick={() => onChange(chip.id as 'all' | string)}
            style={{
              // Padrão de cor por estado — copiado do task-card.tsx linhas 33-36:
              background: isActive ? '#3E6B4F' : '#ffffff',
              border: `1px solid ${isActive ? '#3E6B4F' : 'var(--color-kreds-border)'}`,
              color: isActive ? '#ffffff' : 'var(--color-kreds-text)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {chip.displayName}
          </button>
        )
      })}
    </div>
  )
}
```

---

### `src/components/parent/category-icon.tsx` (utility component, transform)

**Analog:** `src/components/garden/plant-stage.tsx` (mapeamento de valor → SVG inline)

**Padrão de mapeamento categoria → SVG** (sem analog exato, mas seguir padrão SVG inline do projeto):
```typescript
// Todas as categorias com cor e SVG inline — sem assets externos
type Category = 'quarto' | 'higiene' | 'estudos' | 'casa' | 'espiritual'

const CATEGORY_COLORS: Record<Category, string> = {
  quarto:    '#6E9BA0',   // azul-água
  higiene:   '#C98AA0',   // rosa
  estudos:   '#E3C57C',   // dourado
  casa:      '#B5623F',   // laranja
  espiritual: '#3E6B4F',  // verde primário
}

interface CategoryIconProps {
  category: Category
  size?: number
}

export function CategoryIcon({ category, size = 40 }: CategoryIconProps) {
  const color = CATEGORY_COLORS[category]
  // SVG inline por categoria — copiar padrão SVG do tithe-card.tsx (linhas 37-51)
  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--radius-card-sm)',
      background: `${color}20`,   // 12% opacity background
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* SVG inline específico por categoria */}
    </div>
  )
}
```

---

### `src/lib/seed/parent-seed.ts` (seed/mock, transform)

**Analog:** `src/lib/seed/garden-seed.ts`

**Padrão de interface tipada** (linhas 1-21 do garden-seed.ts):
```typescript
// Copiar estrutura de garden-seed.ts exatamente:
// 1. Interface do item individual (GardenTask → ParentTask)
// 2. Interface do seed (GardenSeed → não necessário, usar ParentTask[] diretamente)
// 3. Constante MOCK_* exportada

export interface ParentTask {
  id: string
  title: string
  category: 'quarto' | 'higiene' | 'estudos' | 'casa' | 'espiritual'
  reward: number          // inteiro R$; 0 = mordomia (D-05: sem constraint > 0 no mock)
  days: string[]          // subset de ['D','S','T','Q','Q','S','S']
  assigned: string[]      // childProfile ids (string vazia no mock base)
  active: boolean
  approval: boolean
}

// Padrão de constantes múltiplas do garden-seed.ts (linhas 31-93):
export const MOCK_PARENT_TASKS: ParentTask[] = [
  {
    id: 'pt1',
    title: 'Arrumar o quarto',
    category: 'quarto',
    reward: 5,
    days: ['S', 'T', 'Q', 'Q', 'S'],
    assigned: [],
    active: true,
    approval: false,
  },
  // ... mais tasks cobrindo todas as categorias e estados
]
```

---

### `src/lib/db/schema/index.ts` (schema, CRUD — modificar)

**Analog:** próprio arquivo (adicionar colunas ao `taskTemplates` existente)

**Imports a adicionar** (linha 1-14 do schema — `jsonb` já importado na linha 9):
```typescript
// jsonb já importado: linha 9 — sem mudança necessária no import block
import {
  // ...existentes...
  jsonb,   // linha 9 — já presente
  boolean, // linha 7 — já presente
  text,    // linha 5 — já presente
} from 'drizzle-orm/pg-core'
```

**Colunas a adicionar no `taskTemplates`** (após linha 193 — campo `isActive`):
```typescript
// Adicionar ao objeto de colunas de taskTemplates (linhas 177-203):
// Inserir após: isActive: boolean('is_active').notNull().default(true),

category: text('category'),                          // nullable por padrão (sem .notNull())
days: jsonb('days').$type<string[]>(),               // nullable — array D/S/T/Q/Q/S/S
approval: boolean('approval').notNull().default(false),

// NOTA: kredsValue tem constraint > 0 (linha 198-202) — não alterar nesta fase
// Fase 6 deve fazer: ALTER TABLE task_templates DROP CONSTRAINT kreds_value_positive
//                 ou alterar para >= 0 para suportar reward = 0 (Mordomia)
```

**Pós-schema:** `pnpm db:push` (equivalente a `npx drizzle-kit push`)

---

## Shared Patterns

### Autenticação SSR
**Fonte:** `src/app/family/access/[familyId]/page.tsx` linhas 1-3, 15-16
**Aplicar a:** `src/app/family/[familyId]/tasks/page.tsx`
```typescript
import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'   // ajustar profundidade relativa

// Em qualquer Server Component protegido:
const session = await auth()
if (!session) redirect('/login')
```

### CSS Design Tokens
**Fonte:** `src/app/globals.css` linhas 1-56
**Aplicar a:** todos os componentes `src/components/parent/**`

Tokens obrigatórios para esta fase:
```typescript
// Cores
'var(--color-kreds-primary)'    // #3E6B4F — verde principal, chips ativos, CTA
'var(--color-kreds-bg)'         // #F2F0E7 — fundo da página
'var(--color-kreds-card)'       // #FBFAF5 — fundo de cards e sidebar
'var(--color-kreds-border)'     // #ECE7DB — bordas padrão
'var(--color-kreds-border-alt)' // #E2DECF — bordas alternativas
'var(--color-kreds-muted)'      // #7C8676 — texto secundário
'var(--color-kreds-orange)'     // #B5623F — botão Excluir (PTASK-10)
'var(--color-kreds-text)'       // #27372C — texto primário

// Sombras
'var(--shadow-cta)'             // botão CTA verde

// Border radius
'var(--radius-card-md)'         // 18px — cards
'var(--radius-card-sm)'         // 16px — botões CTA
'var(--radius-pill)'            // 999px — chips e pills
'var(--radius-chip)'            // 10px — chips de categoria

// Animação kredsNew (D-10, PTASK-09)
'var(--animate-kreds-new)'      // kredsNew 1.2s ease — glow ring verde
```

### Animação kredsNew
**Fonte:** `src/components/tasks/task-card.tsx` linha 36-37 + `src/app/globals.css` linha 55
**Aplicar a:** `src/components/parent/parent-task-card.tsx`
```typescript
// Padrão exato do task-card.tsx linha 36-37:
animation: justAdded ? 'var(--animate-kreds-new)' : undefined,
```

### Inline Styles (sem Tailwind para medidas pixel-perfect)
**Fonte:** `src/components/tasks/task-card.tsx` e `src/components/tasks/tithe-card.tsx` — todos usam `style={{}}` direto
**Aplicar a:** todos os componentes `src/components/parent/**`

O projeto usa CSS vars + inline styles para medidas exatas, e Tailwind apenas para utilitários globais. Não usar classes Tailwind para dimensões da sidebar, topbar ou painel direito.

### Proteção de rota /family/*
**Fonte:** `src/middleware.ts` linhas 59-68
**Aplicar a:** `/family/[familyId]/tasks` — JÁ COBERTO pelo middleware existente
```typescript
// src/middleware.ts já cobre (linha 59):
if (pathname.startsWith('/family/') || pathname.startsWith('/guardian/')) {
  // verifica presença do cookie next-auth
  // page.tsx ainda DEVE chamar auth() para re-validar
}
// NÃO alterar middleware nesta fase — /family/[familyId]/tasks já está protegido
```

---

## No Analog Found

Todos os arquivos desta fase têm analógicos próximos no codebase.

| File | Nota |
|------|------|
| `src/components/parent/category-icon.tsx` | Padrão SVG inline existe em múltiplos componentes (tithe-card, garden-header); nenhum faz mapeamento categoria→SVG exato. Usar padrão SVG inline do tithe-card.tsx linhas 37-51 como referência de estrutura. |

---

## Metadata

**Escopo de busca de analógicos:**
- `src/app/family/` — rotas SSR do guardian
- `src/app/(child)/` — rotas SSR da criança
- `src/components/garden/` — componentes raiz e sub-componentes
- `src/components/tasks/` — task cards e navegação
- `src/lib/seed/` — padrão de mock data
- `src/lib/db/schema/` — padrão de schema Drizzle
- `src/middleware.ts` — proteção de rotas
- `src/app/globals.css` — tokens CSS

**Arquivos scaneados:** 12
**Data de mapeamento:** 2026-06-25
