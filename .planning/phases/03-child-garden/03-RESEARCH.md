# Phase 3: Child Garden — Research

**Researched:** 2026-06-22
**Domain:** Next.js App Router (Server Components) + React 19 Client Components + Drizzle ORM migration + CSS animation via CSS variables + SVG inline
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Dados são seed mockado — constantes cobrindo todos os 4 estágios de planta (plant-a até plant-d) + estado "colher disponível". Nenhuma chamada real ao backend nesta fase.
- **D-02:** Estrutura das constantes permite testar cada estado do jardim sem mudar código — suficiente para validação visual completa desta fase.
- **D-03:** PinScreen faz `router.push('/child/[childId]/garden')` após portão fechar (animação cubic-bezier 1s completa). ⚠️ JÁ IMPLEMENTADO — `pin-screen.tsx` linha 39 já contém `router.push(\`/child/${childId}/garden\`)` com `setTimeout(..., 1100)`. Nenhuma alteração necessária.
- **D-04:** URL canônica do jardim: `/child/[childId]/garden` dentro do route group `(child)`.
- **D-05:** Bottom nav futura (Fase 4, CTASK-05) — fora do escopo desta fase. Reservar `padding-bottom: 80px`.
- **D-06:** Versículo exibido no overlay de celebração (GARD-10) vem de tabela `bible_verses` no banco de dados.
- **D-07:** Esta fase inclui migração Drizzle para criar a tabela `bible_verses` + seed inicial com 5–10 versículos sobre mordomia, colheita e generosidade.
- **D-08:** Seleção: aleatória (random) por query simples.
- **D-09:** Botão "Colher" ao ser clicado: exibe overlay completo (20 confetes kredsConfetti, card de versículo, botão "Voltar ao jardim"). Sem POST ao backend nesta fase.
- **D-10:** Ao fechar overlay ("Voltar ao jardim"): jardim mantém último estado visual (plant-d, tarefas todas marcadas, botão "Colher" some). Reset real de ciclo implementado na Fase 6.

### Claude's Discretion

- Lógica exata de mapeamento `doneCount → stage` (quantas tarefas por estágio a/b/c/d) — seguir o design handoff ou decidir proporcionalmente ao total de tarefas do seed.
- Texto do speech bubble contextual (GARD-07) para cada estado do jardim — tom cristão/encorajador, decidir por Claude baseado no design handoff.
- Número exato de versículos no seed e quais — escolher versículos sobre mordomia/colheita/generosidade.

### Deferred Ideas (OUT OF SCOPE)

- **API-03 (POST /harvest)** — endpoint real de colheita que registra no ledger. Fase 6.
- **Reset de ciclo real** — após colheita, zerar tarefas e voltar plant-a com dados persistidos. Fase 6.
- **Dados reais do backend** — buscar tarefas, coins e perfil da criança via API/Drizzle. Fase 6.
- **Bottom nav funcional** (CTASK-05) — ícone "Jardim" da nav. Escopo da Fase 4.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GARD-01 | Header com avatar inicial, nome da criança, saudação e badge de moedas (SVG coin) | Componente `GardenHeader` — CSS inline, tokens CSS existentes (`--color-kreds-coin`, `--color-kreds-gold`) |
| GARD-02 | Hero jardim 316px com céu gradiente, sol animado (kredsSun), 2 nuvens (kredsDrift1/2) | Hero container position: relative, `--animate-kreds-sun` e `--animate-kreds-drift1/2` já em globals.css |
| GARD-03 | Planta exibida em 4 estágios (plant-a→d) baseada na contagem de tarefas concluídas | Mapeamento doneCount→stage definido no UI-SPEC; imagens PNG em design_handoff_kreds/garden/ precisam ser copiadas para public/garden/ |
| GARD-04 | Tracker de água com 4 dots (azul `#6E9BA0` se rega feita, branco semi-transparente se não) | Componente `WaterTracker` — `filled: number` 0–4; cor `--color-kreds-water` |
| GARD-05 | Ao concluir tarefa: 5 drops animados (kredsDrop) + pop na planta (kredsPop) + avanço de estágio | `WaterDrops` com `key={waterTick}` para remontar e replay da animação; `PlantStage` com `pop` bool |
| GARD-06 | Badge de estação no hero com dot colorido e nome da estação | `SeasonBadge` — 4 estações com cores definidas no UI-SPEC |
| GARD-07 | Speech bubble contextual aparece conforme estado do jardim (animação kredsBubble) | `SpeechBubble` com `kredsBubble` (0.4s ease) — textos definidos no UI-SPEC por estado |
| GARD-08 | Botão "Colher Frutos" laranja com animação kredsFruit aparece somente quando todas tarefas concluídas | `HarvestButton` com `visible={canHarvest}` — gradiente `#C77F52→#B5623F`, `--animate-kreds-fruit` |
| GARD-09 | Flores decorativas SVG aparecem no jardim ao separar dízimo | `DecorativeFlowers` com `visible={titheDone}` — SVG inline rosa `#C98AA0` |
| GARD-10 | Overlay de celebração com 20 confetes (kredsConfetti), card de versículo bíblico e botão voltar | `CelebrationOverlay` + `ConfettiField` — versículo de `bible_verses` via Drizzle query random |
</phase_requirements>

---

## Summary

A Fase 3 entrega a tela principal da criança (`/child/[childId]/garden`) como uma página Next.js App Router com Server Component + Client Component híbrido. O Server Component busca um versículo bíblico aleatório no banco (Drizzle query `ORDER BY RANDOM() LIMIT 1`) e passa dados do seed mockado via props para o Client Component que gerencia estado interativo do jardim (tarefas, tracker de água, overlay de celebração).

O domínio técnico central é: (1) construção de uma interface animada com CSS keyframes já prontos em `globals.css` via variáveis `--animate-kreds-*`; (2) criação da tabela `bible_verses` no Drizzle schema com migração gerada por `drizzle-kit generate`; (3) implementação de 13 componentes React novos na pasta `src/components/garden/`. Não há novos pacotes npm necessários — tudo usa dependências já instaladas.

A navegação PinScreen→Garden **já está implementada** (`pin-screen.tsx` linha 39 já contém `router.push` com delay de 1100ms após portão fechar). A middleware já protege `/child/[childId]/garden` via JWT `child-session` sem mudanças adicionais.

**Primary recommendation:** Estruturar em 3 ondas sequenciais: (1) infraestrutura (migração DB + seed constantes + copiar assets), (2) componentes de exibição passiva (Header, Hero, PlantStage, WaterTracker, etc.), (3) interatividade + overlay de celebração (WaterDrops trigger, HarvestButton, CelebrationOverlay com versículo real).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Busca versículo aleatório | API / Backend (Server Component) | — | Query Drizzle com ORDER BY RANDOM() roda server-side; não exposta ao cliente |
| Seed mockado de jardim | Frontend Server (Server Component) | — | Constantes TypeScript importadas no page.tsx, passadas como props serializáveis |
| Estado interativo (tarefas, overlay, drops) | Browser / Client | — | useState/useCallback no GardenView ('use client'); não há Server Actions necessários |
| Animações CSS (sol, nuvens, confetes) | Browser / Client | — | CSS keyframes declarados em globals.css aplicados inline via `style` prop |
| Roteamento pós-PIN | Frontend Server (middleware) | Browser (router.push) | Middleware valida JWT; pin-screen.tsx já faz router.push após portão |
| Imagens plant-*.png | CDN / Static | — | Arquivos estáticos em public/garden/, servidos pelo Next.js diretamente |
| Schema bible_verses + migração | Database / Storage | — | Drizzle table definition + drizzle-kit generate/migrate |

---

## Standard Stack

### Core (já instalado — sem novos pacotes)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.7 | App Router, Server Components, page routing | Já no projeto; padrão da Fase 1+ |
| react | 19.2.7 | Client Components, useState, useCallback | Já no projeto |
| drizzle-orm | 0.45.2 | Query `bible_verses` com ORDER BY RANDOM() | Padrão ORM do projeto |
| drizzle-kit | 0.31.10 | `pnpm db:generate` para criar migração SQL | CLI de migração do projeto |
| tailwindcss | 4.3.0 | Utilitários de layout (min-h-screen, flex, etc.) | Design system do projeto |
| lucide-react | 0.510.0 | Ícone de gota no WaterTracker (fallback) | Disponível; SVG inline é preferido |

> [VERIFIED: npm registry] — versões confirmadas via `npm view` e `package.json` do projeto.

**Instalação:** Nenhuma nova dependência necessária. Todos os pacotes já estão no `package.json`.

---

## Package Legitimacy Audit

> Nenhum novo pacote externo é instalado nesta fase. Todos os itens abaixo já estão no `package.json` do projeto.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| next@16.2.7 | npm | OK | Já instalado |
| react@19.2.7 | npm | OK | Já instalado |
| drizzle-orm@0.45.2 | npm | OK | Já instalado |
| drizzle-kit@0.31.10 | npm | OK (devDep) | Já instalado |
| tailwindcss@4.3.0 | npm | OK (devDep) | Já instalado |
| lucide-react@0.510.0 | npm | OK | Já instalado |

**Pacotes removidos por veredicto SLOP:** nenhum
**Pacotes suspeitos SUS:** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
[PinScreen] --router.push(/child/[childId]/garden)--> [Middleware: verifica child-session JWT]
                                                              |
                                                              v
                                                  [GardenPage — Server Component async]
                                                    |                     |
                                          await db.select()           import SEED_*
                                          FROM bible_verses           constants
                                          ORDER BY RANDOM()
                                          LIMIT 1
                                                    |
                                                    v
                                          <GardenView verse={verse} seed={seed} />
                                                  ['use client']
                                                    |
                            ________________________|________________________
                            |            |           |            |          |
                      GardenHeader  GardenHero   (tasks        HarvestBtn  CelebrationOverlay
                      (static)      (animações   state via      visible     visible={harvested}
                                    CSS vars)    useState)      canHarvest  verse prop
                                         |
                          _______________|________________
                          |          |         |        |
                    PlantStage  WaterTracker  Speech  SeasonBadge
                    (stage img)  (filled 0-4) Bubble   (season dot)
                         |                      |
                    WaterDrops           DecorativeFlowers
                    (key=waterTick)      (visible=titheDone)
                    HarvestGlow
                    (visible=canHarvest)
```

### Recommended Project Structure

```
src/
├── app/
│   └── (child)/
│       └── child/
│           └── [childId]/
│               └── garden/
│                   └── page.tsx              # Server Component — busca versículo, passa seed+verse
├── components/
│   └── garden/
│       ├── garden-view.tsx                   # Client Component raiz ('use client') com estado
│       ├── garden-header.tsx                 # Header avatar + coins (sem estado)
│       ├── garden-hero.tsx                   # Contêiner hero 316px com céu/sol/nuvens/chão
│       ├── plant-stage.tsx                   # <img> plant-[a-d].png com pop/droop
│       ├── water-tracker.tsx                 # 4 dots azul/branco
│       ├── season-badge.tsx                  # Pill com dot colorido
│       ├── speech-bubble.tsx                 # Bubble contextual kredsBubble
│       ├── harvest-button.tsx                # Botão laranja kredsFruit
│       ├── harvest-glow.tsx                  # Círculo radial amarelo absoluto
│       ├── water-drops.tsx                   # 5 divs kredsDrop com delays
│       ├── decorative-flowers.tsx            # SVG flores dízimo
│       └── celebration-overlay.tsx           # Overlay com ConfettiField + card versículo
└── lib/
    ├── db/
    │   └── schema/
    │       └── index.ts                      # Adicionar export bibleVerses table
    └── seed/
        └── garden-seed.ts                    # Constantes SEED_STAGE_A..SEED_HARVESTED
public/
└── garden/
    ├── plant-a.png                           # Copiar de design_handoff_kreds/garden/
    ├── plant-b.png
    ├── plant-c.png
    └── plant-d.png
drizzle/
└── 0008_bible_verses.sql                     # Gerado por drizzle-kit generate
```

### Pattern 1: Server Component busca versículo + passa seed como props

**What:** `page.tsx` async Server Component que resolve `params`, importa constante de seed e executa query Drizzle para versículo aleatório.

**When to use:** Sempre que dados de banco são necessários sem interatividade no nível da página.

```typescript
// Source: Context7 — Next.js Server Components docs
// src/app/(child)/child/[childId]/garden/page.tsx

import { db } from '@/lib/db'
import { bibleVerses } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { GardenView } from '@/components/garden/garden-view'
import { SEED_STAGE_C } from '@/lib/seed/garden-seed'

export default async function GardenPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params

  // Query versículo aleatório — D-08
  const [verse] = await db
    .select()
    .from(bibleVerses)
    .orderBy(sql`RANDOM()`)
    .limit(1)

  return (
    <GardenView
      childId={childId}
      seed={SEED_STAGE_C}  // Trocar constante para testar estágios
      verse={verse ?? null}
    />
  )
}
```

### Pattern 2: Schema Drizzle — tabela `bible_verses`

**What:** Tabela simples sem FK, seguindo convenções do projeto (uuid PK, timestamps).

**When to use:** Ao adicionar `bible_verses` em `src/lib/db/schema/index.ts` antes de rodar `pnpm db:generate`.

```typescript
// Source: Context7 — Drizzle ORM schema docs
// Adicionar ao final de src/lib/db/schema/index.ts

export const bibleVerses = pgTable('bible_verses', {
  id: uuid('id').defaultRandom().primaryKey(),
  reference: text('reference').notNull(),   // ex: "Colossenses 3:23"
  text: text('text').notNull(),             // texto do versículo em PT-BR
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

Após adicionar ao schema:
```bash
pnpm db:generate   # cria drizzle/0008_*.sql
pnpm db:migrate    # aplica no banco
```

### Pattern 3: Animação re-disparada por remontagem (key prop)

**What:** Para re-executar uma animação CSS que usa `forwards` ou `ease` (não `infinite`), remontar o componente trocando a `key` prop em vez de adicionar/remover classes.

**When to use:** `WaterDrops` e `PlantStage` em GARD-05 — ao completar tarefa.

```typescript
// Source: [ASSUMED] — padrão React estabelecido
// No GardenView (Client Component):
const [waterTick, setWaterTick] = useState(0)
const [showPop, setShowPop] = useState(false)

function handleTaskComplete(taskId: string) {
  setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: true } : t))
  setWaterTick(t => t + 1)   // remontar WaterDrops
  setShowPop(true)
  setTimeout(() => setShowPop(false), 650)  // > 0.6s (kredsPop duration)
}

// WaterDrops:
<WaterDrops key={waterTick} />   // remonta e re-executa kredsDrop

// PlantStage:
<PlantStage stage={stage} pop={showPop} />
// pop ? style={{ animation: 'var(--animate-kreds-pop)' }} : {}
```

### Pattern 4: Array estático de confetes (sem Math.random() em render)

**What:** Gerar os 20 confetes como constante fora do componente, com posição/delay/cor fixos.

**When to use:** `ConfettiField` dentro de `CelebrationOverlay` — GARD-10.

```typescript
// Source: 03-UI-SPEC.md §Animation Contract
// confetti-field.tsx (interno ao CelebrationOverlay)

const CONFETTI_ITEMS = Array.from({ length: 20 }, (_, i) => ({
  left: `${5 + (i * 4.75) % 90}%`,
  delay: `${i * 100}ms`,
  color: ['#3E6B4F', '#E3C57C', '#C98AA0', '#6E9BA0', '#B5623F'][i % 5],
  size: 8 + (i % 4) * 3,
}))

export function ConfettiField() {
  return (
    <>
      {CONFETTI_ITEMS.map((c, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: c.left,
            top: '-30px',
            width: c.size,
            height: c.size,
            borderRadius: 2,
            background: c.color,
            animation: `var(--animate-kreds-confetti)`,
            animationDelay: c.delay,
          }}
        />
      ))}
    </>
  )
}
```

### Pattern 5: Droop da planta (tarefas pendentes)

**What:** Rotação `-2.5deg` quando há tarefas pendentes, com `transform-origin: 50% 94%`.

**When to use:** `PlantStage` — calculado a partir do seed.

```typescript
// Source: design_handoff_kreds/README.md §Hero — Jardim
<img
  src={`/garden/plant-${stage}.png`}
  alt={`Planta no estágio ${stage}`}
  style={{
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: `translateX(-50%) ${hasPending ? 'rotate(-2.5deg)' : ''}`,
    transformOrigin: '50% 94%',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))',
  }}
/>
```

### Anti-Patterns to Avoid

- **Math.random() no render de confetes:** Gera hidratação SSR/CSR mismatch. Usar array estático como constante.
- **useEffect para animar saída de overlay:** Overlay de celebração é `position: fixed` sobre tudo — simples `visible` boolean com `display: none` é suficiente; sem animação de saída na Fase 3.
- **Server Action para "Colher":** D-09 proíbe POST ao backend nesta fase. Colheita é estado local `harvested = true`.
- **next/image para plant-*.png:** O projeto usa `<img>` (sem `<Image>` do next/image) — middleware matcher já exclui `.*\\.png` de regras de auth, e não há uso de `<Image>` no codebase.
- **Importar CSS de animação por classe Tailwind:** As animações são variáveis CSS (`--animate-kreds-*`), aplicadas via `style={{ animation: 'var(--animate-kreds-sun)' }}`, não via classes Tailwind (não há utilitários gerados para elas).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query aleatória do versículo | Buscar todos e escolher com JS random | `sql\`RANDOM()\`` via Drizzle + `orderBy` | O banco faz isso eficientemente; evita carregar toda a tabela |
| Replay de animação CSS | Remover/adicionar classe com timer | `key={waterTick}` para remontar componente | O React garante desmontagem/remontagem limpa; mais confiável que manipular classList |
| Migração do schema | Escrever SQL manual | `pnpm db:generate` (drizzle-kit) | Drizzle garante consistência entre schema TypeScript e SQL; evita drift |
| Guard de rota para /child/ | Checar cookie no page.tsx | Middleware já implementado | `src/middleware.ts` já verifica JWT `child-session` para toda rota `/child/*` exceto `/child/*/login` |
| Delay de confetes | requestAnimationFrame loop | CSS `animation-delay` em array estático | CSS handles timing off main thread; sem JS |

**Key insight:** Esta fase é predominantemente visual — a complexidade está em aplicar as animações já prontas corretamente, não em criar nova lógica de negócio.

---

## Common Pitfalls

### Pitfall 1: D-03 já implementado — não duplicar router.push

**What goes wrong:** Adicionar um segundo `router.push` no PinScreen ou mudar o delay existente.
**Why it happens:** O CONTEXT.md descreve D-03 como requisito, mas `pin-screen.tsx` linha 39 **já implementa** o `router.push(\`/child/${childId}/garden\`)` com `setTimeout(..., 1100)` — isso foi feito na Fase 2.
**How to avoid:** Planner NÃO deve incluir tarefa de "adicionar router.push ao PinScreen" — está feito. Verificar apenas que a URL `/child/[childId]/garden` existe após criar a página.
**Warning signs:** Se o plano inclui modificar `pin-screen.tsx`, revisar — provavelmente é desnecessário.

### Pitfall 2: Imagens plant-*.png não estão em `public/`

**What goes wrong:** `<img src="/garden/plant-a.png">` retorna 404 em produção.
**Why it happens:** Os arquivos PNG estão em `design_handoff_kreds/garden/` (diretório de design), não em `public/garden/`. O Next.js serve estáticos apenas de `public/`.
**How to avoid:** Wave 0 deve copiar os 4 arquivos PNG para `public/garden/`.
**Warning signs:** Imagem quebrada no browser durante dev.

### Pitfall 3: SSR/CSR hydration mismatch nos confetes

**What goes wrong:** React warning de hydration; confetes aparecem em posições diferentes.
**Why it happens:** `Math.random()` no corpo do componente produz valor diferente no servidor e no cliente.
**How to avoid:** Definir o array `CONFETTI_ITEMS` como constante fora do componente (avaliada uma vez, valor fixo). Ver Pattern 4.
**Warning signs:** Console warning "Hydration failed because the server rendered HTML didn't match the client".

### Pitfall 4: ORDER BY RANDOM() — sintaxe Drizzle

**What goes wrong:** `db.select().from(bibleVerses).orderBy(bibleVerses.createdAt)` — não é aleatório.
**Why it happens:** Drizzle não tem método `.random()` nativo; requer `sql` template tag.
**How to avoid:** Usar `import { sql } from 'drizzle-orm'` e `.orderBy(sql\`RANDOM()\`)`.
**Warning signs:** Sempre o mesmo versículo na celebração.

### Pitfall 5: `pop` e `kredsPop` — animação não re-executa

**What goes wrong:** Trocar uma classe CSS de `animation` enquanto ela já está aplicada não re-executa a animação.
**Why it happens:** O browser considera que a animação já está rodando; ignorar a mudança.
**How to avoid:** Usar o padrão `key={waterTick}` para `WaterDrops`. Para `PlantStage`, aplicar `animation` via `style` prop condicionalmente e resetar com `showPop=false` após `>= 650ms` (duração de `kredsPop` é 600ms).
**Warning signs:** Clique em "concluir" não faz a planta "pular" na segunda vez.

### Pitfall 6: `bible_verses` seed — rodar antes de testar overlay

**What goes wrong:** Overlay abre sem versículo (verse é null).
**Why it happens:** Tabela `bible_verses` criada pela migração mas sem dados — seed não rodado.
**How to avoid:** Wave 0 deve incluir: (1) gerar migração, (2) aplicar migração, (3) rodar seed SQL. A página lida com `verse ?? null` graciosamente, mas o overlay deve mostrar versículo.
**Warning signs:** Overlay abre mas card de versículo está vazio.

---

## Code Examples

### Drizzle RANDOM() query

```typescript
// Source: Context7 — Drizzle ORM docs
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bibleVerses } from '@/lib/db/schema'

const [verse] = await db
  .select()
  .from(bibleVerses)
  .orderBy(sql`RANDOM()`)
  .limit(1)
```

### Estrutura do seed mockado

```typescript
// src/lib/seed/garden-seed.ts
// Source: 03-UI-SPEC.md §Seed Data Contract (D-01, D-02)

export interface GardenTask {
  id: string
  title: string
  emoji: string
  done: boolean
}

export interface GardenSeed {
  childName: string
  initial: string
  coins: number
  tasks: GardenTask[]
  titheDone: boolean
  harvested: boolean
  season: 'primavera' | 'verao' | 'outono' | 'inverno'
}

const BASE_TASKS: GardenTask[] = [
  { id: 't1', title: 'Arrumar a cama', emoji: '🛏️', done: false },
  { id: 't2', title: 'Estudar 30 min', emoji: '📚', done: false },
  { id: 't3', title: 'Ajudar na cozinha', emoji: '🍽️', done: false },
  { id: 't4', title: 'Ler a Bíblia', emoji: '✝️', done: false },
]

export const SEED_STAGE_A: GardenSeed = {
  childName: 'Maria', initial: 'M', coins: 0,
  tasks: BASE_TASKS,
  titheDone: false, harvested: false, season: 'primavera',
}

export const SEED_STAGE_B: GardenSeed = {
  childName: 'Maria', initial: 'M', coins: 10,
  tasks: BASE_TASKS.map((t, i) => ({ ...t, done: i < 1 })),
  titheDone: false, harvested: false, season: 'primavera',
}

export const SEED_STAGE_C: GardenSeed = {
  childName: 'Maria', initial: 'M', coins: 30,
  tasks: BASE_TASKS.map((t, i) => ({ ...t, done: i < 3 })),
  titheDone: false, harvested: false, season: 'verao',
}

export const SEED_STAGE_D: GardenSeed = {
  childName: 'Maria', initial: 'M', coins: 40,
  tasks: BASE_TASKS.map(t => ({ ...t, done: true })),
  titheDone: false, harvested: false, season: 'verao',
}

export const SEED_HARVESTED: GardenSeed = {
  childName: 'Maria', initial: 'M', coins: 40,
  tasks: BASE_TASKS.map(t => ({ ...t, done: true })),
  titheDone: false, harvested: true, season: 'verao',
}

export const SEED_TITHE: GardenSeed = {
  childName: 'Maria', initial: 'M', coins: 40,
  tasks: BASE_TASKS.map(t => ({ ...t, done: true })),
  titheDone: true, harvested: false, season: 'primavera',
}
```

### Mapeamento doneCount → stage

```typescript
// Source: 03-UI-SPEC.md §Estágios da Planta (GARD-03)
// Seed tem 4 tarefas — mapeamento proporcional
type PlantStageKey = 'a' | 'b' | 'c' | 'd'

function getPlantStage(doneCount: number, totalTasks: number): PlantStageKey {
  if (doneCount === 0) return 'a'
  if (doneCount === 1) return 'b'
  if (doneCount < totalTasks) return 'c'
  return 'd'
}
```

### Seed SQL para bible_verses

```sql
-- Inserir após migração 0008 ser aplicada
-- 7 versículos sobre mordomia/colheita/generosidade (D-07, Claude's Discretion)
INSERT INTO bible_verses (id, reference, text) VALUES
  (gen_random_uuid(), 'Colossenses 3:23', 'Tudo o que fizerem, façam de todo o coração, como para o Senhor.'),
  (gen_random_uuid(), 'Provérbios 3:9', 'Honra ao Senhor com os teus bens e com as primícias de todos os teus frutos.'),
  (gen_random_uuid(), '2 Coríntios 9:7', 'Cada um dê conforme determinou em seu coração, pois Deus ama quem dá com alegria.'),
  (gen_random_uuid(), 'Lucas 6:38', 'Dai, e ser-vos-á dado.'),
  (gen_random_uuid(), 'Provérbios 11:24', 'Há quem dê generosamente e fique mais rico; há quem retenha o que é seu e fique mais pobre.'),
  (gen_random_uuid(), 'Gálatas 6:9', 'Não nos cansemos de fazer o bem, pois a seu tempo colheremos, se não desanimarmos.'),
  (gen_random_uuid(), 'Mateus 6:20', 'Acumulem para si tesouros no céu, onde a traça e a ferrugem não destroem.');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getServerSideProps` / `getStaticProps` | Server Component async com `await params` | Next.js 13+ App Router | `params` é Promise em Next.js 16; sempre `await params` |
| `useEffect` para fetch de dados | Server Component com Drizzle direto | Next.js 13+ | Sem waterfall cliente; dados chegam hidratados |
| `Math.random()` em componentes | Constante fora do componente | React 18+ (Strict Mode + RSC) | Evita hydration mismatch |
| `className` toggle para re-animar | `key` prop para remontar | React padrão estabelecido | Mais confiável; sem timer de reset de classe |

**Deprecated/outdated:**
- `pages/` router: este projeto usa `app/` exclusivamente desde Fase 1.
- `next/image` com `<Image>`: não usado no projeto — `<img>` simples + middleware matcher exclui `.png` de auth.

---

## Critical Implementation Notes

### D-03 já implementado

`pin-screen.tsx` linha 39 já contém:
```typescript
setTimeout(() => {
  router.push(`/child/${childId}/garden`)
}, 1100)
```
O portão anima por 1000ms (cubic-bezier), router.push dispara em 1100ms. **Nenhuma alteração necessária** em `pin-screen.tsx`.

### Middleware já protege /child/[childId]/garden

`src/middleware.ts` já tem:
- `/child/*/login` na lista de rotas públicas (sem sessão necessária)
- Branch `/child/*` que verifica JWT `child-session` e redireciona para `/` se inválido

**Nenhuma alteração necessária** em middleware.

### Copiar assets PNG

Os 4 arquivos PNG existem em `design_handoff_kreds/garden/`:
- `plant-a.png` (28KB), `plant-b.png` (62KB), `plant-c.png` (124KB), `plant-d.png` (229KB)

Devem ser copiados para `public/garden/` antes de qualquer renderização.

### Drizzle schema path

`drizzle.config.ts` aponta para `./src/lib/db/schema/index.ts` como único arquivo de schema. Adicionar `bibleVerses` ao final deste arquivo e exportar — o `drizzle-kit generate` detecta automaticamente.

Próxima migração será `0008_*.sql` (sequential após `0007_tidy_cerise.sql`).

### Seed — script vs constante TypeScript

O seed de `bible_verses` é SQL (INSERT), não uma constante TypeScript. Recomendação: incluir como script `drizzle/seed/bible-verses.sql` ou rodar via `db:studio` / psql. O seed mockado do jardim (`SEED_STAGE_A..SEED_HARVESTED`) é constante TypeScript em `src/lib/seed/garden-seed.ts`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Array estático de confetes com posições calculadas (`5 + (i * 4.75) % 90`) distribui bem os 20 itens na tela | Code Examples — Pattern 4 | Confetes aglomerados; ajustar fórmula no plano |
| A2 | `<img>` simples para plant-*.png não causa problemas de performance com arquivos até 229KB | Architecture Patterns | LCP lento; plano pode adicionar `loading="eager"` ou otimização de imagem |
| A3 | Seed de 4 tarefas fixas (arrumar cama, estudar, ajudar na cozinha, ler Bíblia) é representativo para testes | Code Examples | Visual incorreto para o design handoff — ajustar títulos/emojis no plano |

---

## Open Questions

1. **Posição do botão "Colher Frutos" quando canHarvest = true**
   - O UI-SPEC nota: "Verificar no protótipo `Kreds Kids Garden.dc.html` se o botão 'Colher Frutos' substitui o tracker de água ou aparece em posição diferente."
   - What's unclear: O design handoff indica `position: absolute top-3 right-3` tanto para tracker quanto para botão — eles não podem coexistir na mesma posição.
   - Recommendation: O planner deve verificar o `.dc.html` e decidir: (a) botão substitui tracker quando `canHarvest`, ou (b) tracker some quando `canHarvest` e botão aparece. O UI-SPEC atual sugere que tracker desaparece e botão ocupa sua posição.

2. **Seed ativo em produção vs desenvolvimento**
   - What we know: A página usa `SEED_STAGE_C` como constante diretamente em `page.tsx`.
   - What's unclear: Se deve haver uma forma de trocar o seed sem mudar código (ex: query param `?stage=a`).
   - Recommendation: Para Fase 3 (apenas visual), hardcode de uma constante é suficiente — o planner pode escolher `SEED_STAGE_C` como padrão para exibir o estado mais visualmente rico.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Migração bible_verses + query versículo | ✓ (assume — DATABASE_URL configurada nas fases 1-2) | — | — |
| Node.js | `pnpm db:generate`, `pnpm db:migrate` | ✓ | ≥18 (Next.js 16 req) | — |
| pnpm | Scripts do projeto | ✓ | 10.34.1 (packageManager) | — |
| plant-*.png | Imagens da planta no hero | ✓ | — em design_handoff_kreds/garden/ | — |

**Missing dependencies com fallback:** nenhum

**Missing dependencies bloqueantes:** nenhum (DATABASE_URL já foi configurada em fases anteriores)

---

## Validation Architecture

> `workflow.nyquist_validation` ausente em config.json — tratado como enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react + jsdom |
| Config file | `vitest.config.ts` (raiz do projeto) |
| Setup | `tests/setup.ts` — importa `@testing-library/jest-dom/vitest` |
| Quick run | `pnpm test` (vitest run) |
| Full suite | `pnpm test && pnpm test:e2e` (inclui Playwright) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GARD-01 | Header renderiza avatar, nome e coins | unit | `pnpm test tests/unit/garden-header.test.tsx` | ❌ Wave 0 |
| GARD-02 | Hero 316px com sol/nuvens — elementos presentes no DOM | unit | `pnpm test tests/unit/garden-hero.test.tsx` | ❌ Wave 0 |
| GARD-03 | getPlantStage(0,4)='a', (1,4)='b', (2,4)='c', (4,4)='d' | unit | `pnpm test tests/unit/garden-stage.test.ts` | ❌ Wave 0 |
| GARD-04 | WaterTracker renderiza X dots azuis para filled=X | unit | incluir em garden-hero.test.tsx | ❌ Wave 0 |
| GARD-05 | handleTaskComplete incrementa waterTick e setShowPop | unit | incluir em garden-view.test.tsx | ❌ Wave 0 |
| GARD-06 | SeasonBadge renderiza label e dot para cada estação | unit | `pnpm test tests/unit/garden-season.test.ts` | ❌ Wave 0 |
| GARD-07 | SpeechBubble mostra texto correto para cada estado | unit | `pnpm test tests/unit/garden-bubble.test.ts` | ❌ Wave 0 |
| GARD-08 | HarvestButton visível quando canHarvest=true, oculto quando false | unit | incluir em garden-view.test.tsx | ❌ Wave 0 |
| GARD-09 | DecorativeFlowers visível quando titheDone=true | unit | incluir em garden-hero.test.tsx | ❌ Wave 0 |
| GARD-10 | CelebrationOverlay renderiza card de versículo e botão voltar | unit | `pnpm test tests/unit/garden-celebration.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Por commit de tarefa:** `pnpm test tests/unit/garden-*.test.*`
- **Por merge de wave:** `pnpm test`
- **Phase gate:** `pnpm test` verde antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/garden-header.test.tsx` — cobre GARD-01
- [ ] `tests/unit/garden-hero.test.tsx` — cobre GARD-02, GARD-04, GARD-09
- [ ] `tests/unit/garden-stage.test.ts` — cobre GARD-03 (getPlantStage pura função)
- [ ] `tests/unit/garden-view.test.tsx` — cobre GARD-05, GARD-08
- [ ] `tests/unit/garden-season.test.ts` — cobre GARD-06
- [ ] `tests/unit/garden-bubble.test.ts` — cobre GARD-07
- [ ] `tests/unit/garden-celebration.test.tsx` — cobre GARD-10

*(Framework já instalado — vitest, @testing-library/react, jsdom — nenhum pacote adicional necessário)*

---

## Security Domain

> `security_enforcement` ausente — tratado como enabled.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não (página servida apenas com child-session válido) | Middleware já implementado — JWT verificado |
| V3 Session Management | não (sem nova sessão criada) | Cookie `child-session` httpOnly, sameSite lax |
| V4 Access Control | sim — página não deve ser acessível sem child-session | Middleware `/child/*` com JWT verify — já implementado |
| V5 Input Validation | não (sem formulários nesta fase) | — |
| V6 Cryptography | não (sem novo hash ou criptografia) | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Acesso direto à URL `/child/[childId]/garden` sem sessão | Elevation of Privilege | Middleware já redireciona para `/` — testado em tests/unit/middleware.test.ts |
| childId na URL diferente do JWT | Spoofing | Esta fase não valida escopo do childId na page — dados são seed mockado; Fase 6 adiciona guard com `validateChildSessionScope` |

---

## Sources

### Primary (MEDIUM confidence)

- Context7 `/vercel/next.js` — Server Components async page pattern, params como Promise
- Context7 `/drizzle-team/drizzle-orm-docs` — pgTable, schema definition, migration generation
- `design_handoff_kreds/README.md` — especificação visual completa do jardim
- `src/app/globals.css` — keyframes e variáveis CSS confirmadas por leitura direta
- `src/lib/db/schema/index.ts` — convenções do schema Drizzle verificadas por leitura direta

### Secondary (MEDIUM confidence)

- `src/components/auth/pin-screen.tsx` — confirma D-03 já implementado (router.push linha 39)
- `src/middleware.ts` — confirma proteção de `/child/*` já ativa
- `.planning/phases/03-child-garden/03-UI-SPEC.md` — contrato visual aprovado (status: approved)

### Tertiary (LOW confidence)

- Padrão `key={waterTick}` para replay de animação — [ASSUMED] baseado em conhecimento React; não verificado em docs desta sessão.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — versões verificadas via `npm view` e `package.json`
- Architecture: HIGH — confirmada por leitura do código existente (middleware, pin-screen, schema)
- Pitfalls: HIGH — baseados em código real do projeto + padrões Next.js verificados
- D-03 status: HIGH — verificado diretamente em `pin-screen.tsx` linha 39

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (bibliotecas estáveis; seed mockado não muda)
