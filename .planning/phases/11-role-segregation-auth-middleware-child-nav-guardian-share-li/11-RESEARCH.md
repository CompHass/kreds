# Phase 11: Role Segregation — Research

**Researched:** 2026-06-09
**Domain:** Next.js App Router middleware, dual-session auth (NextAuth v5 + child JWT), Drizzle schema additions, child UX
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Todas as páginas do filho ficam em `/child/[childId]/` e requerem o cookie de sessão do filho (`child-session`). A página `/child/home` existente permanece mas redireciona para `/child/[childId]/dashboard`.
- **D-02:** Todas as páginas do guardião ficam em `/family/` e requerem sessão NextAuth. Estrutura existente é preservada.
- **D-03:** `src/middleware.ts` aplica as regras: `/child/*` → requer child session → redireciona para `/family/access/[familyId]` se ausente; `/family/*` → requer NextAuth → redireciona para `/api/auth/signin`; rotas públicas: `/`, `/family/access/[familyId]`, `/api/auth/*`, `/api/child/*`.
- **D-04:** Botão "Compartilhar acesso" em cada card em `/family/children` copia `${NEXT_PUBLIC_APP_URL}/family/access/${familyId}`. Sem QR code em v1.
- **D-05:** `ChildBottomNav` espelha `BottomNav` com abas: Jardim, Tarefas, Sonhos, Saldo.
- **D-06:** `/child/[childId]/dashboard` — jardim visual, contagem de tarefas, saldo disponível.
- **D-07:** `/child/[childId]/tasks` — tabela `task_completions` (id, taskTemplateId, childProfileId, cycleStart, completedAt, status enum pending|completed). Apenas tarefas atribuídas ao filho. Marcar/desmarcar sem aprovação do guardião nesta fase.
- **D-08:** `/child/[childId]/dreams` — metas wishlist existentes. Move lógica GoalCard de `/(app)/child/[childId]/balance`.
- **D-09:** `/child/[childId]/balance` — saldo disponível + histórico do ledger.
- **D-10:** Tabela `donations` (id, familyId, childProfileId, targetLabel, amountKreds, status enum pending|approved|rejected, requestedAt, approvedAt). UI simples: lista + formulário "Doe". Rota: `/child/[childId]/donations`.
- **D-11:** Remover link direto `/child/${child.id}/balance` de `/family/children`. Substituir por `/guardian/${child.id}/balance` (view do guardião usando NextAuth, não child session).
- **D-12:** `/(app)/child/[childId]/*` — adicionar `requireChildSession` + verificar `session.childProfileId === childId`. `/(app)/guardian/[childId]/*` — adicionar guard de sessão do guardião via `requireAuthenticatedIdentity`.

### Claude's Discretion

- Design visual do `ChildBottomNav` segue exatamente o `BottomNav` existente (mesmas cores, fonte, estado ativo em pill)
- Copy-to-clipboard usa `navigator.clipboard.writeText` com indicador de status/toast
- Garden do child dashboard usa a mesma imagem `/garden-isometric.png` já em public/
- `task_completions.cycleStart` computado server-side usando `getCycleForDate` existente
- Drizzle migration para tabelas `task_completions` e `donations` deve rodar antes da UI

### Deferred Ideas (OUT OF SCOPE)

- QR code para link de acesso do filho — adiado para v2
- Fluxo de aprovação do guardião para task completions — Phase 5 (ACT-04 a ACT-09)
- UI completa de aprovação de doações para guardião — Phase 8
- Crescimento do jardim no child dashboard vinculado ao progresso de tarefas — Phase 6

</user_constraints>

---

## Summary

Esta fase implementa a segregação completa de papéis no Kreds. O trabalho central é o `src/middleware.ts` que protege `/child/*` com o cookie JWT customizado (`child-session`) e `/family/*` com a sessão NextAuth v5. Ambos os sistemas de sessão já estão implementados — o middleware apenas orquestra o roteamento de acordo com o papel.

A segunda camada de trabalho é a criação de duas novas tabelas Drizzle (`task_completions` e `donations`), seguida de migrations. As páginas do filho são todas Server Components usando `requireChildSession()` já existente; nenhuma biblioteca nova é necessária.

A terceira camada é a UX: `ChildBottomNav`, cinco novas páginas do filho (`/dashboard`, `/tasks`, `/dreams`, `/balance`, `/donations`), o botão de compartilhamento no `/family/children`, e a criação de `/guardian/[childId]/balance` (view do guardião do saldo do filho).

**Recomendação primária:** Implementar na ordem Wave 0 (schema + migration) → Wave 1 (middleware) → Wave 2 (páginas filho) → Wave 3 (ChildBottomNav + fixos guardião). A migration deve vir primeiro porque as páginas de tarefas dependem da tabela `task_completions` existir.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route protection por papel | Frontend Server (middleware) | — | Middleware roda no Edge antes de qualquer Server Component |
| Verificação de child session JWT | Frontend Server (middleware) | API / Backend (Server Components) | Middleware faz verificação leve; Server Components fazem verificação completa |
| Verificação de NextAuth session | Frontend Server (middleware) | — | Cookie JWT da NextAuth verificado via `auth()` no middleware |
| Tabelas task_completions / donations | Database / Storage | — | Schema Drizzle + migration PostgreSQL |
| Task mark complete/uncomplete | API / Backend | Browser / Client | Server Action ou Route Handler; UI otimista no client |
| Copy-to-clipboard share link | Browser / Client | — | `navigator.clipboard` é API do browser; requer `'use client'` |
| ChildBottomNav | Browser / Client | — | Componente de navegação React puro, client-side |
| Child dashboard / pages | Frontend Server (SSR) | — | Server Components com `requireChildSession` |
| Guardian balance view | API / Backend | — | Server Component com `requireAuthenticatedIdentity` |

---

## Standard Stack

### Core — sem pacotes novos necessários

Todos os pacotes já instalados e verificados. Nenhuma instalação necessária nesta fase.

| Biblioteca | Versão instalada | Propósito na fase | Fonte |
|------------|-----------------|-------------------|-------|
| `next` | 16.2.7 | Middleware, App Router, Server Components | [VERIFIED: npm registry] |
| `jose` | 6.2.3 | Verificação JWT do child session no middleware | [VERIFIED: npm registry] |
| `next-auth` | 5.0.0-beta.31 | Sessão NextAuth (guardian auth) | [VERIFIED: npm registry] |
| `drizzle-orm` | 0.45.2 | Novas tabelas task_completions / donations | [VERIFIED: npm registry] |
| `drizzle-kit` | 0.31.10 | `pnpm db:generate` + `pnpm db:migrate` | [VERIFIED: npm registry] |

### Sem pacotes novos para instalar

Esta fase não requer nenhum `npm install`. Todas as dependências já existem no `package.json`.

## Package Legitimacy Audit

Nenhum pacote novo a instalar nesta fase. Verificação de slopcheck nos pacotes existentes usados:

| Pacote | Registry | slopcheck | Disposição |
|--------|----------|-----------|------------|
| next | npm | [OK] | Aprovado — já instalado |
| jose | npm | [OK] | Aprovado — já instalado |
| next-auth | npm | [OK] | Aprovado — já instalado |
| drizzle-orm | npm | [OK] | Aprovado — já instalado |

**Pacotes removidos por slopcheck [SLOP]:** nenhum
**Pacotes suspeitos [SUS]:** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
Requisição do browser
        │
        ▼
┌──────────────────────────────────────┐
│  src/middleware.ts (Edge Runtime)    │
│                                      │
│  /child/* path?                      │
│    → ler cookie "child-session"      │
│    → jwtVerify(token, secret)        │
│    → se inválido: redirect           │
│      /family/access/[familyId]       │
│                                      │
│  /family/* path?                     │
│    → ler cookie "authjs.session-token"│
│      (NextAuth v5 — HTTP dev) OU     │
│      "__Secure-authjs.session-token" │
│      (HTTPS prod)                    │
│    → se ausente: redirect            │
│      /api/auth/signin                │
│                                      │
│  Rotas públicas: pass-through        │
│  /api/child/*, /api/auth/*,          │
│  /family/access/*, /                 │
└──────────────────────────────────────┘
        │
        ▼ (passou pelo middleware)
┌────────────────────────────┐
│  Server Component (RSC)    │
│                            │
│  /child/[childId]/*        │
│    requireChildSession()   │ ← segunda verificação completa
│    + verificar childId     │   garante escopo correto
│                            │
│  /family/*                 │
│    requireAuthenticatedIdentity()
│    + resolveKredsIdentityId()
│    + requireActiveGuardian()
└────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│  API Routes                      │
│  POST /api/child/[childId]/      │
│       tasks/[taskId]/complete    │  ← NOVO: task completion
│  POST /api/child/[childId]/      │
│       donations                  │  ← NOVO: donation request
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│  PostgreSQL (Drizzle)            │
│  task_completions  ← NOVA        │
│  donations         ← NOVA        │
│  task_templates    (existente)   │
│  ledger_*          (existente)   │
│  wishlist_goals    (existente)   │
└──────────────────────────────────┘
```

### Estrutura de arquivos recomendada

```
src/
├── middleware.ts                          ← NOVO: roteamento por papel
├── components/
│   └── ChildBottomNav.tsx                ← NOVO: nav filho
├── app/
│   ├── child/
│   │   └── [childId]/
│   │       ├── dashboard/page.tsx        ← NOVO
│   │       ├── tasks/
│   │       │   ├── page.tsx              ← NOVO
│   │       │   └── TaskToggleButton.tsx  ← NOVO ('use client')
│   │       ├── dreams/page.tsx           ← NOVO (migra de /(app))
│   │       ├── balance/page.tsx          ← NOVO (simplificado)
│   │       └── donations/page.tsx        ← NOVO
│   ├── (app)/
│   │   ├── child/[childId]/*             ← EXISTENTE: adicionar requireChildSession
│   │   └── guardian/[childId]/*          ← EXISTENTE: verificar guard
│   └── family/
│       └── children/
│           └── ShareLinkButton.tsx       ← NOVO ('use client')
│   └── (app)/
│       └── guardian/
│           └── [childId]/
│               └── balance/page.tsx      ← NOVO: view do guardião
└── lib/
    └── db/
        └── schema/
            └── index.ts                  ← MODIFICADO: + task_completions, donations
```

### Pattern 1: Middleware Next.js com dupla sessão

**O que é:** Middleware único que verifica dois sistemas de sessão distintos com lógica de path matching.

**Quando usar:** Qualquer rota do filho, qualquer rota do guardião.

**Observação crítica:** No middleware, `import 'server-only'` **não pode ser usado** — o middleware roda no Edge Runtime, não no Node.js. O módulo `src/lib/families/child-session.ts` tem `import 'server-only'` no topo e portanto **NÃO PODE ser importado diretamente no middleware**. A verificação JWT deve ser refeita inline no middleware usando `jose` diretamente.

```typescript
// src/middleware.ts
// CORRETO: usa jose direto, não importa child-session.ts (que tem 'server-only')
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const CHILD_SESSION_COOKIE = 'child-session'
// NextAuth v5 usa 'authjs.session-token' em HTTP dev, '__Secure-authjs.session-token' em HTTPS prod
const NEXTAUTH_COOKIE_DEV = 'authjs.session-token'
const NEXTAUTH_COOKIE_PROD = '__Secure-authjs.session-token'

const PUBLIC_PATHS = ['/', '/api/auth', '/api/child', '/family/access']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/child/')) {
    const token = request.cookies.get(CHILD_SESSION_COOKIE)?.value
    if (!token) {
      // Sem familyId no cookie → redirecionar para home ou signin
      return NextResponse.redirect(new URL('/', request.url))
    }
    try {
      const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET)
      const { payload } = await jwtVerify(token, secret)
      if (payload.role !== 'child') throw new Error('not a child token')
      // Payload válido — deixar passar
      return NextResponse.next()
    } catch {
      // Token inválido → redirecionar para acesso da família se soubermos o familyId
      // Como não sabemos sem decodificar, redirecionar para home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname.startsWith('/family/')) {
    const isSecure = request.url.startsWith('https')
    const cookieName = isSecure ? NEXTAUTH_COOKIE_PROD : NEXTAUTH_COOKIE_DEV
    const sessionToken = request.cookies.get(cookieName)?.value
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/guardian/') || pathname.match(/^\/(app)\/child\//)) {
    // Coberto pelo grupo (app) — verificação feita no Server Component
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|sw\\.js$).*)',
  ],
}
```

**Fonte:** [CITED: https://nextjs.org/docs/app/guides/authentication]

### Pattern 2: Verificação dupla — middleware + Server Component

**O que é:** O middleware faz verificação "leve" (presença do cookie) para redirecionar rápido. O Server Component faz verificação completa (validade do JWT + escopo do childId).

**Por quê é importante:** O middleware não deve ser o único guarda — ele protege contra acesso acidental. O `requireChildSession()` no Server Component protege contra adulteração.

```typescript
// Em /child/[childId]/dashboard/page.tsx
export default async function ChildDashboardPage({ params }: Props) {
  const { childId } = await params
  
  // Segunda verificação — completa, com validação de escopo
  const session = await requireChildSession()
  
  // Verificar que o token pertence a este filho específico
  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/dashboard`)
  }
  // ...
}
```

### Pattern 3: Schema Drizzle com uniqueIndex composto

**O que é:** Constraint UNIQUE em múltiplas colunas usando `uniqueIndex` na factory do Drizzle.

**Padrão existente no projeto** (referência: `uniqueActiveGuardian` em `familyMemberships`):

```typescript
// Exemplo: uniqueIndex composto existente no projeto
(table) => ({
  uniqueActiveGuardian: uniqueIndex('unique_active_guardian').on(
    table.familyId,
    table.identityId,
  ),
})
```

**Aplicação para `task_completions`:**

```typescript
// src/lib/db/schema/index.ts — NOVO
export const taskCompletionStatusEnum = pgEnum('task_completion_status', ['pending', 'completed'])

export const taskCompletions = pgTable(
  'task_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskTemplateId: uuid('task_template_id')
      .notNull()
      .references(() => taskTemplates.id),
    childProfileId: uuid('child_profile_id')
      .notNull()
      .references(() => childProfiles.id),
    cycleStart: text('cycle_start').notNull(), // ISO date string: 'YYYY-MM-DD'
    completedAt: timestamp('completed_at'),
    status: taskCompletionStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    childIdIdx: index('task_completions_child_id_idx').on(table.childProfileId),
    taskIdIdx: index('task_completions_task_id_idx').on(table.taskTemplateId),
    // Constraint: uma completion por tarefa por filho por ciclo
    uniqueTaskChildCycle: uniqueIndex('unique_task_child_cycle').on(
      table.taskTemplateId,
      table.childProfileId,
      table.cycleStart,
    ),
  }),
)
```

**Fonte:** [VERIFIED: npm registry] via leitura direta do schema existente do projeto

### Pattern 4: Tabela donations

```typescript
// src/lib/db/schema/index.ts — NOVO
export const donationStatusEnum = pgEnum('donation_status', ['pending', 'approved', 'rejected'])

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    childProfileId: uuid('child_profile_id')
      .notNull()
      .references(() => childProfiles.id),
    targetLabel: text('target_label').notNull(),
    amountKreds: integer('amount_kreds').notNull(),
    status: donationStatusEnum('status').notNull().default('pending'),
    requestedAt: timestamp('requested_at').defaultNow().notNull(),
    approvedAt: timestamp('approved_at'),
  },
  (table) => ({
    familyIdIdx: index('donations_family_id_idx').on(table.familyId),
    childIdIdx: index('donations_child_id_idx').on(table.childProfileId),
    amountCheck: check('donation_amount_positive', sql`${table.amountKreds} > 0`),
  }),
)
```

### Pattern 5: Task toggle (Server Action ou Route Handler)

**O que é:** A UI de tarefas tem um botão toggle que precisa de interatividade. Como é `'use client'`, usa fetch para um Route Handler.

**Padrão existente no projeto** (referência: `GoalCard.tsx` usando `/api/child/[childId]/goals/[goalId]/allocate`):

```typescript
// src/app/api/child/[childId]/tasks/[taskId]/complete/route.ts — NOVO
import { NextRequest, NextResponse } from 'next/server'
import { getChildSession } from '@/lib/families/child-session'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string; taskId: string }> }
) {
  const { childId, taskId } = await params
  const cookieStore = await cookies()
  const session = await getChildSession(cookieStore)
  
  if (!session || session.childProfileId !== childId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... lógica de marcar completo/incompleto
}
```

### Pattern 6: NEXT_PUBLIC_APP_URL — já existe

**Descoberta:** `NEXT_PUBLIC_APP_URL` já está declarado em `src/lib/env.ts` como `z.string().url().optional()` e presente no `.env.example` como `http://localhost:3000`.

**Ação necessária:** Mudar de `.optional()` para `.default('http://localhost:3000')` para que o compartilhamento de link funcione mesmo sem a env var explícita no dev. [ASSUMED — o planner confirma se convém manter opcional ou ter fallback]

### Anti-Patterns a Evitar

- **Importar `child-session.ts` no middleware:** O arquivo tem `import 'server-only'` no topo. Middleware roda no Edge Runtime e não suporta módulos Node.js. Usar `jose` diretamente no middleware.
- **Usar `cookies()` de `next/headers` no middleware:** No middleware, ler cookies via `request.cookies.get()`. A API `cookies()` de `next/headers` é para Server Components/Route Handlers.
- **Verificar apenas no middleware e não no Server Component:** Fazer dupla verificação. O middleware pode ser contornado por bugs de configuração no matcher.
- **Deixar `/(app)/child/*` sem guard:** Estes routes existem atualmente sem `requireChildSession`. Devem ser corrigidos.
- **Criar nova página de balance do filho duplicando a existente:** A nova `/child/[childId]/balance` deve reusar queries existentes (`getBalance`, `getChildLedgerHistory`) sem duplicar lógica.

---

## Don't Hand-Roll

| Problema | Não construir | Usar em vez disso | Por quê |
|----------|---------------|-------------------|---------|
| JWT verification no middleware | Verificação manual de base64 | `jwtVerify` do `jose` (já instalado) | Handles expiração, assinatura, claims |
| Copy-to-clipboard | Código manual de seleção + execCommand | `navigator.clipboard.writeText()` | API moderna suportada nos browsers alvo |
| Cálculo do cycleStart | Lógica de domingo custom | `getCycleForDate(new Date(), 'America/Sao_Paulo')` | Já testado, trata DST e timezone |
| Task completions idempotência | Lógica de upsert manual | `uniqueIndex` no schema + `ON CONFLICT` no Drizzle | Banco garante a constraint |
| Formatação de datas em português | `toLocaleString` manual | `Intl.DateTimeFormat('pt-BR', ...)` | Padrão já usado no projeto |

---

## Common Pitfalls

### Pitfall 1: `import 'server-only'` bloqueia middleware

**O que dá errado:** Importar `requireChildSession` ou `getChildSession` de `child-session.ts` no middleware causa erro de build: `Server-only module cannot be used in the Edge runtime`.

**Por que acontece:** `child-session.ts` tem `import 'server-only'` na linha 1 para proteger o segredo JWT no server. O middleware roda no Edge Runtime, não no Node.js completo.

**Como evitar:** No middleware, verificar o JWT do filho usando `jose.jwtVerify` diretamente. Extrair o `CHILD_SESSION_SECRET` via `process.env.CHILD_SESSION_SECRET` (sem passar pelo `env.ts`, que também pode ter dependências Node).

**Sinais de alerta:** Build error mentioning Edge Runtime, `server-only` no stack trace.

### Pitfall 2: Nome do cookie NextAuth muda entre HTTP e HTTPS

**O que dá errado:** Em produção (HTTPS), o cookie da NextAuth v5 é `__Secure-authjs.session-token`. Em desenvolvimento (HTTP), é `authjs.session-token`. Checar apenas um nome faz o middleware redirecionar todo mundo desnecessariamente em prod ou dev.

**Por que acontece:** NextAuth v5 usa o prefixo `__Secure-` em cookies em ambientes HTTPS como requisito de segurança do browser.

**Como evitar:** No middleware, checar se `request.url.startsWith('https')` e selecionar o nome de cookie correto.

**Sinais de alerta:** Guardião é redirecionado para signin mesmo estando autenticado em prod.

### Pitfall 3: Middleware matcher exclui rotas do service worker

**O que dá errado:** O matcher amplo `'/(.*)'` intercepta requisições para `/sw.js`, `/_next/static`, e `/garden-isometric.png`, causando redirecionamentos incorretos.

**Por que acontece:** O matcher do middleware aplica-se a TODAS as requisições se não for filtrado corretamente.

**Como evitar:** Usar o matcher negativo: `'/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|sw\\.js$).*)'`. O Serwist (`/sw.js`) deve ser explicitamente excluído.

**Sinais de alerta:** Service worker não carrega; imagens não aparecem; PWA quebra.

### Pitfall 4: `/(app)` sem layout.tsx — verificações manuais necessárias

**O que dá errado:** O grupo de rota `/(app)` não tem `layout.tsx`. Não há auth centralizada no grupo — cada page.tsx precisa chamar seu guard manualmente.

**Por que acontece:** É o padrão atual do projeto para `/(app)`. Não foi centralizado intencionalmente.

**Como evitar:** Adicionar `requireChildSession()` + `session.childProfileId === childId` check em cada `/(app)/child/[childId]/*` page. Adicionar `requireCurrentFamilyContext()` em cada `/(app)/guardian/[childId]/*` page.

**Sinais de alerta:** Páginas do grupo `/(app)` acessíveis sem sessão válida.

### Pitfall 5: cycleStart como string ISO — formato crítico

**O que dá errado:** Usar `.toISOString()` diretamente produz `'2026-06-07T03:00:00.000Z'` (com hora e timezone). A constraint `uniqueIndex` em `(taskTemplateId, childProfileId, cycleStart)` falharia se diferentes fusos gerarem strings diferentes para o mesmo ciclo.

**Por que acontece:** `getCycleForDate` retorna um `Date` object. `.toISOString()` inclui hora.

**Como evitar:** Usar `cycleStart.toISOString().split('T')[0]` para obter apenas `'YYYY-MM-DD'`. Documentado explicitamente no CONTEXT.md.

**Sinais de alerta:** Constraint violations ao marcar tarefas; múltiplas rows para o mesmo ciclo.

### Pitfall 6: Link `/child/${child.id}/balance` em `/family/children` usa child session

**O que dá errado:** O guardião clica em "Sonhos" em `/family/children` que aponta para `/child/${child.id}/balance`. Esse caminho agora requer child session. O guardião não tem child session → redirecionado para o acesso do filho.

**Por que acontece:** O link foi criado antes da segregação de papéis. Verificado no código: linha 295-308 em `src/app/family/children/page.tsx`.

**Como evitar:** D-11: remover esse link. Criar `/guardian/[childId]/balance` usando NextAuth session. Adicionar link para a nova rota de guardião no card.

**Sinais de alerta:** Guardian redirecionado para PIN do filho ao tentar ver balance.

---

## Code Examples

### Leitura do cookie child-session no middleware (sem server-only)

```typescript
// Source: Verificado via leitura de src/lib/families/child-session.ts + docs Next.js
import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

async function verifyChildCookie(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('child-session')?.value
  if (!token) return false
  
  try {
    const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload.role === 'child'
  } catch {
    return false
  }
}
```

### cycleStart para task_completions

```typescript
// Source: src/modules/activity/cycle.ts + D-07 no CONTEXT.md
import { getCycleForDate } from '@/modules/activity/cycle'

function getCurrentCycleStart(timezone = 'America/Sao_Paulo'): string {
  const { cycleStart } = getCycleForDate(new Date(), timezone)
  return cycleStart.toISOString().split('T')[0] // 'YYYY-MM-DD'
}
```

### Upsert de task_completion (idempotente)

```typescript
// Source: Drizzle-orm pattern — onConflictDoUpdate
await db
  .insert(schema.taskCompletions)
  .values({
    taskTemplateId,
    childProfileId: session.childProfileId,
    cycleStart: getCurrentCycleStart(),
    status: 'completed',
    completedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: [
      schema.taskCompletions.taskTemplateId,
      schema.taskCompletions.childProfileId,
      schema.taskCompletions.cycleStart,
    ],
    set: {
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  })
```

### Verificar family timezone para cycle

O `getCycleForDate` requer timezone. Para o child dashboard, buscar a family timezone via `childProfileId → familyId → families.timezone`.

```typescript
// Busca timezone da família via child profile
const [familyData] = await db
  .select({ timezone: schema.families.timezone })
  .from(schema.families)
  .innerJoin(schema.childProfiles, eq(schema.childProfiles.familyId, schema.families.id))
  .where(eq(schema.childProfiles.id, session.childProfileId))
  .limit(1)

const timezone = familyData?.timezone ?? 'America/Sao_Paulo'
```

---

## Key Technical Answers

### Q1: Como o middleware funciona com NextAuth e child JWT?

O middleware tem acesso a `request.cookies` (API Edge Runtime). Para child session: verifica o cookie `child-session` com `jose.jwtVerify` diretamente (sem importar `child-session.ts`). Para NextAuth: verifica a presença do cookie `authjs.session-token` (dev) ou `__Secure-authjs.session-token` (prod) — verificação de presença é suficiente no middleware porque o Server Component fará a verificação completa. [VERIFIED: leitura do código + docs Next.js]

### Q2: Cookie do child session — nome e campos

Nome do cookie: `child-session` (definido em `child-session.ts` linha 7, const `CHILD_SESSION_COOKIE`). Campos JWT: `{ childProfileId: string, familyId: string, role: 'child' }`. TTL: 8 horas. Algoritmo: HS256. Secret: `CHILD_SESSION_SECRET` (mínimo 32 chars). [VERIFIED: leitura direta de src/lib/families/child-session.ts]

### Q3: Constraint composta no schema Drizzle

Padrão existe no projeto: `uniqueIndex('nome').on(table.col1, table.col2, table.col3)`. Ver `uniqueActiveGuardian` em `familyMemberships`. Aplicar o mesmo para `task_completions`: `uniqueIndex('unique_task_child_cycle').on(table.taskTemplateId, table.childProfileId, table.cycleStart)`. [VERIFIED: leitura direta de src/lib/db/schema/index.ts]

### Q4: NEXT_PUBLIC_APP_URL no env.ts

Já existe como `.optional()` (linha 6 de `src/lib/env.ts`). Já presente no `.env.example`. Ação: mudar para `.default('http://localhost:3000')` OU usar `process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'` inline no componente de share link (que é `'use client'` e tem acesso direto a `process.env.NEXT_PUBLIC_*`). [VERIFIED: leitura direta de src/lib/env.ts]

### Q5: O grupo `/(app)` tem layout.tsx?

Não. Verificado: `find src/app -name layout.tsx` retornou apenas `src/app/layout.tsx`. Não há layout centralizado em `/(app)`. Cada page.tsx deve chamar seu guard manualmente. [VERIFIED: resultado do bash find]

### Q6: API routes existentes para task interaction

Não existem routes para tasks no contexto do filho. Existem: `/api/families/tasks` e `/api/families/tasks/[id]` (para o guardião criar/gerir). Para a fase 11, deve-se criar: `POST /api/child/[childId]/tasks/[taskId]/complete` e `DELETE` (ou POST com action=uncomplete). O padrão de auth é idêntico ao `/api/child/[childId]/goals/[goalId]/allocate`. [VERIFIED: leitura de src/app/api e CONTEXT.md]

### Q7: Comandos de migration Drizzle

Confirmados em `package.json scripts`:
- `pnpm db:generate` — gera arquivos SQL em `./drizzle/`
- `pnpm db:migrate` — aplica migrations ao PostgreSQL
- Configuração: `drizzle.config.ts` aponta schema em `./src/lib/db/schema/index.ts`, saída em `./drizzle/`

[VERIFIED: leitura direta de package.json e drizzle.config.ts]

---

## State of the Art

| Abordagem antiga | Abordagem atual | Quando mudou | Impacto |
|-----------------|-----------------|--------------|---------|
| `/(app)/child/[childId]/balance` sem child session | Nova `/child/[childId]/balance` com `requireChildSession` | Esta fase | Rotas do filho agora realmente isoladas |
| Guardião acessa diretamente rotas `/child/*` | `/guardian/[childId]/balance` usando NextAuth | Esta fase | Segregação de papéis completa |
| Sem middleware | `src/middleware.ts` com dupla proteção | Esta fase | Primeira linha de defesa em nível de routing |
| Child home em `/child/home` (sem childId) | Redirect para `/child/[childId]/dashboard` | Esta fase | URL canônica com childId para todas as páginas do filho |

---

## Assumptions Log

| # | Claim | Seção | Risco se errado |
|---|-------|-------|-----------------|
| A1 | `NEXT_PUBLIC_APP_URL` deve mudar de `.optional()` para `.default(...)` | Key Technical Answers Q4 | Nenhum risco crítico — fallback inline no componente também funciona |
| A2 | Verificar presença do cookie NextAuth no middleware (não o JWT completo) é suficiente para a primeira camada de defesa | Architecture Patterns Pattern 1 | Se suficiente: baixo risco (Server Component verifica completo). Se insuficiente: adicionar verificação JWT completa no middleware também |
| A3 | Family timezone é `America/Sao_Paulo` como fallback razoável para cycle | Code Examples | Se família tiver timezone diferente, cycleStart pode divergir — baixo risco pois todas as famílias no projeto são BR |

---

## Open Questions

1. **Redirect do `/child/*` sem familyId conhecido**
   - O que sabemos: Se o token child-session é inválido/ausente, o middleware não sabe para qual `familyId` redirecionar.
   - O que está incerto: D-03 diz "redirecionar para `/family/access/[familyId]`" mas o middleware não tem o familyId sem decodificar o token.
   - Recomendação: Se token ausente → redirecionar para `/` (home). Se token presente mas inválido → tentar decodificar sem verificar assinatura para extrair `familyId`, então redirecionar para `/family/access/[familyId]`. Alternativa simples: sempre redirecionar para `/` e deixar o usuário escolher a família.

2. **Rota `/child/home` existente — redirect para qual childId?**
   - O que sabemos: `/child/home` chama `requireChildSession()` e usa `session.childProfileId`.
   - O que está incerto: O redirect para `/child/[childId]/dashboard` precisa ser feito de dentro do próprio `page.tsx` ou o middleware pode fazer isso?
   - Recomendação: No `page.tsx` do `/child/home`, substituir o conteúdo por `redirect(\`/child/${session.childProfileId}/dashboard\`)`.

---

## Environment Availability

| Dependência | Requerida por | Disponível | Versão | Fallback |
|-------------|---------------|-----------|--------|---------|
| PostgreSQL | Migrations drizzle | Assumido (cluster k3s) | — | — |
| Node.js / pnpm | db:generate, db:migrate | Assumido | — | — |

Nenhuma dependência nova requerida. Todas as ferramentas já verificadas em fases anteriores.

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.ts` (raiz) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| ID | Comportamento | Tipo de Teste | Comando automatizado | Arquivo Existe? |
|----|---------------|---------------|---------------------|-----------------|
| D-03 | Middleware redireciona `/child/*` sem cookie | unit | `pnpm test tests/unit/middleware.test.ts` | ❌ Wave 0 |
| D-03 | Middleware redireciona `/family/*` sem NextAuth cookie | unit | `pnpm test tests/unit/middleware.test.ts` | ❌ Wave 0 |
| D-03 | Middleware permite rotas públicas sem cookie | unit | `pnpm test tests/unit/middleware.test.ts` | ❌ Wave 0 |
| D-07 | cycleStart calculado corretamente como 'YYYY-MM-DD' | unit | `pnpm test tests/unit/cycle-start.test.ts` | ❌ Wave 0 |
| D-07 | uniqueIndex previne duplicate completions | integration | `pnpm test tests/integration/task-completions.test.ts` | ❌ Wave 0 |
| D-12 | `/(app)/child/*` sem child session → redirect | unit | mocked em middleware.test.ts | ❌ Wave 0 |

### Sampling Rate

- **Por commit de task:** `pnpm test tests/unit/middleware.test.ts -run`
- **Por merge de wave:** `pnpm test`
- **Phase gate:** Full suite verde antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/middleware.test.ts` — cobre D-03 (matcher, redirect rules, cookie names)
- [ ] `tests/unit/cycle-start.test.ts` — cobre formato de string do cycleStart

---

## Security Domain

### ASVS Categorias Aplicáveis (Level 1)

| Categoria ASVS | Aplica | Controle padrão |
|----------------|--------|-----------------|
| V2 Authentication | sim | `requireChildSession` + `requireAuthenticatedIdentity` |
| V3 Session Management | sim | Cookie httpOnly + sameSite=lax + secure em prod (já implementado em `child-session.ts`) |
| V4 Access Control | sim | Verificação dupla: middleware + Server Component |
| V5 Input Validation | sim | `zod` para body das API Routes; taskId/childId validados contra child session |
| V6 Cryptography | sim | `jose` HS256 — não hand-rolled |

### Padrões de Ameaça

| Padrão | STRIDE | Mitigação padrão |
|--------|--------|-----------------|
| Child acessa saldo de outro filho | Spoofing | `session.childProfileId !== childId` check em cada page |
| Guardião acessa rota child via URL direta | Tampering | Middleware redireciona + requireChildSession lança se ausente |
| Cookie child-session manipulado | Tampering | JWT assinado com HS256; `jwtVerify` rejeita tokens adulterados |
| Child child_profile_id extraído do token para fazer chamadas cross-child | Elevation | API Routes verificam `session.childProfileId === params.childId` |

---

## Sources

### Primary (HIGH confidence)
- Leitura direta de `src/lib/families/child-session.ts` — cookie name, JWT fields, TTL, algoritmo
- Leitura direta de `src/lib/db/schema/index.ts` — padrão uniqueIndex, check constraints, table structure
- Leitura direta de `src/lib/auth/child-guard.ts` — `requireChildSession` API
- Leitura direta de `src/lib/env.ts` — NEXT_PUBLIC_APP_URL já presente como opcional
- Leitura direta de `package.json` + `drizzle.config.ts` — comandos de migration
- Context7 `/vercel/next.js` — middleware JWT pattern, `request.cookies.get()`

### Secondary (MEDIUM confidence)
- Verificação de comportamento do cookie NextAuth v5 (`authjs.session-token` vs `__Secure-authjs.session-token`) — baseado no padrão documentado do next-auth v5 beta [ASSUMED]

### Tertiary (LOW confidence)
- Nenhuma claim de confiança baixa nesta pesquisa

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — todos os pacotes verificados via `npm view` e slopcheck
- Architecture: HIGH — baseado em leitura direta do código existente
- Pitfalls: HIGH — todos identificados via análise do código-fonte real
- Middleware pattern: MEDIUM — verificação JWT direta no middleware é padrão documentado, mas o comportamento exato do cookie NextAuth v5 foi [ASSUMED]

**Research date:** 2026-06-09
**Valid until:** 2026-07-09 (30 dias — stack estável)
