# Phase 4: Child Tasks - Research

**Researched:** 2026-06-22
**Domain:** React components (task cards, bottom nav, savings card, tithe card) — extensão de GardenView existente; sem novas dependências externas
**Confidence:** HIGH (codebase verificado diretamente; padrões confirmados em código existente)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Estrutura de Página**
- **D-01:** Página única `/child/[childId]/garden` — scroll vertical com hero do jardim (já existente) → lista de tarefas → card dízimo → card cofrinho → bottom nav fixo. Não há rota separada `/tasks`.
- **D-02:** `GardenView` (client component existente) é o componente raiz que gerencia todo o estado: `tasks`, `titheDone`, `savings`, `harvested`. Novos componentes de Fase 4 recebem state + handlers por props.

**Bottom Nav**
- **D-03:** Bottom nav fixo 80px, 4 ícones: Jardim, Tarefas, Cofrinho, Doar.
- **D-04:** Fundo `rgba(248,247,242,.93)`, `backdrop-filter: blur(8px)`, `border-top: 1px solid #E7E2D6`.
- **D-05:** Navegação por scroll anchor: "Jardim" → topo da página, "Tarefas" → seção de task cards, "Cofrinho" → card de cofrinho. "Doar" fica desabilitado/placeholder (sem rota nesta fase).
- **D-06:** Ícone ativo usa IntersectionObserver para alternar estado: ao carregar, "Jardim" fica ativo (verde `#3E6B4F`). Ao scrollar para a seção de tarefas, "Tarefas" fica ativo. Ícone inativo usa stroke `#9AA092`.

**Task Cards**
- **D-07:** Card pendente: `bg #fff`, `border #EDE9DF`. Card concluído: `bg #EEF3EA`, `border #D6E2CC`. Título pendente `#27372C`, concluído `#4E6E3E`. Transição `background .3s ease, border-color .3s ease`.
- **D-08:** Botão check 38×38px, `border-radius: 50%`. Desmarcado: `border #D7DBCC`, bg branco. Marcado: `bg #3E6B4F`, SVG checkmark branco. Ao marcar: chama `handleTaskComplete(taskId)` existente no GardenView (aciona rega + pop na planta).
- **D-09:** Task card inclui emoji + título. Sub (segundo texto) é Claude's Discretion — pode mostrar recompensa ou deixar vazio nesta fase.

**Card de Dízimo**
- **D-10:** Card de dízimo aparece logo abaixo da lista de task cards. Ícone de flor (SVG ou emoji 🌸), título "Dízimo".
- **D-11:** Botão "Plantar": gradiente rosa `#C98AA0 → #A55E76`. Após clicar: `bg #B07E91`, label muda para "Feito ✓". Ação: seta `titheDone = true` no GardenView state — ativa flores decorativas no jardim hero (GARD-09, já implementado na Fase 3).
- **D-12:** Estado "Feito ✓" é visual apenas (sem POST ao backend). `titheDone` já existe no `GardenSeed` e no estado do `GardenView`.

**Card de Cofrinho**
- **D-13:** Card de cofrinho aparece abaixo do card de dízimo. Exibe: meta (`goal`) em R$, valor salvo (`savings`) em R$, progress bar.
- **D-14:** Progress bar: 12px height, `border-radius: 999px`, gradiente `#5A8A66 → #3E6B4F`. Transição `width .6s cubic-bezier(.2,.8,.3,1)`.
- **D-15:** Valores mockados adicionados ao `GardenSeed`: `savings: number` e `goal: number`. Valor padrão: `savings: 25`, `goal: 100`. Todas as constantes existentes (SEED_STAGE_A..D, SEED_TITHE, SEED_HARVESTED) ganham esses campos.

### Claude's Discretion
- Texto secundário nos task cards (ex: recompensa, data) — pode omitir ou mostrar emoji + recompensa mockada.
- Ícones SVG do bottom nav — usar SVG inline ou lib de ícones seguindo padrão já adotado no projeto.
- Comportamento exato do scroll anchor (smooth scroll, offset de 80px pelo nav fixo).
- Texto/subtítulo do card de dízimo e cofrinho além dos especificados no design handoff.

### Deferred Ideas (OUT OF SCOPE)
- **Backend real** — buscar tarefas, dízimo e cofrinho da criança via API. Fase 6: API Integration.
- **Ícone "Doar"** — sem design/rota definida. Fase futura ou Fase 6.
- **Rota /savings separada** — cofrinho como página própria. Não necessário nesta fase (scroll anchor suficiente).
- **GARD-05 (drops ao concluir tarefa)** — animação de 5 drops animados (`kredsDrop`). Listado como pendente em REQUIREMENTS.md — verificar se já entregue na Fase 3 ou escopo da Fase 4.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CTASK-01 | Lista de task cards com visual distinto para pendente (branco) e concluído (verde suave `#EEF3EA`) | TaskCard component com bg e border condicionais; transição CSS .3s ease; substituição do stub de task buttons no GardenView |
| CTASK-02 | Botão check circular 38×38px toggle — desmarcado (borda `#D7DBCC`) e marcado (bg `#3E6B4F` + check branco) | Check button como elemento acessível; touch target 44×44px via padding; aria-pressed para toggle state |
| CTASK-03 | Card de dízimo com ícone flor, botão "Plantar" gradiente rosa, estado "Feito ✓" após clicar | TitheCard component; handleTithe() adicionado ao GardenView; titheDone elevado de seed read-only para useState interativo |
| CTASK-04 | Card de cofrinho com meta, valor salvo e progress bar animada (`.6s cubic-bezier`) | SavingsCard component; GardenSeed interface extendida com savings/goal; progress bar com CSS transition on mount |
| CTASK-05 | Bottom nav fixo (80px) com 4 ícones: Jardim, Tarefas, Cofrinho, Doar — ativo verde `#3E6B4F` | BottomNav component com IntersectionObserver para active state; scroll anchor via scrollIntoView smooth; jsdom mock para testes |
</phase_requirements>

---

## Summary

A Fase 4 é uma fase de UI pura: sem novas rotas, sem chamadas de backend, sem novas dependências npm. Toda a implementação é extensão do `GardenView` existente em `src/components/garden/garden-view.tsx` — adicionando estado interativo (`titheDone` como `useState`, campos `savings`/`goal` na interface `GardenSeed`) e criando 4 novos componentes em `src/components/tasks/` (TaskCard, TitheCard, SavingsCard, BottomNav).

O padrão de implementação é idêntico ao das Fases 1–3: inline `style={{...}}` com `var(--color-kreds-*)`, client components que recebem handlers por props do GardenView, sem Tailwind utilities, sem biblioteca de componentes. A única novidade técnica é o `IntersectionObserver` no `BottomNav` para detectar qual seção está visível e atualizar o ícone ativo — o padrão React oficial é `useEffect` com `observer.observe(ref.current)` + cleanup `observer.disconnect()`.

A UI-SPEC já está aprovada e fornece especificação pixel-perfect de todos os componentes. O planner pode estruturar os planos diretamente a partir das seções de componentes do UI-SPEC. Ordem natural: (1) extensão de GardenSeed + GardenView state, (2) TaskCard + substituição do stub, (3) TitheCard, (4) SavingsCard, (5) BottomNav com IntersectionObserver.

**Primary recommendation:** Criar `src/components/tasks/` com os 4 componentes em ordem de dependência (TaskCard primeiro, BottomNav último). Não instalar nenhuma dependência nova.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Task card toggle | Browser / Client | — | Interação local; estado gerenciado no GardenView (client component) |
| Tithe card button | Browser / Client | — | Seta titheDone=true localmente; ativa DecorativeFlowers já existente |
| Savings progress bar | Browser / Client | — | Display-only a partir de mock data; animação CSS on mount |
| Bottom nav IntersectionObserver | Browser / Client | — | Observa seções DOM; não depende de servidor |
| Scroll anchor navigation | Browser / Client | — | scrollIntoView nativo; sem roteamento de URL |
| GardenSeed data | Frontend Server (SSR) | — | Server Component (garden page) fornece seed; GardenView usa como props iniciais |

---

## Standard Stack

### Core

Nenhuma dependência nova. Stack já instalado:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 | Client components, useState, useRef, useEffect | Já instalado — padrão do projeto |
| Next.js | 16.2.7 | App Router, Server/Client boundary | Já instalado |
| TypeScript | 6.0.3 | Tipagem dos novos componentes | Já instalado |

**IntersectionObserver:** Web API nativa — não requer npm package. [VERIFIED: MDN / verificado no código existente do projeto que usa a API diretamente]

### Sem instalações necessárias

Esta fase não instala nenhum pacote externo. Todos os recursos necessários existem no projeto:
- CSS variables de tokens: `globals.css` @theme (Phase 1)
- Keyframes de animação: `globals.css` (Phase 1) — `kredsNew`, `kredsPop` prontos para uso
- `handleTaskComplete`: já implementado no `GardenView`
- `DecorativeFlowers`: já implementado, condicionado a `titheDone`
- `WaterDrops` + `kredsDrop` keyframe: já implementado em `water-drops.tsx`

---

## Package Legitimacy Audit

> Nenhum pacote externo a instalar nesta fase. Seção não aplicável.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
GardenPage (Server Component)
    └─ seed = SEED_STAGE_C (mock)
    └─ verse (DB query)
         │
         ▼
    GardenView (Client Component — raiz de estado)
         │
         ├─ state: tasks, waterTick, showPop, harvested, showOverlay
         ├─ state: titheDone [NOVO — elevado de seed para useState]
         │
         ├─ [section-garden] GardenHeader + GardenHero
         │       └─ titheDone prop → DecorativeFlowers (já existente)
         │
         ├─ [section-tasks] TaskCard list [NOVO]
         │       ├─ props: task, onComplete=handleTaskComplete
         │       └─ onClick → handleTaskComplete(taskId) → waterTick++ + kredsPop
         │
         ├─ TitheCard [NOVO]
         │       └─ props: done=titheDone, onPlant=handleTithe
         │
         ├─ [section-savings] SavingsCard [NOVO]
         │       └─ props: savings=seed.savings, goal=seed.goal
         │
         └─ BottomNav [NOVO — position:fixed]
                 └─ IntersectionObserver observa 3 sections
                 └─ active state → icon color #3E6B4F vs #9AA092
```

### Recommended Project Structure

```
src/
├── components/
│   ├── garden/          # existente (Fase 3) — apenas modificações ao garden-view.tsx
│   │   ├── garden-view.tsx    # estender: titheDone useState + handleTithe
│   │   └── ...
│   └── tasks/           # NOVO (Fase 4)
│       ├── task-card.tsx
│       ├── tithe-card.tsx
│       ├── savings-card.tsx
│       └── bottom-nav.tsx
└── lib/
    └── seed/
        └── garden-seed.ts     # estender: savings + goal em GardenSeed interface
tests/
└── unit/
    ├── child-tasks.test.tsx    # NOVO — TaskCard, TitheCard, SavingsCard
    └── bottom-nav.test.tsx     # NOVO — BottomNav com IntersectionObserver mock
```

### Pattern 1: IntersectionObserver no BottomNav

**What:** Observer único que observa múltiplos refs de seção; callback atualiza estado `activeSection`
**When to use:** Detectar qual seção está visível no viewport para atualizar ícone ativo
**Example:**
```typescript
// Source: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useEffect.md
'use client'
import { useEffect, useRef, useState } from 'react'

type Section = 'garden' | 'tasks' | 'savings'

export function BottomNav() {
  const [active, setActive] = useState<Section>('garden')
  const gardenRef = useRef<HTMLElement | null>(null)
  const tasksRef  = useRef<HTMLElement | null>(null)
  const savingsRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Buscar seções pelo id após montagem
    gardenRef.current  = document.getElementById('section-garden')
    tasksRef.current   = document.getElementById('section-tasks')
    savingsRef.current = document.getElementById('section-savings')

    const sectionMap = new Map<Element, Section>([
      [gardenRef.current!,  'garden'],
      [tasksRef.current!,   'tasks'],
      [savingsRef.current!, 'savings'],
    ])

    const observer = new IntersectionObserver(
      (entries) => {
        // Pegar a seção mais visível (primeira que está intersecting)
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = sectionMap.get(entry.target)
            if (section) setActive(section)
          }
        }
      },
      { threshold: [0, 0.1] }
    )

    sectionMap.forEach((_, el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // ... render com active state
}
```

### Pattern 2: titheDone elevado para useState

**What:** `titheDone` hoje é `seed.titheDone` (read-only). Fase 4 o eleva para estado interativo.
**When to use:** Sempre que um campo do seed precisa ser mutável pelo usuário nesta sessão.

```typescript
// Antes (Fase 3) — read-only do seed:
titheDone={seed.titheDone}

// Depois (Fase 4) — estado interativo:
const [titheDone, setTitheDone] = useState(seed.titheDone)
function handleTithe() { setTitheDone(true) }
// Passar titheDone (state) em vez de seed.titheDone ao GardenHero
```

### Pattern 3: Progress bar com animação on-mount

**What:** Largura do fill parte de 0 e anima para o percentual calculado via CSS transition.
**When to use:** SavingsCard — única interação de animação sem trigger de evento.

```typescript
// SavingsCard: progress bar anima de 0% para computed% no mount
// Usar CSS transition na propriedade width, não animation keyframe
<div
  style={{
    height: 12,
    borderRadius: 'var(--radius-pill)',
    background: 'linear-gradient(90deg, #5A8A66 0%, #3E6B4F 100%)',
    width: `${Math.min(100, (savings / goal) * 100)}%`,
    transition: 'width .6s cubic-bezier(.2,.8,.3,1)',
  }}
/>
// Para animar a partir de 0 no mount, iniciar com width: 0 e usar useEffect
// para setar o valor final após primeira renderização
```

### Pattern 4: Stub de task buttons substituído por TaskCard

**What:** O GardenView atual tem um stub mínimo de `<button>` inline para cada task (lines 116–170). A Fase 4 substitui isso por `<TaskCard>`.
**When to use:** Este é o momento de remover o stub — TaskCard implementa a spec completa (CTASK-01, CTASK-02).

```typescript
// Remover stub inline do GardenView e substituir por:
import { TaskCard } from '@/components/tasks/task-card'

// Na seção de tarefas:
<div id="section-tasks" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
  {tasks.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      onComplete={handleTaskComplete}
    />
  ))}
</div>
```

### Anti-Patterns to Avoid

- **Criar novo useState dentro de TaskCard:** TaskCard não gerencia estado próprio — o estado `task.done` vive no GardenView. O TaskCard recebe o task completo via props e chama `onComplete(task.id)` no click. [VERIFIED: codebase — padrão "props por cima" estabelecido na Fase 3]
- **IntersectionObserver sem cleanup:** Sempre retornar `observer.disconnect()` no return do useEffect para evitar memory leaks quando BottomNav desmonta. [VERIFIED: react.dev useEffect docs]
- **Recriar IntersectionObserver no re-render:** O useEffect do observer deve ter array de dependências `[]` (sem dependências) — o observer é criado uma vez na montagem. [CITED: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useEffect.md]
- **Usar transform no wrapper pai do BottomNav:** `position: fixed` quebra quando um ancestral tem `transform`, `will-change: transform`, ou `filter` aplicados. O GardenView usa `display: flex + flexDirection: column` sem transforms — seguro. [ASSUMED]
- **Redefinir keyframes em componentes:** Todos os keyframes já existem em `globals.css`. Usar por `animation: var(--animate-kreds-new)` sem redefinir. [VERIFIED: codebase]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animação glow no card após completar tarefa | Nova keyframe CSS | `--animate-kreds-new` (`kredsNew 1.2s ease`) em `globals.css` | Já existe; aplicar por inline style `animation: var(--animate-kreds-new)` |
| Animação kredsPop na planta | Nova lógica de animação | `handleTaskComplete` existente em GardenView já dispara `setShowPop(true)` + kredsPop via `key={waterTick}` em WaterDrops | Já implementado na Fase 3 |
| Water drops na conclusão de tarefa | Novo componente | `WaterDrops` remontado via `key={waterTick}` — já funcional | GARD-05 já implementado na Fase 3 via `WaterDrops` |
| Polyfill para scrollIntoView | Custom scroll lib | `element.scrollIntoView({ behavior: 'smooth' })` nativo | Suportado em todos os targets do projeto |
| Biblioteca de ícones externa | `lucide-react` ou similar | SVG inline (padrão estabelecido nas Fases 1–3; UI-SPEC confirma) | Sem nova dependência; ícones são simples |

**Key insight:** Toda a gamificação (drops, pop, glow) está implementada na Fase 3. A Fase 4 apenas expõe as triggers existentes para os task cards com design completo.

---

## Critical State Analysis: GARD-05 Status

O REQUIREMENTS.md lista GARD-05 como **Pending** (Phase 3). Porém ao verificar o código:

- `WaterDrops` component existe em `src/components/garden/water-drops.tsx` — implementado.
- `GardenView` usa `key={waterTick}` para remontar `WaterDrops` a cada tarefa concluída.
- O comentário inline no `GardenView` diz: "WaterDrops remontado via key={waterTick} para replay da animação (GARD-05)".

**Conclusão:** GARD-05 está implementado na Fase 3, mas o REQUIREMENTS.md ainda mostra como Pending (provavelmente não foi atualizado). O `pop na planta` (kredsPop) também está implementado via `setShowPop(true)`. A Fase 4 não precisa implementar GARD-05 — apenas substituir o stub de task buttons por TaskCard para conectar corretamente ao `handleTaskComplete`.

---

## Common Pitfalls

### Pitfall 1: titheDone passado como seed read-only em vez de state

**What goes wrong:** GardenHero recebe `titheDone={seed.titheDone}` (Linha 92 do garden-view.tsx atual). Se o planner esquecer de elevar para `useState`, clicar em "Plantar" atualiza o state mas `DecorativeFlowers` não aparece.
**Why it happens:** `titheDone` já existe como campo do seed; é fácil esquecer que precisa de um setter.
**How to avoid:** Wave 0 do plano deve incluir a elevação de `titheDone` para `useState` e a mudança do prop de `seed.titheDone` para o state value. Verificar que GardenHero recebe o state, não o seed.
**Warning signs:** `DecorativeFlowers` não aparece após clicar "Plantar"; ausência de `setTitheDone` no GardenView.

### Pitfall 2: IntersectionObserver não existe no jsdom

**What goes wrong:** Vitest + jsdom não tem `IntersectionObserver` nativo. Testes do `BottomNav` falham com "IntersectionObserver is not defined".
**Why it happens:** jsdom implementa apenas um subconjunto do browser API.
**How to avoid:** Adicionar mock ao `tests/setup.ts` antes dos testes do BottomNav:
```typescript
// tests/setup.ts — adicionar:
globalThis.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(public callback: IntersectionObserverCallback) {}
  // Para testar active state: invocar this.callback(entries, this) manualmente no teste
}
```
**Warning signs:** Erro "IntersectionObserver is not a constructor" ao rodar `vitest run`.

### Pitfall 3: Progress bar não anima a partir de 0

**What goes wrong:** A progress bar renderiza diretamente no percentual final sem animação, porque o browser aplica o `transition` mas a largura já está no valor final desde o primeiro paint.
**Why it happens:** CSS `transition` só anima mudanças de valor — se o componente monta com o valor final, não há transição.
**How to avoid:** Usar `useEffect` com `useState` para iniciar em 0 e setar para o valor final após o mount:
```typescript
const [barWidth, setBarWidth] = useState(0)
const targetWidth = Math.min(100, (savings / goal) * 100)
useEffect(() => {
  // Frame duplo garante que o browser aplica o estado inicial (0%) antes de animar
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setBarWidth(targetWidth))
  })
}, [targetWidth])
```
**Warning signs:** Progress bar aparece no valor correto mas sem transição animada.

### Pitfall 4: padding-bottom de 80px no GardenView — verificar que persiste

**What goes wrong:** O BottomNav (position: fixed) oculta o conteúdo final da página se não houver padding-bottom suficiente.
**Why it happens:** Elements com position:fixed saem do fluxo normal; o scroll não considera sua altura.
**How to avoid:** O `GardenView` já tem `paddingBottom: 80` (linha 74 do arquivo atual). Verificar que este padding é mantido após as adições da Fase 4. Não remover ao refatorar.
**Warning signs:** O `SavingsCard` fica parcialmente oculto atrás do BottomNav ao scrollar para baixo.

### Pitfall 5: Tarefas já concluídas permitem re-click

**What goes wrong:** `handleTaskComplete` no GardenView aumenta `waterTick` a cada chamada — se task done re-clica, dispara WaterDrops e pop desnecessários.
**Why it happens:** O stub atual tem `disabled={task.done}` mas um `TaskCard` mal implementado pode não respeitar isso.
**How to avoid:** TaskCard deve ter `onClick` que só chama `onComplete` se `!task.done`, e o botão check deve ter `aria-disabled` / `pointer-events: none` quando `task.done === true`. [VERIFIED: garden-view.tsx linha 120 — padrão já estabelecido no stub]

---

## Code Examples

Padrões verificados diretamente no codebase:

### Padrão de animação kredsNew no card (CTASK-01)
```typescript
// Source: src/app/globals.css — --animate-kreds-new: kredsNew 1.2s ease
// Aplicar ao card task recém-concluído via inline style:
<div
  style={{
    // ... estilos do card ...
    animation: task.justCompleted ? 'var(--animate-kreds-new)' : undefined,
  }}
/>
```

### Extensão da interface GardenSeed (D-15)
```typescript
// Source: src/lib/seed/garden-seed.ts — interface atual
export interface GardenSeed {
  childName: string
  initial: string
  coins: number
  tasks: GardenTask[]
  titheDone: boolean
  harvested: boolean
  season: 'primavera' | 'verao' | 'outono' | 'inverno'
  // ADICIONAR (Fase 4):
  savings: number
  goal: number
}

// Todas as constantes (SEED_STAGE_A..D, SEED_TITHE, SEED_HARVESTED) ganham:
// savings: 25, goal: 100
```

### Modificação do GardenView — titheDone como state
```typescript
// Source: src/components/garden/garden-view.tsx (modificação Fase 4)
// Linha 34: adicionar após os outros useState:
const [titheDone, setTitheDone] = useState(seed.titheDone)

// Adicionar handler (após handleHarvest):
function handleTithe() {
  setTitheDone(true)
}

// Linha 92 — mudar de:
titheDone={seed.titheDone}
// Para:
titheDone={titheDone}
```

---

## Runtime State Inventory

> Fase 4 é UI pura (novos componentes + extensão de componente existente). Não há rename, refactor ou migração de dados.

**Not applicable — greenfield UI components, no runtime state to inventory.**

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | vitest, next dev | ✓ | verificado pelo projeto em execução | — |
| vitest | `npm run test` | ✓ | 4.1.8 (package.json) | — |
| jsdom | ambiente de teste | ✓ | 26.1.0 (devDependencies) | — |
| @testing-library/react | testes de componente | ✓ | 16.3.2 (devDependencies) | — |
| IntersectionObserver | BottomNav (browser) | ✓ browser / ✗ jsdom | nativo | Mock em tests/setup.ts |

**Missing dependencies with no fallback:** nenhuma.

**Missing dependencies with fallback:**
- `IntersectionObserver` no jsdom: adicionar mock global em `tests/setup.ts` (ver Pitfall 2).

---

## Validation Architecture

> `workflow.nyquist_validation` não está explicitamente definido em `.planning/config.json` — tratado como habilitado.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (raiz do projeto) |
| Quick run command | `npm run test -- --reporter=verbose tests/unit/child-tasks.test.tsx` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CTASK-01 | TaskCard pendente tem bg branco; concluída tem bg #EEF3EA | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ Wave 0 |
| CTASK-02 | Check button 38×38px toggle: click marca tarefa e chama onComplete | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ Wave 0 |
| CTASK-03 | TitheCard: botão "Plantar" chama handleTithe; estado "Feito ✓" após click | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ Wave 0 |
| CTASK-04 | SavingsCard: exibe savings e goal; progress bar tem role=progressbar com aria-valuenow | unit | `npm run test -- tests/unit/child-tasks.test.tsx` | ❌ Wave 0 |
| CTASK-05 | BottomNav: 4 botões presentes; "Jardim" ativo por padrão; "Doar" é aria-disabled | unit | `npm run test -- tests/unit/bottom-nav.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- tests/unit/child-tasks.test.tsx tests/unit/bottom-nav.test.tsx`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/child-tasks.test.tsx` — cobre CTASK-01, CTASK-02, CTASK-03, CTASK-04
- [ ] `tests/unit/bottom-nav.test.tsx` — cobre CTASK-05
- [ ] `tests/setup.ts` — adicionar mock de `IntersectionObserver` (global) para BottomNav

*(Infraestrutura de teste existente cobre o framework; apenas novos arquivos de teste e mock precisam ser criados)*

---

## Security Domain

> Esta fase não introduz autenticação, autorização, validação de input externo, criptografia ou chamadas de rede. Todos os dados são mock locais.

**ASVS categories applicable:** V5 Input Validation — não aplicável (sem input do usuário que vai ao servidor; task toggle é local).

**No security review required for Phase 4** — UI-only phase with mock data, no network calls, no auth changes.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stub de `<button>` inline para tasks (Fase 3) | `TaskCard` component com spec completa | Fase 4 | Substitui linhas 116–170 do garden-view.tsx |
| `titheDone` derivado de `seed.titheDone` (read-only) | `titheDone` como `useState(seed.titheDone)` com setter | Fase 4 | Permite interatividade do botão "Plantar" |
| `GardenSeed` sem campos financeiros | `GardenSeed.savings` e `GardenSeed.goal` | Fase 4 | Alimenta SavingsCard |

**Deprecated/outdated:**
- Stub inline de task buttons (linhas 116–170 em `garden-view.tsx`): substituir por `<TaskCard>` — remover código antigo ao adicionar o novo.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `position: fixed` do BottomNav não será quebrado por transform em elemento pai — o GardenView usa apenas flex/column sem transforms | Common Pitfalls (Pitfall 3) | BottomNav não fica fixo na tela; fácil de detectar visualmente durante implementação |
| A2 | Safari mobile suporta `scrollIntoView({ behavior: 'smooth' })` de forma aceitável para o contexto do produto | Architecture Patterns (Pattern 1) | Scroll não é smooth no Safari antigo — impacto mínimo no UX (scroll ainda funciona, apenas sem animação) |
| A3 | `requestAnimationFrame` duplo é suficiente para garantir que o browser aplica width:0 antes de animar para o percentual na SavingsCard | Common Pitfalls (Pitfall 3) | Animação não ocorre no mount em alguns dispositivos — alternativa: setTimeout(0) ou CSS animation no lugar de transition |

**Se a tabela tiver entradas:** Os items A1 e A2 têm risco baixo e podem ser verificados visualmente durante implementação. A3 é a única que pode precisar de ajuste técnico se a animação não ocorrer.

---

## Open Questions

1. **GARD-05 marcado como Pending nos REQUIREMENTS.md, mas código indica que está implementado**
   - O que sabemos: `WaterDrops` component existe e funciona; `GardenView` usa `key={waterTick}` para disparar animação a cada task completa.
   - O que está incerto: O REQUIREMENTS.md ainda mostra `[ ] GARD-05` como Pending. Pode ser que o requirements.md precise ser atualizado, ou há algum aspecto do "5 drops animados" que ainda não está 100% spec-compliant.
   - Recomendação: O planner deve verificar visualmente se WaterDrops exibe 5 drops. Se sim, REQUIREMENTS.md deve ser marcado como `[x]` ao fechar o plano.

2. **Texto secundário nos task cards (D-09 — Claude's Discretion)**
   - O que sabemos: Pode ser omitido ou mostrar recompensa mockada.
   - O que está incerto: Se a omissão deixa o card visualmente desequilibrado.
   - Recomendação: Omitir na Fase 4 (dados de recompensa chegam na Fase 6). Confirmar visualmente.

---

## Sources

### Primary (HIGH confidence)

- `src/components/garden/garden-view.tsx` — estado atual do componente raiz, handlers existentes, stub de task buttons
- `src/lib/seed/garden-seed.ts` — interface GardenSeed atual, constantes, funções auxiliares
- `src/app/globals.css` — todos os tokens CSS e keyframes disponíveis
- `src/components/garden/garden-hero.tsx` — como titheDone é consumido atualmente
- `src/components/garden/decorative-flowers.tsx` — padrão de conditional render (returns null when !visible)
- `src/components/garden/water-drops.tsx` — GARD-05 implementado
- `.planning/phases/04-child-tasks/04-CONTEXT.md` — decisões locked
- `.planning/phases/04-child-tasks/04-UI-SPEC.md` — especificação pixel-perfect de todos os componentes
- `.planning/REQUIREMENTS.md` — CTASK-01..05

### Secondary (MEDIUM confidence)

- [CITED: https://github.com/reactjs/react.dev/blob/main/src/content/reference/react/useEffect.md] — padrão IntersectionObserver com useEffect + cleanup
- `vitest.config.ts` + `tests/setup.ts` — infraestrutura de teste existente
- `package.json` — versões exatas de todas as dependências

### Tertiary (LOW confidence)

- [ASSUMED] `position: fixed` não será quebrado por transforms no GardenView
- [ASSUMED] Safari smooth scroll é aceitável no contexto do produto

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sem novas dependências; tudo verificado no package.json e codebase
- Architecture: HIGH — padrões copiados diretamente do código existente das Fases 1–3
- IntersectionObserver pattern: MEDIUM — verificado via Context7/react.dev docs
- Pitfalls: MEDIUM — combinação de verificação no codebase + conhecimento documentado

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (stack estável; sem dependências externas sujeitas a mudança)
