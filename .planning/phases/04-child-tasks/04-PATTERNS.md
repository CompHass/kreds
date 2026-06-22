# Phase 4: Child Tasks - Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 7 (4 novos componentes + 2 modificações + 2 arquivos de teste)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/seed/garden-seed.ts` | model | transform | `src/lib/seed/garden-seed.ts` (self) | self-extension |
| `src/components/garden/garden-view.tsx` | component (root/state) | event-driven | `src/components/garden/garden-view.tsx` (self) | self-extension |
| `src/components/tasks/task-card.tsx` | component | event-driven | stub inline `garden-view.tsx` linhas 117–169 | role-match (extraído do stub) |
| `src/components/tasks/tithe-card.tsx` | component | event-driven | `src/components/garden/harvest-button.tsx` | role-match (botão de ação condicional) |
| `src/components/tasks/savings-card.tsx` | component | transform (display-only) | `src/components/garden/decorative-flowers.tsx` | partial-match (conditional render + SVG inline) |
| `src/components/tasks/bottom-nav.tsx` | component | event-driven (IntersectionObserver) | `src/components/garden/water-drops.tsx` | partial-match (useEffect + animation state) |
| `tests/unit/child-tasks.test.tsx` | test | — | `tests/unit/garden-view.test.tsx` | exact |
| `tests/unit/bottom-nav.test.tsx` | test | — | `tests/unit/garden-header.test.tsx` | exact |

---

## Pattern Assignments

### `src/lib/seed/garden-seed.ts` (model, transform — extensão)

**Analog:** self — arquivo atual em `src/lib/seed/garden-seed.ts`

**Interface atual** (linhas 11–19) — adicionar dois campos:
```typescript
export interface GardenSeed {
  childName: string
  initial: string
  coins: number
  tasks: GardenTask[]
  titheDone: boolean
  harvested: boolean
  season: 'primavera' | 'verao' | 'outono' | 'inverno'
  // ADICIONAR (Fase 4 — D-15):
  savings: number
  goal: number
}
```

**Padrão de constantes** (linhas 29–92) — cada constante `SEED_STAGE_A..D`, `SEED_TITHE`, `SEED_HARVESTED` recebe:
```typescript
// adicionar a cada objeto literal de GardenSeed:
savings: 25,
goal: 100,
```

---

### `src/components/garden/garden-view.tsx` (component root, event-driven — extensão)

**Analog:** self — arquivo atual em `src/components/garden/garden-view.tsx`

**Imports pattern** (linhas 1–14) — adicionar nada novo; novos componentes seguem o mesmo padrão de named import:
```typescript
'use client'

import { useState } from 'react'
import { GardenHeader } from './garden-header'
import { GardenHero } from './garden-hero'
// ADICIONAR (Fase 4):
import { TaskCard } from '@/components/tasks/task-card'
import { TitheCard } from '@/components/tasks/tithe-card'
import { SavingsCard } from '@/components/tasks/savings-card'
import { BottomNav } from '@/components/tasks/bottom-nav'
```

**Estado interativo** (linhas 31–35) — elevar titheDone para useState:
```typescript
// Fase 3 (read-only):
// titheDone consumido via seed.titheDone diretamente

// Fase 4 — adicionar após linha 35:
const [titheDone, setTitheDone] = useState(seed.titheDone)
```

**Handler pattern** (linhas 46–58) — seguir estrutura idêntica ao handleHarvest:
```typescript
function handleHarvest() {
  setHarvested(true)
  setShowOverlay(true)
}

// ADICIONAR (Fase 4 — D-11, CTASK-03):
function handleTithe() {
  setTitheDone(true)
}
```

**Correção de prop** (linha 92) — substituir seed.titheDone por state:
```typescript
// Antes (Fase 3):
titheDone={seed.titheDone}
// Depois (Fase 4):
titheDone={titheDone}
```

**Substituição do stub de tasks** (linhas 108–170) — trocar `<button>` inline por `<TaskCard>`:
```typescript
{/* Antes: stub de <button> inline por task */}
{/* Depois (Fase 4): */}
<div
  id="section-tasks"
  style={{
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }}
>
  {tasks.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      onComplete={handleTaskComplete}
    />
  ))}
</div>
```

**Adição dos novos cards e BottomNav** — após a seção de tasks no JSX:
```typescript
<TitheCard done={titheDone} onPlant={handleTithe} />

<div id="section-savings">
  <SavingsCard savings={seed.savings} goal={seed.goal} />
</div>

<BottomNav />
```

---

### `src/components/tasks/task-card.tsx` (component, event-driven)

**Analog:** stub inline de `garden-view.tsx` linhas 117–169 + `harvest-button.tsx` (padrão de botão de ação)

**Directive:**
```typescript
'use client'
```

**Interface de props** — seguir padrão de tipagem inline do projeto:
```typescript
import type { GardenTask } from '@/lib/seed/garden-seed'

interface TaskCardProps {
  task: GardenTask
  onComplete: (taskId: string) => void
}
```

**Core pattern** — baseado no stub existente (linhas 117–169), com design completo conforme D-07/D-08:
```typescript
export function TaskCard({ task, onComplete }: TaskCardProps) {
  return (
    <button
      onClick={() => !task.done && onComplete(task.id)}
      disabled={task.done}
      aria-pressed={task.done}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: task.done ? '#EEF3EA' : '#fff',      // D-07
        border: `1px solid ${task.done ? '#D6E2CC' : '#EDE9DF'}`, // D-07
        borderRadius: 16,
        cursor: task.done ? 'default' : 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background .3s ease, border-color .3s ease', // D-07
      }}
    >
      {/* Check button 38×38px circular — D-08 */}
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: task.done ? 'none' : '2px solid #D7DBCC',   // D-08
          background: task.done ? '#3E6B4F' : '#fff',          // D-08
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        {task.done && (
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M1 6L6 11L15 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 20 }}>{task.emoji}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: task.done ? '#4E6E3E' : '#27372C', // D-07
        }}
      >
        {task.title}
      </span>
    </button>
  )
}
```

---

### `src/components/tasks/tithe-card.tsx` (component, event-driven)

**Analog:** `src/components/garden/harvest-button.tsx` — botão de ação única com estado condicional

**Padrão do analog** (`harvest-button.tsx` linhas 10–34):
```typescript
// analog: conditional render + inline style + gradient + onAction handler
export function HarvestButton({ visible, onHarvest }: HarvestButtonProps) {
  if (!visible) return null
  return (
    <button
      onClick={onHarvest}
      style={{
        background: 'linear-gradient(135deg, #C77F52 0%, #B5623F 100%)',
        border: 'none',
        borderRadius: 999,
        minHeight: 44,
        padding: '10px 20px',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        animation: 'var(--animate-kreds-fruit)',
        boxShadow: '0 4px 12px rgba(181,98,63,.4)',
      }}
    >
      Colher Frutos
    </button>
  )
}
```

**Core pattern do TitheCard** — aplicar padrão do analog, adaptado para D-10/D-11:
```typescript
'use client'

interface TitheCardProps {
  done: boolean
  onPlant: () => void
}

export function TitheCard({ done, onPlant }: TitheCardProps) {
  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #EDE9DF',
          borderRadius: 16,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌸</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#27372C' }}>Dízimo</span>
        </div>
        {/* Botão "Plantar" — gradiente rosa D-11 */}
        <button
          onClick={() => !done && onPlant()}
          disabled={done}
          style={{
            background: done
              ? '#B07E91'                                          // D-11: estado "Feito"
              : 'linear-gradient(135deg, #C98AA0 0%, #A55E76 100%)', // D-11: gradiente rosa
            border: 'none',
            borderRadius: 999,
            minHeight: 44,
            padding: '10px 20px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 14,
            cursor: done ? 'default' : 'pointer',
          }}
        >
          {done ? 'Feito ✓' : 'Plantar'}
        </button>
      </div>
    </div>
  )
}
```

---

### `src/components/tasks/savings-card.tsx` (component, transform/display-only)

**Analog:** `src/components/garden/decorative-flowers.tsx` — display-only component sem handler, apenas visual baseado em props

**Padrão do analog** (`decorative-flowers.tsx` linhas 7–9):
```typescript
export function DecorativeFlowers({ visible }: DecorativeFlowersProps) {
  if (!visible) return null
  // ... render visual
}
```

**Diferença chave:** SavingsCard precisa de `useEffect` + `useState` para animar a progress bar a partir de 0 (Pitfall 3 do RESEARCH.md). Não há analog existente com esse padrão — usar padrão da RESEARCH.md.

**Core pattern** — D-13/D-14 + animação on-mount (Pitfall 3):
```typescript
'use client'

import { useState, useEffect } from 'react'

interface SavingsCardProps {
  savings: number
  goal: number
}

export function SavingsCard({ savings, goal }: SavingsCardProps) {
  const [barWidth, setBarWidth] = useState(0)
  const targetWidth = Math.min(100, (savings / goal) * 100)

  useEffect(() => {
    // Double rAF garante que browser renderiza width:0 antes de animar (Pitfall 3)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarWidth(targetWidth))
    })
  }, [targetWidth])

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #EDE9DF',
          borderRadius: 16,
          padding: 16,
        }}
      >
        {/* ... título e valores em R$ */}
        {/* Progress bar — D-14 */}
        <div
          style={{
            height: 12,
            borderRadius: 999,
            background: '#F0EDE6',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={savings}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-label={`Cofrinho: R$ ${savings} de R$ ${goal}`}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #5A8A66 0%, #3E6B4F 100%)',
              width: `${barWidth}%`,
              transition: 'width .6s cubic-bezier(.2,.8,.3,1)', // D-14
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

### `src/components/tasks/bottom-nav.tsx` (component, event-driven com IntersectionObserver)

**Analog:** `src/components/garden/water-drops.tsx` — componente sem props externas que usa estado interno implícito (delays em constante); porém BottomNav exige `useEffect` com Observer.

**Padrão de useEffect/cleanup** — não existe analog direto no codebase para IntersectionObserver; usar padrão documentado no RESEARCH.md Pattern 1.

**Core pattern** — D-03..D-06 + IntersectionObserver (sem analog, padrão do RESEARCH.md):
```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

type Section = 'garden' | 'tasks' | 'savings'

export function BottomNav() {
  const [active, setActive] = useState<Section>('garden')

  useEffect(() => {
    const gardenEl  = document.getElementById('section-garden')
    const tasksEl   = document.getElementById('section-tasks')
    const savingsEl = document.getElementById('section-savings')

    const sectionMap = new Map<Element, Section>()
    if (gardenEl)  sectionMap.set(gardenEl,  'garden')
    if (tasksEl)   sectionMap.set(tasksEl,   'tasks')
    if (savingsEl) sectionMap.set(savingsEl, 'savings')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = sectionMap.get(entry.target)
            if (section) setActive(section)
          }
        }
      },
      { threshold: [0, 0.1] },
    )

    sectionMap.forEach((_, el) => observer.observe(el))
    return () => observer.disconnect() // cleanup obrigatório — anti-pattern #2 do RESEARCH.md
  }, [])

  // Scroll anchor (D-05):
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: 'rgba(248,247,242,.93)',      // D-04
        backdropFilter: 'blur(8px)',              // D-04
        borderTop: '1px solid #E7E2D6',          // D-04
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        maxWidth: 392,
        margin: '0 auto',
      }}
    >
      {/* Ícone ativo: #3E6B4F; inativo: #9AA092 — D-06 */}
      {/* 4 botões: Jardim, Tarefas, Cofrinho, Doar — D-03 */}
      {/* "Doar" aria-disabled (sem rota nesta fase) — D-05 */}
    </nav>
  )
}
```

---

### `tests/unit/child-tasks.test.tsx` (test)

**Analog:** `tests/unit/garden-view.test.tsx` — padrão exato de estrutura de teste

**Imports pattern** (garden-view.test.tsx linhas 1–14):
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SEED_STAGE_C } from '../../src/lib/seed/garden-seed'
import { GardenView } from '../../src/components/garden/garden-view'
```

**Core pattern de teste** (garden-view.test.tsx linhas 16–38):
```typescript
describe('ComponentName — RequirementID', () => {
  it('comportamento esperado em português', () => {
    render(<Component props={value} />)
    // assert via screen.getByText / getByRole / queryByRole
    expect(screen.getByText('texto')).toBeInTheDocument()
  })

  it('interação dispara handler', () => {
    render(<Component onAction={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledWith('expectedArg')
  })
})
```

**Cobertura necessária** (RESEARCH.md Validation Architecture):
- CTASK-01: TaskCard bg branco vs `#EEF3EA` condicional
- CTASK-02: click no check chama `onComplete(task.id)`; tarefa concluída não dispara segundo click
- CTASK-03: TitheCard botão "Plantar" chama `onPlant`; label muda para "Feito ✓"
- CTASK-04: SavingsCard exibe savings e goal; `role="progressbar"` com `aria-valuenow`

---

### `tests/unit/bottom-nav.test.tsx` (test)

**Analog:** `tests/unit/garden-header.test.tsx` — testes simples de render + `toBeInTheDocument`

**Mock obrigatório** — adicionar ao `tests/setup.ts` (Pitfall 2 do RESEARCH.md):
```typescript
// tests/setup.ts — adicionar ANTES dos imports de testing-library:
globalThis.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(public callback: IntersectionObserverCallback) {}
} as unknown as typeof IntersectionObserver
```

**Core pattern** (garden-header.test.tsx linhas 1–23):
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../../src/components/tasks/bottom-nav'

describe('BottomNav (CTASK-05)', () => {
  it('renderiza 4 botões de navegação', () => { ... })
  it('"Jardim" está ativo por padrão', () => { ... })
  it('"Doar" tem aria-disabled', () => { ... })
})
```

---

## Shared Patterns

### 1. Client Component Directive
**Source:** `src/components/garden/garden-view.tsx` linha 1 / `src/components/garden/harvest-button.tsx` linha 1
**Apply to:** `task-card.tsx`, `tithe-card.tsx`, `savings-card.tsx`, `bottom-nav.tsx`
```typescript
'use client'
```

### 2. Inline Style com CSS Variables
**Source:** `src/components/garden/garden-view.tsx` linhas 66–77 e `src/components/garden/water-drops.tsx` linhas 14–22
**Apply to:** Todos os novos componentes — sem Tailwind, sem CSS modules
```typescript
style={{
  background: 'var(--color-kreds-bg)',
  border: '1px solid var(--color-kreds-border)',
  borderRadius: 16,
}}
```

### 3. Props por cima — sem estado interno nos filhos
**Source:** `src/components/garden/garden-view.tsx` linhas 29–58 (estado centralizado) + `src/components/garden/decorative-flowers.tsx` (apenas props, sem useState)
**Apply to:** `task-card.tsx`, `tithe-card.tsx` — recebem estado + handler do GardenView; não criam useState próprio

### 4. Padrão de Handler Setter
**Source:** `src/components/garden/garden-view.tsx` linhas 46–58
**Apply to:** `handleTithe` no GardenView — mesma estrutura de `handleHarvest` e `handleTaskComplete`
```typescript
function handleTithe() {
  setTitheDone(true)
}
```

### 5. CSS Animation via CSS Variable
**Source:** `src/components/garden/harvest-button.tsx` linha 28 / `src/components/garden/water-drops.tsx` linha 22
**Apply to:** Qualquer animação nos novos componentes (ex: glow em task concluída)
```typescript
animation: 'var(--animate-kreds-new)'  // kredsNew 1.2s ease
animation: 'var(--animate-kreds-drop)' // kredsDrop — já definido em globals.css
```

### 6. Padrão de Teste com @testing-library
**Source:** `tests/unit/garden-view.test.tsx` + `tests/unit/garden-header.test.tsx`
**Apply to:** `child-tasks.test.tsx`, `bottom-nav.test.tsx`
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
// describe em português; imports relativos de ../../src/
```

---

## No Analog Found

Todos os arquivos desta fase têm analogs suficientes no codebase. Os casos abaixo são "partial-match" mas suficientes para implementação:

| File | Role | Motivo |
|------|------|--------|
| `src/components/tasks/bottom-nav.tsx` (IntersectionObserver) | component | Nenhum componente existente usa IntersectionObserver; usar padrão do RESEARCH.md Pattern 1 |
| `src/components/tasks/savings-card.tsx` (double rAF) | component | Nenhum componente usa rAF para animar on-mount; usar padrão do RESEARCH.md Pitfall 3 |

---

## Metadata

**Analog search scope:** `src/components/garden/`, `src/lib/seed/`, `tests/unit/`, `tests/setup.ts`
**Files scanned:** 8 (garden-view.tsx, garden-seed.ts, decorative-flowers.tsx, harvest-button.tsx, water-drops.tsx, garden-view.test.tsx, garden-header.test.tsx, setup.ts)
**Pattern extraction date:** 2026-06-22
