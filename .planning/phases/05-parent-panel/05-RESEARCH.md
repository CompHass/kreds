# Phase 5: Parent Panel - Research

**Researched:** 2026-06-25
**Domain:** Next.js App Router SSR + React Client Component state management + Drizzle ORM schema migration + inline styles UI (desktop layout)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Rota do painel: `/family/[familyId]/tasks`. Usa `familyId` real na URL, contínuo com `/family/access/[familyId]` existente. SSR lê `familyId` dos params + resolve via `auth()` session.
- **D-02:** Redirect pós-login: após autenticação Zitadel bem-sucedida, responsável é redirecionado para `/family/[familyId]/tasks`. Backend resolve `familyId` do guardian logado via `family_memberships`.
- **D-03:** Novos campos em `taskTemplates`: `category` (text, nullable), `days` (jsonb array de strings, nullable), `approval` (boolean, default false). Adicionar ao schema Drizzle + rodar `drizzle-kit push` nesta fase. Colunas nullable/com default — sem breaking change.
- **D-04:** Dados da UI: seed mock tipado (mesmo padrão das Fases 3-4). Nenhum endpoint real consumido nesta fase. Fase 6 conecta as chamadas reais de API.
- **D-05:** Estado inicial: painel sempre visível com placeholder elegante (ex: "Selecione uma tarefa ou clique em + para criar"). Sem shift de layout ao abrir/fechar.
- **D-06:** Create vs Edit no mesmo form — header e botões mudam: modo Create ("Nova tarefa" / "Adicionar tarefa" verde); modo Edit ("Editar tarefa" / "Salvar alterações" verde + "Excluir tarefa" laranja/vermelho — PTASK-10, só em modo Edit).
- **D-07:** Trigger de criação: botão "+ Nova tarefa" no topbar ou acima da lista na área principal. Clicar limpa o form e entra no modo Create.
- **D-08:** Trigger de edição: clicar no botão lápis (✏️) de um task card carrega os dados da tarefa no painel direito e entra em modo Edit.
- **D-09:** Client component raiz (`ParentPanelView`) gerencia a lista de tasks via `useState`. Mutações (criar/editar/deletar/toggle) atualizam o array localmente. Sem reload de página, sem Server Actions nesta fase. Mesmo padrão do `GardenView`.
- **D-10:** Flash `kredsNew` (PTASK-09): ao adicionar ou salvar tarefa, o card correspondente recebe a classe `kredsNew` (glow ring verde 1.2s). Controlado por `newTaskId` state que é limpo após a animação.

### Claude's Discretion

- Ícones exatos da sidebar (SVGs inline ou lib seguindo padrão do projeto).
- Textos de placeholder no painel direito além do especificado.
- Animação de entrada/saída do painel direito (se presente).
- Avatar das crianças nos filter chips (inicial ou `avatarPreset` existente).
- Ordenação dos task cards na lista.

### Deferred Ideas (OUT OF SCOPE)

- **Endpoints reais de tasks (GET/POST/PATCH/DELETE)** — Fase 6: API Integration.
- **Fluxo de aprovação** (notificação → confirmar → creditar) — fora do escopo v2.0.
- **Onboarding de nova família / adicionar filho** — fora do escopo v2.0.
- **Ajuste do callbackUrl pós-login** — avaliar na Fase 6 junto com integração completa.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PTASK-01 | Layout 1180px com sidebar (80px) + área principal flex-col + painel lateral direito fixo (336px) | Estrutura de layout desktop documentada em 05-UI-SPEC.md e design handoff; padrão inline styles do projeto confirmado |
| PTASK-02 | Topbar 64px com breadcrumb (família em verde), badge de usuário logado com nome e avatar | Design tokens confirmados em globals.css; padrão auth() SSR confirmado via access/[familyId]/page.tsx |
| PTASK-03 | Filter chips "Todas" + chip por criança com mini avatar — selecionado em verde, normal em off-white | childProfiles schema confirmado no banco; accentColor e displayName disponíveis para chips |
| PTASK-04 | Task cards com ícone de categoria, toggle ativo/inativo (switch 42×24px), botão lápis editar | Especificação completa no UI-SPEC; padrão TaskCard existente como referência de estrutura |
| PTASK-05 | 5 categorias com cores e ícones distintos (quarto, higiene, estudos, casa, espiritual) | Tabela de cores confirmada em UI-SPEC e design handoff README; SVGs inline seguindo padrão do projeto |
| PTASK-06 | Painel direito com form criar/editar: título, categoria chips, recompensa, recorrência, atribuição, aprovação | Estrutura completa documentada em UI-SPEC e design handoff; estado gerenciado em ParentPanelView |
| PTASK-07 | Stepper de recompensa com botões ± — valor zero mostra "Mordomia" em verde, valor > 0 mostra "R$ X" | Comportamento confirmado em UI-SPEC; atenção ao constraint kredsValue > 0 no banco (não afeta mock) |
| PTASK-08 | Pills de recorrência D/S/T/Q/Q/S/S + botão "Todos os dias" — selecionado em verde | Especificação completa em UI-SPEC; estado no formData array |
| PTASK-09 | Flash kredsNew (glow ring verde 1.2s) no card após adicionar ou salvar tarefa | Animação `--animate-kreds-new` já definida em globals.css; padrão newTaskId state documentado em D-10 |
| PTASK-10 | Botão excluir (laranja/vermelho) aparece somente em modo edição de tarefa existente | Comportamento e cores confirmados em UI-SPEC; controlado pelo mode === 'edit' do form |
</phase_requirements>

---

## Summary

A Fase 5 entrega o painel desktop do responsável para gerenciar tarefas. É uma fase predominantemente de UI — layout fixo 1180px, CRUD otimista local (sem API), seed mock tipado, e uma adição de schema (3 colunas nullable). Todas as decisões técnicas estão travadas no CONTEXT.md; a pesquisa confirma que nenhuma nova dependência externa é necessária.

O padrão arquitetural é idêntico ao `GardenView` das Fases 3-4: uma Server Component page.tsx faz o SSR (auth + query de childProfiles), passa dados como props para `ParentPanelView` (Client Component raiz), que gerencia todo o estado com `useState`. Os únicos elementos novos são: (1) o layout desktop de 3 colunas em vez de fullscreen mobile, (2) o form de criação/edição no painel direito com estados `idle/create/edit`, e (3) o seed mock tipado para tarefas (análogo ao `GardenSeed`).

Há um pitfall de schema a notar: a coluna `kredsValue` na tabela `task_templates` tem um check constraint `> 0`, mas o campo `reward` no mock pode ser 0 (Mordomia). Isso não afeta a Fase 5 (mock sem INSERTs no banco), mas o planner deve documentar a inconsistência para a Fase 6.

**Primary recommendation:** Replicar o padrão SSR page + Client View exatamente como em garden/page.tsx + GardenView, adaptar para o layout desktop 3-colunas, e manter toda a gestão de estado no componente raiz ParentPanelView.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Verificação de autenticação do guardian | Frontend Server (SSR) | — | `auth()` roda no Server Component; middleware já protege /family/* com cookie check |
| Query de childProfiles da família | Frontend Server (SSR) | — | Drizzle query server-side na page.tsx; dados passados como props para o Client |
| Query de taskTemplates | Frontend Server (SSR) — mock | — | Fase 5 usa mock seed; estrutura antecipa Fase 6 com query real |
| Gestão de estado do CRUD de tarefas | Browser / Client | — | useState em ParentPanelView; mutações otimistas locais sem Server Actions |
| Layout desktop 3-colunas (sidebar/main/form) | Browser / Client | — | CSS inline styles + Tailwind no Client Component raiz |
| Animação kredsNew | Browser / Client | — | CSS animation via globals.css `--animate-kreds-new`; controlada por state `newTaskId` |
| Schema migration (novos campos) | Database / Storage | — | `drizzle-kit push` aplica as 3 novas colunas nullable no PostgreSQL |

---

## Standard Stack

### Core (já instalado no projeto)

| Library | Version (instalada) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `next` | 16.2.7 | App Router, SSR page, rotas dinâmicas | Framework do projeto desde Fase 1 |
| `react` | 19.2.7 | Client Components, `useState` | Biblioteca de UI do projeto |
| `drizzle-orm` | 0.45.2 | Query de childProfiles SSR | ORM do projeto |
| `drizzle-kit` | 0.31.10 | `drizzle-kit push` para adicionar colunas | Tooling de migração do projeto |
| `next-auth` | 5.0.0-beta.31 | `auth()` para sessão do guardian | Auth do projeto desde Fase 2 |

[VERIFIED: npm registry] — todos os pacotes acima confirmados instalados em `node_modules/` com as versões exatas do `package.json`.

### Sem novas instalações nesta fase

A Fase 5 não requer nenhum novo pacote npm. Todos os componentes são construídos com inline styles + Tailwind v4 seguindo o padrão estabelecido nas Fases 1-4.

**Instalação:** nenhuma — sem `pnpm install` necessário.

---

## Package Legitimacy Audit

Fase 5 não instala nenhum pacote externo novo. Pacotes já em uso no projeto:

| Package | Registry | Age | Downloads/sem | Source Repo | Verdict | Disposition |
|---------|----------|-----|---------------|-------------|---------|-------------|
| `next` | npm | >5 anos | 42.5M | github.com/vercel/next.js | SUS (too-new release) | Aprovado — já instalado, 42M downloads/sem, repo oficial Vercel |
| `react` | npm | >10 anos | 148.6M | github.com/facebook/react | SUS (too-new release) | Aprovado — já instalado, 148M downloads/sem, repo oficial Meta |
| `drizzle-orm` | npm | ~3 anos | 11.7M | github.com/drizzle-team/drizzle-orm | OK | Aprovado |
| `drizzle-kit` | npm | ~3 anos | 9.7M | github.com/drizzle-team/drizzle-orm | OK | Aprovado |
| `next-auth` | npm | >4 anos | 5.0M | github.com/nextauthjs/next-auth | OK | Aprovado |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `next` e `react` — SUS apenas por "too-new" na versão mais recente, mas são os pacotes mais baixados do npm com repositórios oficiais amplamente reconhecidos. Já instalados e em uso desde a Fase 1. Sem checkpoint adicional necessário.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request → /family/[familyId]/tasks
        │
        ▼
middleware.ts
  └── /family/* → verifica cookie next-auth (cookie-check heurístico)
  └── sem cookie → redirect /api/auth/signin
        │
        ▼
page.tsx (Server Component)
  ├── auth() → verifica sessão next-auth
  │     └── sem sessão → redirect('/login')
  ├── db.select(childProfiles) WHERE familyId = params.familyId AND active = true
  │     └── sem children → renderiza página (empty state no componente)
  ├── MOCK_PARENT_TASKS (seed tipado, sem query real de taskTemplates)
  └── <ParentPanelView children={children} initialTasks={mockTasks} familyName={...} />
        │
        ▼
ParentPanelView (Client Component — "use client")
  state: tasks[], filter, editingId, formData, newTaskId
        │
        ├── ParentSidebar (80px)
        ├── main
        │   ├── ParentTopbar (64px) ← breadcrumb + badge
        │   └── content (flex row)
        │       ├── task-list-area (flex:1)
        │       │   ├── "+ Nova tarefa" button
        │       │   ├── FilterChips
        │       │   └── ParentTaskCard × N
        │       │       ├── CategoryIcon
        │       │       ├── TaskToggle ← handler onToggle
        │       │       └── EditButton ← handler onEdit
        │       └── TaskFormPanel (336px fixo)
        │           ├── [idle] placeholder elegante
        │           ├── [create/edit] TaskTitleInput, CategoryChips,
        │           │   RewardStepper, RecurrencePills, AssigneeSelector,
        │           │   ApprovalToggle, FormCTA
        │           └── [edit only] DeleteButton
        │
mutations (optimistic, sem API)
  onToggle(id) → setTasks(prev.map toggle active)
  onCreate(formData) → setTasks([...prev, newTask]), setNewTaskId(id), timeout 1200ms → setNewTaskId(null)
  onEdit(formData) → setTasks(prev.map update), setNewTaskId(id), timeout 1200ms → setNewTaskId(null)
  onDelete(id) → setTasks(prev.filter), setEditingId(null)
```

### Recommended Project Structure

```
src/
├── app/
│   └── family/
│       └── [familyId]/
│           └── tasks/
│               └── page.tsx                  # Server Component — SSR + auth
├── components/
│   └── parent/
│       ├── parent-panel-view.tsx             # Client Component raiz
│       ├── parent-sidebar.tsx
│       ├── parent-topbar.tsx
│       ├── filter-chips.tsx
│       ├── parent-task-card.tsx
│       ├── category-icon.tsx
│       ├── task-toggle.tsx
│       ├── task-form-panel.tsx
│       └── [sub-components do form]
└── lib/
    ├── db/
    │   └── schema/
    │       └── index.ts                      # Adicionar category, days, approval
    └── seed/
        └── parent-seed.ts                    # Mock tipado para tasks do painel
```

### Pattern 1: SSR Page + Client View (padrão estabelecido do projeto)

**What:** Server Component faz queries no banco e passa dados como props para um Client Component raiz que gerencia todo o estado interativo.

**When to use:** Sempre que a página precisa de dados do banco + interatividade no cliente.

**Example:**
```typescript
// Source: src/app/(child)/child/[childId]/garden/page.tsx (confirmado no codebase)
// src/app/family/[familyId]/tasks/page.tsx
export default async function ParentTasksPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params   // IMPORTANTE: params é Promise no Next.js App Router

  const session = await auth()
  if (!session) redirect('/login')

  const children = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
      avatarPreset: childProfiles.avatarPreset,
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))

  return (
    <ParentPanelView
      familyId={familyId}
      familyName="Família Teste"          // extrair da sessão ou família no Fase 6
      currentUserName={session.user.name ?? ''}
      children={children}
      initialTasks={MOCK_PARENT_TASKS}
    />
  )
}
```

[VERIFIED: next.js docs] — `params: Promise<{ slug: string }>` é o padrão obrigatório no Next.js App Router desde v15.

### Pattern 2: Estado Form no Client Component Raiz

**What:** Todos os estados do form no componente raiz; sub-componentes recebem props + callbacks.

**When to use:** Toda a Fase 5 — segue exatamente o padrão GardenView.

**Example:**
```typescript
// Source: src/components/garden/garden-view.tsx (confirmado no codebase)
'use client'

// Em ParentPanelView — análogo ao GardenView
const [tasks, setTasks] = useState<ParentTask[]>(initialTasks)
const [filter, setFilter] = useState<'all' | string>('all')
const [editingId, setEditingId] = useState<string | null>(null)
const [newTaskId, setNewTaskId] = useState<string | null>(null)
const [formData, setFormData] = useState<FormData>(EMPTY_FORM)

// Mode derivado do editingId (sem estado separado)
const formMode: 'idle' | 'create' | 'edit' = editingId === 'new'
  ? 'create'
  : editingId !== null
    ? 'edit'
    : 'idle'

// Flash kredsNew — análogo ao pattern de WaterDrops (D-10)
function flashNew(id: string) {
  setNewTaskId(id)
  setTimeout(() => setNewTaskId(null), 1200)
}
```

### Pattern 3: Schema Drizzle — Adicionar Colunas Nullable

**What:** Adicionar campos opcionais à tabela existente sem breaking change.

**When to use:** D-03 — adicionar `category`, `days`, `approval` ao `taskTemplates`.

**Example:**
```typescript
// Source: Drizzle ORM docs (confirmado via Context7)
// src/lib/db/schema/index.ts — adicionar ao taskTemplates
export const taskTemplates = pgTable(
  'task_templates',
  {
    // ... campos existentes ...
    category: text('category'),           // nullable por padrão (sem .notNull())
    days: jsonb('days').$type<string[]>(), // nullable por padrão
    approval: boolean('approval').default(false).notNull(),
  },
  // ... indexes existentes mantidos ...
)
```

Após alterar o schema: `pnpm db:push` (ou `npx drizzle-kit push`).

[CITED: https://github.com/drizzle-team/drizzle-orm-docs]

### Anti-Patterns to Avoid

- **Não usar `useEffect` para sincronizar estado do form com editingId:** derivar `formMode` diretamente do `editingId` state — menos efeitos colaterais.
- **Não criar route group `(family)` desnecessário:** a rota `/family/[familyId]/tasks` convive corretamente com `/family/access/[familyId]` porque Next.js resolve segmentos estáticos (`access`) antes de dinâmicos (`[familyId]`).
- **Não passar `children` como variável (conflito com React prop):** usar nome alternativo como `familyChildren` ou `childProfiles` no Client Component.
- **Não adicionar `.notNull()` em `days` sem default:** é nullable no design handoff — tarefa sem dias definidos é válida.
- **Não usar `kreds_value` do banco para o `reward` do mock:** a coluna tem constraint `> 0`; o mock usa `reward: 0` para "Mordomia". Isso é intencional na Fase 5 (sem INSERT real) mas precisa ser resolvido na Fase 6.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verificação de sessão do guardian | Lógica própria de verificação JWT | `auth()` de `next-auth` | Padrão estabelecido Fase 2; já testado |
| Migração de schema | SQL manual `ALTER TABLE` | `drizzle-kit push` | Drizzle gerencia tipos e constraints automaticamente |
| Animação de glow ring | CSS keyframe custom | `--animate-kreds-new` já em `globals.css` | Animação já implementada na Fase 1 |
| Switch toggle | `<input type="checkbox">` estilizado | Componente `TaskToggle` inline | Precisa de pixel-perfect 42×24px com knob e transição `.2s` |
| Proteção de rota `/family/[familyId]/tasks` | Lógica no Server Component | Middleware já cobre `/family/*` | `src/middleware.ts` branch `/family/` já protege a rota |

**Key insight:** Toda a infraestrutura (auth, banco, animações, CSS tokens) já existe. A Fase 5 compõe — não constrói novo plumbing.

---

## Common Pitfalls

### Pitfall 1: `params` não é desestruturado diretamente

**What goes wrong:** `{ params: { familyId } }` sem `await` causa erro de tipagem no Next.js App Router — `params` é uma Promise.

**Why it happens:** Breaking change no Next.js 15+: `params` e `searchParams` são agora Promises.

**How to avoid:** Sempre `const { familyId } = await params` ou `const { familyId } = await props.params`.

**Warning signs:** TypeScript error "Property 'familyId' does not exist on type 'Promise<...>'".

[VERIFIED: next.js docs — padrão confirmado no access/[familyId]/page.tsx existente que já usa `const { familyId } = await params`]

### Pitfall 2: Conflito `children` prop vs React prop

**What goes wrong:** Nomear o array de childProfiles como `children` na prop do Client Component conflita com a prop `children` reservada do React.

**Why it happens:** React tipagem reserva `children: ReactNode` — nomear outra prop `children` causa confusão de tipos.

**How to avoid:** Usar `familyChildren: ChildProfile[]` ou `childProfiles: ChildProfile[]` como nome da prop.

**Warning signs:** TypeScript error sobre `children` incompatível com `ReactNode`.

[ASSUMED] — baseado em conhecimento de React types; verificável ao criar a interface de props.

### Pitfall 3: Route conflict `/family/[familyId]` vs `/family/access/[familyId]`

**What goes wrong:** Criar `/family/[familyId]/tasks` pode parecer conflitar com `/family/access/[familyId]`.

**Why it happens:** Confusão sobre resolução de rotas Next.js.

**How to avoid:** Não há conflito — Next.js resolve segmento estático `access` antes de segmento dinâmico `[familyId]`. A URL `/family/access/abc123` cai em `/family/access/[familyId]`; a URL `/family/abc123/tasks` cai em `/family/[familyId]/tasks`.

**Warning signs:** Nenhum — mas o teste do middleware precisa confirmar que `/family/abc123/tasks` retorna pass-through com cookie válido (o middleware já cobre `/family/*`).

[ASSUMED] — baseado em comportamento documentado do Next.js para rotas estáticas vs dinâmicas.

### Pitfall 4: kredsValue constraint `> 0` conflita com reward = 0 (Mordomia)

**What goes wrong:** Na Fase 6, ao tentar INSERT de tarefa com reward = 0, o constraint `kreds_value_positive` falhará.

**Why it happens:** O constraint foi criado nas fases iniciais assumindo recompensa sempre positiva. O conceito de "Mordomia" (reward = 0) foi adicionado no design handoff.

**How to avoid:** Na Fase 5, é transparente (mock sem INSERT). Documentar para Fase 6: precisará de `ALTER TABLE task_templates DROP CONSTRAINT kreds_value_positive` ou alterar para `>= 0`.

**Warning signs:** Em ambiente de dev, qualquer tentativa manual de INSERT com kredsValue = 0 falhará. Não afeta a Fase 5.

[VERIFIED: codebase — constraint confirmado no banco de dev via `\d task_templates`]

### Pitfall 5: Banco sem memberships de guardian em dev

**What goes wrong:** Se a page.tsx fizer lookup de `familyMemberships` para verificar que o guardian possui aquela família, a query retornará vazio (banco de dev não tem memberships cadastradas).

**Why it happens:** O banco de dev tem apenas dados básicos de seed (1 família, 1 child profile, 0 identities, 0 memberships).

**How to avoid:** Seguir o padrão de `/family/access/[familyId]/page.tsx`: auth() + query childProfiles, sem verificação de membership nesta fase. A verificação de membership real é responsabilidade da Fase 6.

**Warning signs:** Se o plano incluir lookup de `familyMemberships` na page.tsx da Fase 5, isso quebrará em dev.

[VERIFIED: codebase — verificado via psql no banco local]

### Pitfall 6: Estado do form — `editingId = 'new'` como sentinela

**What goes wrong:** Usar um `boolean isCreating` separado cria estado duplicado com `editingId`.

**Why it happens:** Dois booleans (editando + criando) sempre deveriam ser mutuamente exclusivos.

**How to avoid:** Usar `editingId: string | 'new' | null` como sentinela: `null = idle`, `'new' = create mode`, `<taskId> = edit mode`. Derivar `formMode` sem estado adicional.

**Warning signs:** Dois `useState` para criar/editar que precisam ser sincronizados.

[ASSUMED] — padrão recomendado baseado no design handoff state model.

---

## Code Examples

### SSR page.tsx com auth e query de childProfiles

```typescript
// Source: src/app/family/access/[familyId]/page.tsx (codebase verificado)
import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'  // ajustar caminho relativo
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ParentPanelView } from '@/components/parent/parent-panel-view'
import { MOCK_PARENT_TASKS } from '@/lib/seed/parent-seed'

export default async function ParentTasksPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params   // OBRIGATÓRIO: await params (Next.js App Router)

  const session = await auth()
  if (!session) redirect('/login')

  const children = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
      avatarPreset: childProfiles.avatarPreset,
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))

  return (
    <ParentPanelView
      familyId={familyId}
      familyName="Família Teste"
      currentUserName={session.user?.name ?? ''}
      familyChildren={children}       // ATENÇÃO: não usar 'children' (reservado pelo React)
      initialTasks={MOCK_PARENT_TASKS}
    />
  )
}
```

### Schema Drizzle — adicionar campos a taskTemplates

```typescript
// Source: src/lib/db/schema/index.ts (codebase verificado) + Drizzle docs
import { jsonb } from 'drizzle-orm/pg-core'

// Adicionar ao objeto de colunas do pgTable taskTemplates:
category: text('category'),             // nullable — sem .notNull()
days: jsonb('days').$type<string[]>(),  // nullable — array D/S/T/Q/Q/S/S
approval: boolean('approval').notNull().default(false),

// Depois: pnpm db:push
```

### Seed Mock tipado (parent-seed.ts)

```typescript
// Padrão: src/lib/seed/garden-seed.ts (codebase verificado)
// src/lib/seed/parent-seed.ts

export interface ParentTask {
  id: string
  title: string
  category: 'quarto' | 'higiene' | 'estudos' | 'casa' | 'espiritual'
  reward: number          // inteiro R$; 0 = mordomia
  days: string[]          // subset de ['D','S','T','Q','Q','S','S']
  assigned: string[]      // childProfile ids
  active: boolean
  approval: boolean
}

export const MOCK_PARENT_TASKS: ParentTask[] = [
  {
    id: 'pt1',
    title: 'Arrumar o quarto',
    category: 'quarto',
    reward: 5,
    days: ['S', 'T', 'Q', 'Q', 'S'],  // Segunda a Sexta
    assigned: [],                       // page.tsx popula com child id real
    active: true,
    approval: false,
  },
  // ... mais tarefas de seed ...
]
```

### Animação kredsNew — uso no task card

```typescript
// Source: src/app/globals.css (codebase verificado) + src/components/tasks/task-card.tsx
// Animação já definida: --animate-kreds-new: kredsNew 1.2s ease

// Em ParentTaskCard:
<div
  style={{
    // ...outros estilos...
    animation: justAdded ? 'var(--animate-kreds-new)' : undefined,
  }}
>
  {/* conteúdo do card */}
</div>
```

---

## Runtime State Inventory

Esta fase não é de rename/refactor. Sem runtime state inventory necessário.

**Relevante para banco de dados:**
- Tabela `task_templates`: colunas `category`, `days`, `approval` **não existem** no banco de dev — confirmado via `\d task_templates`. O `drizzle-kit push` é um passo obrigatório do plano.
- Constraint `kreds_value_positive` (`> 0`) **existe** no banco — não será alterado na Fase 5.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.familyId` síncrono | `(await params).familyId` assíncrono | Next.js 15+ | BREAKING — page.tsx deve usar `await params` |
| `getServerSession()` (next-auth v4) | `auth()` (next-auth v5 beta) | Fase 2 deste projeto | Padrão já migrado; `auth()` é o correto |

**Deprecated/outdated:**
- `getServerSession` de `next-auth/next`: substituído por `auth()` em next-auth v5. O projeto já usa o padrão correto.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Route `/family/[familyId]/tasks` não conflita com `/family/access/[familyId]` — Next.js resolve estático antes de dinâmico | Pitfall 3 | Se houver conflito, precisaria de route group `(family)` — mudança estrutural mínima |
| A2 | `editingId: string | 'new' | null` como sentinela elimina necessidade de estado separado para create/edit | Pitfall 6 | Se o comportamento for mais complexo, pode precisar de estado separado — baixo impacto |
| A3 | `session.user.name` está preenchido após auth Zitadel para exibir no badge do topbar | Code Examples | Se name for null, UserBadge mostraria string vazia — fallback simples para email |
| A4 | Avatar preset do child_profiles é suficiente para gerar mini avatar nos filter chips sem asset externo | Architecture | Se avatarPreset precisar de arquivo de imagem não disponível, usar inicial como fallback |

---

## Open Questions

1. **Nome da família para o breadcrumb**
   - What we know: A tabela `families` tem coluna `name`. A page.tsx tem acesso ao `familyId`.
   - What's unclear: O mock usa "Família Teste" — a page.tsx deve fazer uma query extra de `families.name`?
   - Recommendation: Sim, adicionar `db.select({ name: families.name }).from(families).where(eq(families.id, familyId))` na page.tsx. É uma query simples e o breadcrumb com nome real é melhor UX.

2. **Formato de avatar nos filter chips (PTASK-03)**
   - What we know: `childProfiles.avatarPreset` existe no banco (ex: `'sprout'`). `childProfiles.accentColor` fornece a cor.
   - What's unclear: Os presets de avatar são arquivos de imagem, iniciais com fundo colorido, ou SVGs?
   - Recommendation: Usar inicial do `displayName` com fundo da `accentColor` — padrão que já funciona nos profile cards da Fase 2. Confirmar com o design handoff visual.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build | ✓ | 22.22.3 | — |
| PostgreSQL | `drizzle-kit push` + query childProfiles | ✓ | 16.14 (Homebrew) | — |
| psql CLI | Verificação manual de schema | ✓ | 16.14 em `/opt/homebrew/Cellar/postgresql@16/16.14/bin/psql` | Usar drizzle studio |
| pnpm | Instalar dependências | ✓ | 10.34.1 | — |
| DATABASE_URL | Drizzle push | ✓ | `postgresql://kreds:kreds_dev@localhost:5432/kreds_dev` | — |

**Missing dependencies with no fallback:** nenhuma.

**Nota sobre psql:** `psql` não está no `$PATH` do agente — usar `/opt/homebrew/Cellar/postgresql@16/16.14/bin/psql` com `PGPASSWORD=kreds_dev` para verificações manuais.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (raiz) |
| Quick run command | `pnpm test -- tests/unit/parent-panel.test.tsx` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PTASK-01 | Layout renderiza sidebar 80px + main + painel direito 336px | unit (render) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-02 | Topbar exibe breadcrumb com família e badge do usuário | unit (render) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-03 | Filter chips mostram "Todas" + chip por criança | unit (render + click) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-04 | Task card com toggle e lápis; toggle independente do form | unit (interaction) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-05 | 5 categorias com cores distintas renderizadas nos cards | unit (render) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-06 | Painel direito renderiza form com todos os campos | unit (render) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-07 | Stepper: reward=0 mostra "Mordomia"; +/- incrementa/decrementa | unit (interaction) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-08 | Pills de recorrência toggle; "Todos os dias" seleciona todos | unit (interaction) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-09 | Após criar tarefa, card recebe animação kredsNew 1.2s | unit (interaction) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |
| PTASK-10 | Botão excluir aparece somente em modo edit, não em create | unit (interaction) | `pnpm test -- tests/unit/parent-panel.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test -- tests/unit/parent-panel.test.tsx`
- **Per wave merge:** `pnpm test -- tests/unit/` (unit tests only — integration/e2e falham por módulos ausentes de fases futuras)
- **Phase gate:** Suite unit passando antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/parent-panel.test.tsx` — cobre PTASK-01..10
- [ ] `src/lib/seed/parent-seed.ts` — dados mock tipados para o componente
- [ ] Schema update em `src/lib/db/schema/index.ts` (PTASK pre-req para drizzle-kit push)

*(Infraestrutura de testes existente — `tests/setup.ts`, `vitest.config.ts`, `@testing-library/react` — já instalada e funcionando para componentes React)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | `auth()` de next-auth — já implementado na Fase 2 |
| V3 Session Management | sim | next-auth JWT strategy — já implementado |
| V4 Access Control | sim (parcial) | middleware verifica cookie; page.tsx verifica sessão. Verificação de ownership (familyId pertence ao guardian) é responsabilidade da Fase 6 |
| V5 Input Validation | sim | formData validado no Client antes de atualizar o estado local — sem persistência na Fase 5 |
| V6 Cryptography | não | sem operações criptográficas novas nesta fase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR (familyId da URL não verificado contra guardian) | Elevation of Privilege | Fase 5: middleware + `auth()` suficiente para MVP. Fase 6 adicionará `requireActiveGuardian` do `src/lib/auth/authorization.ts` |
| XSS via task title sem sanitização | Tampering | React escapa automaticamente conteúdo renderizado via JSX — sem `dangerouslySetInnerHTML` |
| State tampering via devtools | Tampering | Estado local mock — sem persistência; risco aceitável em fase de UI |

**Nota de segurança:** A verificação que o `familyId` da URL pertence ao guardian logado (`requireActiveGuardian`) está implementada em `tests/unit/family-authorization.test.ts` mas o módulo `src/lib/auth/authorization.ts` ainda não existe no código-fonte (foi commitado na Fase 2 mas removido). Isso não bloqueia a Fase 5 (mock sem membership real no banco de dev), mas o planner deve notar que `family-authorization.test.ts` está falhando na suite atual. Não é pré-requisito desta fase.

---

## Sources

### Primary (MEDIUM confidence)
- `/vercel/next.js` (Context7) — `params: Promise<{ slug }>` padrão em Server Components dinâmicos
- `/drizzle-team/drizzle-orm-docs` (Context7) — adicionar colunas nullable a tabelas existentes

### Secondary — codebase verificado diretamente
- `src/app/family/access/[familyId]/page.tsx` — padrão SSR com auth() + childProfiles query
- `src/components/garden/garden-view.tsx` — padrão Client Component raiz com useState
- `src/app/globals.css` — animações CSS disponíveis (kredsNew, tokens de cor)
- `src/lib/db/schema/index.ts` — estrutura de taskTemplates e childProfiles
- `src/middleware.ts` — cobertura de /family/* confirmada
- `.planning/phases/05-parent-panel/05-UI-SPEC.md` — contrato visual completo
- `.planning/phases/05-parent-panel/05-CONTEXT.md` — decisões de implementação
- PostgreSQL banco local — schema atual de task_templates confirmado sem as 3 novas colunas

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — todos os pacotes já instalados e em uso no projeto
- Architecture: HIGH — padrão SSR+Client View confirmado e testado nas Fases 3-4
- Schema: HIGH — banco local inspecionado diretamente; colunas ausentes confirmadas
- UI Spec: HIGH — UI-SPEC.md aprovado disponível com todos os tokens e medidas
- Pitfalls: MEDIUM — pitfalls 1/4/5 verificados no codebase; 2/3/6 inferidos mas de baixo impacto

**Research date:** 2026-06-25
**Valid until:** 2026-07-25 (30 dias — stack estável)
