# Phase 12: Módulo de FX — Research

**Researched:** 2026-06-22
**Domain:** Exchange rate analysis, Drizzle ORM numeric types, Next.js App Router (Server Components + Route Handlers), Guardian auth flow
**Confidence:** HIGH

---

## Summary

O módulo FX permite que o Guardian analise o impacto cambial de Purchase Orders em USD e EUR. A página `/family/fx` carrega POs do banco, busca a cotação atual do open.er-api.com via Route Handler proxy (sem CORS issues), e exibe a tabela com cálculos de BRL Amount, Current Value e Result. Quando o toggle de Simulação está ON, o usuário pode editar manualmente as taxas e as colunas calculadas ficam destacadas em ciano.

O projeto já tem todas as dependências necessárias: Drizzle ORM 0.45.2 (com suporte a `numeric`), Zod 4.4.3 (com `z.coerce.number()` e `z.string().date()`), Next.js 16.2.7 (App Router), next-auth v5 beta, e lucide-react 0.510.0. Nenhum novo pacote npm é necessário.

O único ponto crítico não mapeado no PATTERNS.md é a resolução do `familyId` do Guardian: `session.user.familyId` **não existe** no tipo atual da sessão (verificado em `src/types/next-auth.d.ts`). O familyId deve ser resolvido via query DB: `kreds_identities` (pelo `zitadelSubject` = `session.user.id`) → `family_memberships` (pelo `identityId`).

**Recomendação primária:** Criar um helper `resolveGuardianFamilyId(session)` em `src/lib/auth/guardian-family.ts` que encapsula a lookup DB e re-use em todos os Route Handlers e pages do módulo FX.

---

## Phase Requirements

| ID | Descrição | Suporte da Research |
|----|-----------|---------------------|
| FX-01 | Página `/family/fx` carrega lista de POs com todas as colunas | Schema `fx_purchase_orders` + SSR page + queries module |
| FX-02 | Campos USD e EUR preenchidos automaticamente via API de câmbio | Route Handler proxy para open.er-api.com; CONFIRMADO funcionando |
| FX-03 | Toggle Simulation Off/On — ON torna campos editáveis e destaca colunas | `useState` no Client Component; `bg-cyan-100` via Tailwind v4 |
| FX-04 | Cálculos corretos: BRL Amount, Current Value, Result, % | Módulo `src/modules/fx/calculations.ts` com funções puras; Drizzle retorna `numeric` como `string` → `parseFloat()` obrigatório |
| FX-05 | Result verde/vermelho; linha de totais no rodapé | Tailwind `text-green-600`/`text-red-600`; totais calculados no cliente |
| FX-06 | Novo item de menu na área Guardian leva ao módulo FX | Link simples em `/family/fx/page.tsx` ou header — não é BottomNav da criança |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch cotação de câmbio | API / Backend (Route Handler) | — | CORS impede fetch direto do browser; proxy server-side é o único caminho |
| Autenticação do Guardian | Frontend Server (SSR page) | API / Backend (Route Handler) | `auth()` chamado em SSR page e em cada Route Handler — middleware só verifica presença do cookie |
| Listagem de POs | API / Backend | Database | GET /api/fx/purchase-orders com filtros; DB via Drizzle |
| Cálculos cambiais | Browser / Client | — | Funções puras chamadas no Client Component com dados já carregados |
| Toggle de simulação | Browser / Client | — | Estado local `useState` — sem persistência |
| Destaque visual ciano | Browser / Client | — | `bg-cyan-100` condicional no Client Component |
| Resolução familyId do Guardian | API / Backend | Database | Lookup `identities` + `family_memberships` — nunca aceitar familyId do cliente |

---

## Standard Stack

### Core (sem instalação — já no projeto)

| Biblioteca | Versão | Propósito | Por que Standard |
|------------|--------|-----------|-----------------|
| drizzle-orm | 0.45.2 | Schema FX + queries | Padrão do projeto; suporta `numeric(18,6)` [VERIFIED: drizzle-orm/pg-core node_modules] |
| next | 16.2.7 | App Router, Route Handlers, SSR | Framework do projeto [VERIFIED: npm registry] |
| next-auth | 5.0.0-beta.31 | auth() para Guardian | Já implementado em todas as páginas /family/* |
| zod | 4.4.3 | Validação POST body | Padrão do projeto; `z.coerce.number()` e `z.string().date()` funcionam [VERIFIED: testado em runtime] |
| lucide-react | 0.510.0 | Ícones (Filter, TrendingUp, TrendingDown, RefreshCw, AlertTriangle) | Já no projeto; todos os ícones FX-relevantes disponíveis [VERIFIED: node_modules] |
| server-only | 0.0.1 | Marcar queries.ts como server-only | Padrão do projeto (ver child-guard.ts) |

### API Externa

| Endpoint | Propósito | Status |
|----------|-----------|--------|
| `https://open.er-api.com/v6/latest/USD` | Taxa USD → BRL | CONFIRMADO funcionando; retornou `5.155925` BRL [VERIFIED: testado via curl] |
| `https://open.er-api.com/v6/latest/EUR` | Taxa EUR → BRL | CONFIRMADO funcionando; retornou `5.911966` BRL [VERIFIED: testado via curl] |

**Sem API key necessária.** Resposta inclui `result: "success"`, `rates.BRL`, `time_last_update_utc`.

**Instalação:** Nenhum pacote novo. Todos já estão em `package.json`.

---

## Package Legitimacy Audit

> Nenhum pacote novo sendo instalado nesta fase. Todas as dependências já estão no `package.json` do projeto e foram instaladas em fases anteriores.

| Pacote | Registry | Uso nesta fase | Verdict |
|--------|----------|----------------|---------|
| drizzle-orm | npm | Schema + queries | OK — pacote existente do projeto |
| next-auth | npm | auth() Guardian | OK — pacote existente do projeto |
| zod | npm | Validação POST | OK — pacote existente do projeto |
| lucide-react | npm | Ícones UI | OK — pacote existente do projeto |

**Pacotes removidos por SLOP:** nenhum
**Pacotes suspeitos (SUS):** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Guardian)
       │
       │ GET /family/fx
       ▼
┌──────────────────────────────────┐
│  SSR Page: /family/fx/page.tsx   │
│  - auth() → session              │
│  - resolveGuardianFamilyId()     │  ← NEW helper (lookup DB)
│  - db.select(fxPurchaseOrders)   │
│  - render <FxAnalysisClient />   │
└──────────────────────────────────┘
       │ props: purchaseOrders[]
       ▼
┌──────────────────────────────────┐
│  Client: FxAnalysisClient.tsx    │
│  - useEffect → GET /api/fx/rates │──────────────────┐
│  - useState: usdRate, eurRate    │                  │
│  - useState: isSimulation        │                  │
│  - calculate: getBrlAmount()     │                  │
│              getCurrentValue()   │                  │
│              getResult()         │                  │
│              getResultPct()      │                  │
│  - render: filter bar            │                  │
│            rate row + toggle     │                  │
│            PO table              │                  │
│            summary row           │                  │
└──────────────────────────────────┘                  │
                                                       ▼
                                          ┌─────────────────────────┐
                                          │  Route Handler:         │
                                          │  GET /api/fx/rates      │
                                          │  - auth() → session     │
                                          │  - fetch open.er-api.com│
                                          │    (Promise.all)        │
                                          │  - return {usd_brl,     │
                                          │    eur_brl, fetched_at} │
                                          └─────────────────────────┘

Guardian POST novo PO:
Browser → POST /api/fx/purchase-orders
       → auth() + resolveGuardianFamilyId()
       → zod.safeParse(body)
       → db.insert(fxPurchaseOrders)
       → return 201 + row
```

### Estrutura de Arquivos Recomendada

```
src/
├── lib/
│   ├── db/
│   │   └── schema/
│   │       ├── index.ts          (modificar — adicionar export * from './fx')
│   │       └── fx.ts             (NOVO — fxCurrencyEnum + fxPurchaseOrders table)
│   └── auth/
│       ├── child-guard.ts        (existente — não modificar)
│       └── guardian-family.ts    (NOVO — helper resolveGuardianFamilyId)
├── modules/
│   └── fx/
│       ├── calculations.ts       (NOVO — funções puras: getBrlAmount, getCurrentValue, etc.)
│       ├── queries.ts            (NOVO — getPurchaseOrders com filtros opcionais)
│       └── schema.ts             (NOVO — Zod purchaseOrderSchema)
└── app/
    ├── api/
    │   └── fx/
    │       ├── rates/
    │       │   └── route.ts      (NOVO — proxy open.er-api.com)
    │       └── purchase-orders/
    │           └── route.ts      (NOVO — GET/POST)
    └── family/
        └── fx/
            ├── page.tsx          (NOVO — SSR page Guardian)
            └── FxAnalysisClient.tsx  (NOVO — Client Component com tabela)

tests/
└── unit/
    └── fx-calculations.test.ts   (NOVO — testa funções puras)
```

**Nota:** `src/modules/` não existe ainda no projeto. O diretório será criado ao criar `src/modules/fx/`. Os testes de ledger já referenciam `src/modules/ledger/` (que também não existe) — o padrão `modules/` é o destino planejado para lógica de negócio.

---

## Padrão Crítico: Resolução do familyId do Guardian

### Problema
`session.user.familyId` **não existe** na tipagem atual (`src/types/next-auth.d.ts`). O PATTERNS.md assumiu incorretamente que este campo estaria disponível.

### Solução Verificada
A sessão next-auth expõe `session.user.id` = `zitadelSubject`. Para obter o `familyId`, precisa de uma lookup DB:

```typescript
// src/lib/auth/guardian-family.ts
import 'server-only'
import { db } from '@/lib/db'
import { identities, familyMemberships } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Session } from 'next-auth'

export async function resolveGuardianFamilyId(session: Session): Promise<string> {
  const zitadelSubject = session.user.id
  if (!zitadelSubject) throw new Error('session.user.id ausente')

  // 1. Buscar identityId pelo zitadelSubject
  const [identity] = await db
    .select({ id: identities.id })
    .from(identities)
    .where(eq(identities.zitadelSubject, zitadelSubject))
    .limit(1)

  if (!identity) throw new Error(`Identity não encontrada para zitadelSubject: ${zitadelSubject}`)

  // 2. Buscar familyId pelo identityId (role = guardian)
  const [membership] = await db
    .select({ familyId: familyMemberships.familyId })
    .from(familyMemberships)
    .where(
      and(
        eq(familyMemberships.identityId, identity.id),
        eq(familyMemberships.role, 'guardian'),
      )
    )
    .limit(1)

  if (!membership) throw new Error(`Membership guardian não encontrada para identityId: ${identity.id}`)

  return membership.familyId
}
```

**Onde usar:**
- `src/app/family/fx/page.tsx` — após `auth()`, chamar `resolveGuardianFamilyId(session)` para obter `familyId`
- `src/app/api/fx/rates/route.ts` — não precisa de familyId (apenas autenticação)
- `src/app/api/fx/purchase-orders/route.ts` — chamar `resolveGuardianFamilyId(session)` no GET e POST

**Alternativa mais simples (se aceitável):** Passar `familyId` como query param de URL, derivado do SSR page. Mas isso viola T-04-04 (familyId nunca do cliente). Manter lookup DB.

---

## Schema Drizzle: fx_purchase_orders

```typescript
// src/lib/db/schema/fx.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  numeric,
} from 'drizzle-orm/pg-core'
import { families } from './index'

// ATENÇÃO: numeric() retorna string no TypeScript (dataType: 'string')
// Sempre usar parseFloat() antes de calcular. Ver src/modules/fx/calculations.ts

export const fxCurrencyEnum = pgEnum('fx_currency', ['USD', 'EUR'])

export const fxPurchaseOrders = pgTable(
  'fx_purchase_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    poNumber: text('po_number').notNull(),
    company: text('company').notNull(),
    vendor: text('vendor').notNull(),
    currency: fxCurrencyEnum('currency').notNull(),
    // Drizzle retorna numeric como string — documentado aqui
    foreignAmount: numeric('foreign_amount', { precision: 18, scale: 2 }).notNull(),
    diRate: numeric('di_rate', { precision: 18, scale: 6 }).notNull(),
    dueDate: text('due_date').notNull(), // formato ISO 'YYYY-MM-DD'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('fx_purchase_orders_family_id_idx').on(table.familyId),
  }),
)
```

**Por que `dueDate: text` em vez de `date`?**
O Drizzle mapeia colunas `date` para `string` no PG, mas o comportamento com fuso horário pode ser surpreendente. Usar `text` no formato `'YYYY-MM-DD'` é mais previsível e alinha com o padrão já adotado em `taskCompletions.cycleStart` (linha 244 de `schema/index.ts`).

**Não há tabelas Company/Vendor separadas** — confirmado após revisar todo o schema. `company` e `vendor` são campos `text` livres na tabela `fx_purchase_orders`. Os dropdowns de filtro são populados com valores distintos via query (`SELECT DISTINCT`).

---

## Módulo de Cálculos FX

```typescript
// src/modules/fx/calculations.ts
// Sem imports de DB — funções puras, zero side effects

/** Drizzle retorna numeric() como string. Centralizar conversão aqui. */
export function toNumber(val: string | number): number {
  if (typeof val === 'string') return parseFloat(val)
  return val
}

/** BRL Amount = Foreign Amount × DI Rate */
export function getBrlAmount(foreignAmount: string | number, diRate: string | number): number {
  return toNumber(foreignAmount) * toNumber(diRate)
}

/** Current Value (BRL) = Foreign Amount × Current Tax */
export function getCurrentValue(foreignAmount: string | number, currentRate: number): number {
  return toNumber(foreignAmount) * currentRate
}

/** Result = BRL Amount − Current Value (positivo = favorável pagar agora) */
export function getResult(brlAmount: number, currentValue: number): number {
  return brlAmount - currentValue
}

/** (%) = Result / BRL Amount × 100 */
export function getResultPct(result: number, brlAmount: number): number {
  if (brlAmount === 0) return 0
  return (result / brlAmount) * 100
}

/** Calcular totais da linha de rodapé */
export function calculateTotals(rows: Array<{
  brlAmount: number
  currentValue: number
  result: number
}>) {
  const totalBrl = rows.reduce((sum, r) => sum + r.brlAmount, 0)
  const totalCurrent = rows.reduce((sum, r) => sum + r.currentValue, 0)
  const totalResult = rows.reduce((sum, r) => sum + r.result, 0)
  const totalPct = totalBrl === 0 ? 0 : (totalResult / totalBrl) * 100
  return { totalBrl, totalCurrent, totalResult, totalPct }
}
```

---

## Route Handler: /api/fx/rates

```typescript
// src/app/api/fx/rates/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// SSRF guard: URL nunca aceita do cliente — hardcoded aqui
const ER_API_BASE = 'https://open.er-api.com/v6/latest'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch(`${ER_API_BASE}/USD`, { next: { revalidate: 3600 } }),
      fetch(`${ER_API_BASE}/EUR`, { next: { revalidate: 3600 } }),
    ])

    if (!usdRes.ok || !eurRes.ok) {
      return NextResponse.json({ error: 'Falha ao buscar cotações' }, { status: 502 })
    }

    const [usdData, eurData] = await Promise.all([usdRes.json(), eurRes.json()])

    return NextResponse.json({
      usd_brl: usdData.rates['BRL'] as number,
      eur_brl: eurData.rates['BRL'] as number,
      fetched_at: new Date().toISOString(),
      source: 'open.er-api.com',
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno ao buscar cotações' }, { status: 500 })
  }
}
```

**Cache:** `{ next: { revalidate: 3600 } }` — Next.js 16 usa extended fetch options para cache. A cotação é atualizada a cada hora, o que é suficiente para análise de PO.

---

## Validação Zod (Fase 12)

```typescript
// src/modules/fx/schema.ts
import { z } from 'zod'

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, 'PO Number obrigatório').max(50),
  company: z.string().min(1, 'Empresa obrigatória').max(100),
  vendor: z.string().min(1, 'Fornecedor obrigatório').max(100),
  currency: z.enum(['USD', 'EUR'], { message: 'Moeda deve ser USD ou EUR' }),
  foreignAmount: z.coerce.number().positive('Valor deve ser positivo'),
  diRate: z.coerce.number().positive('Taxa DI deve ser positiva'),
  dueDate: z.string().date('Data de vencimento inválida'), // z.string().date() = 'YYYY-MM-DD' only
})

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>
```

**Zod v4 nota:** `z.string().datetime()` requer ISO 8601 completo com timezone. Para datas no formato `YYYY-MM-DD`, usar `z.string().date()` (disponível no Zod 4) — CONFIRMADO funcionando [VERIFIED: testado em runtime].

---

## Client Component: FxAnalysisClient

```typescript
// src/app/family/fx/FxAnalysisClient.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { getBrlAmount, getCurrentValue, getResult, getResultPct, calculateTotals } from '@/modules/fx/calculations'
import type { fxPurchaseOrders } from '@/lib/db/schema/fx'
import type { InferSelectModel } from 'drizzle-orm'

type PurchaseOrder = InferSelectModel<typeof fxPurchaseOrders>

interface Props {
  purchaseOrders: PurchaseOrder[]
}

export function FxAnalysisClient({ purchaseOrders }: Props) {
  const [isSimulation, setIsSimulation] = useState(false)
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [eurRate, setEurRate] = useState<number | null>(null)
  const [simUsd, setSimUsd] = useState<string>('')
  const [simEur, setSimEur] = useState<string>('')
  const [rateError, setRateError] = useState(false)

  useEffect(() => {
    fetch('/api/fx/rates')
      .then((r) => r.json())
      .then((data: { usd_brl: number; eur_brl: number }) => {
        setUsdRate(data.usd_brl)
        setEurRate(data.eur_brl)
        setSimUsd(data.usd_brl.toFixed(6))
        setSimEur(data.eur_brl.toFixed(6))
      })
      .catch(() => setRateError(true))
  }, [])

  // Taxa efetiva: simulada (quando ON e editada) ou real (API)
  const effectiveUsd = isSimulation ? parseFloat(simUsd) || 0 : (usdRate ?? 0)
  const effectiveEur = isSimulation ? parseFloat(simEur) || 0 : (eurRate ?? 0)

  // Classe de destaque para colunas simuladas
  const simCellClass = isSimulation ? 'bg-cyan-100' : ''

  // ... (render da tabela)
}
```

---

## Don't Hand-Roll

| Problema | Não Construir | Usar Em Vez | Por Quê |
|----------|---------------|-------------|---------|
| Fetch de cotação com CORS | Fetch direto no browser | Route Handler proxy `/api/fx/rates` | open.er-api.com bloqueia CORS; Investing.com e Yahoo Finance também bloqueiam |
| Conversão de numeric string | `Number(val)` ou `parseInt` | `parseFloat(val)` centralizado em `toNumber()` | `Number('')` = 0 (silencioso), `parseInt('5.20')` = 5 (perde decimais); `parseFloat` é o correto |
| Cache da cotação | setInterval no cliente | `next: { revalidate: 3600 }` no fetch do Route Handler | Server-side cache via Next.js; evita múltiplos fetches paralelos de diferentes usuários |
| familyId no body da request | Aceitar `familyId` do cliente | `resolveGuardianFamilyId(session)` | Padrão T-04-04 — familyId NUNCA do cliente (IDOR vulnerability) |
| Paginação de POs | Implementação própria | Todos de uma vez (sem paginação) | Volume esperado é pequeno (< 100 POs por família); paginação é over-engineering aqui |

---

## Common Pitfalls

### Pitfall 1: Drizzle `numeric` retorna string
**O que dá errado:** `fxPurchaseOrders.foreignAmount` é digitado como `string` no TypeScript (dataType: `'string'`). Ao multiplicar diretamente: `foreignAmount * diRate` → `NaN` ou concatenação de string.

**Por que acontece:** `numeric(precision, scale)` no PostgreSQL retorna sua representação de precisão arbitrária como string para evitar perda de precisão em floats JavaScript.

**Como evitar:** Centralizar em `toNumber()` em `calculations.ts`. Nunca fazer aritmética direto com campos do Drizzle `numeric`. [VERIFIED: drizzle-orm/pg-core numeric.d.ts confirmado com `dataType: 'string'`]

**Sinais de alerta:** `NaN` ou strings concatenadas nos cálculos de BRL Amount.

### Pitfall 2: `session.user.familyId` não existe
**O que dá errado:** O PATTERNS.md assumiu `session.user.familyId!`. A tipagem atual (`src/types/next-auth.d.ts`) só tem `systemRoles` além dos campos padrão do next-auth.

**Por que acontece:** O token JWT next-auth não persiste o familyId. Seria necessário modificar o callback `jwt()` e `session()` em `auth.ts` para adicionar este campo — o que afeta todo o sistema de auth.

**Como evitar:** Usar `resolveGuardianFamilyId(session)` — lookup DB `kreds_identities` → `family_memberships`. Alternativa: adicionar `familyId` ao token no `auth.ts` se o planner preferir (decisão de design — mais simples, mas altera auth global). [VERIFIED: verificado em src/types/next-auth.d.ts]

**Sinais de alerta:** TypeScript error `Property 'familyId' does not exist on type 'User'`.

### Pitfall 3: `z.string().datetime()` vs `z.string().date()`
**O que dá errado:** Usar `z.string().datetime()` para validar due_date `'2026-06-28'` → falha na validação (requer `'2026-06-28T00:00:00.000Z'`).

**Por que acontece:** Zod v4 `.datetime()` exige ISO 8601 completo. `.date()` aceita apenas `YYYY-MM-DD`.

**Como evitar:** Usar `z.string().date()` no `purchaseOrderSchema`. [VERIFIED: testado em runtime]

### Pitfall 4: Tailwind v4 e classes `bg-cyan-*`
**O que dá errado:** Assumir que cyan não está disponível porque não há `--color-kreds-water` para cyan na paleta de design tokens.

**Por que acontece:** O design system Kreds usa CSS vars customizados para cores da marca, mas o Tailwind v4 inclui a paleta completa de cores utilitárias (cyan, green, red, etc.) via `@import "tailwindcss"`.

**Como evitar:** Usar `bg-cyan-100` diretamente para highlight de simulação — sem criar token customizado. Verde para result positivo = `text-green-700` ou inline style com `color: 'var(--color-kreds-primary)'`. Vermelho para negativo = `text-red-600` ou `style={{ color: 'var(--color-kreds-error)' }}`.

### Pitfall 5: Não modificar BottomNav da criança
**O que dá errado:** Adicionar item FX ao `src/components/tasks/bottom-nav.tsx` (nav da criança).

**Por que acontece:** PATTERNS.md listou bottom-nav.tsx como arquivo a modificar, mas depois na seção "ATENÇÃO" corrigiu isso.

**Como evitar:** O BottomNav é específico de `/child/*`. O módulo FX fica em `/family/fx/` — área do Guardian. A navegação FX é um link no SSR page ou um header inline. Não há sidebar no projeto ainda (FX é o primeiro módulo Guardian com navegação própria).

### Pitfall 6: CORS ao chamar open.er-api.com diretamente
**O que dá errado:** Chamar `open.er-api.com` diretamente do `useEffect` no browser.

**Por que acontece:** CORS policy do open.er-api.com bloqueia requests de domínios externos sem o header `Access-Control-Allow-Origin`.

**Como evitar:** Sempre chamar `/api/fx/rates` (Route Handler proxy no mesmo domínio). [VERIFIED: arquitetura de proxy confirmada]

---

## State of the Art

| Abordagem Antiga | Abordagem Atual | Versão | Impacto |
|------------------|-----------------|--------|---------|
| `fetch` com `cache: 'force-cache'` | `next: { revalidate: N }` | Next.js 13+ | Cache granular por rota; 3600s = 1h de cache |
| `z.string().datetime()` para datas | `z.string().date()` (Zod v4) | Zod 4.x | Aceita formato `YYYY-MM-DD` corretamente |
| `parseInt(numeric)` | `parseFloat(numeric)` | — | Preserva casas decimais da taxa DI |

**Deprecated/desatualizado:**
- `drizzle-kit push` para ambientes de produção: usar `drizzle-kit generate` + `drizzle-kit migrate`. O `push` é adequado para desenvolvimento (sem arquivos SQL gerados). O projeto tem ambos os scripts; para esta fase, usar `db:generate` para criar o arquivo SQL e `db:migrate` para aplicar.

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` (raiz do projeto) |
| Quick run command | `pnpm test -- fx-calculations` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo de Teste | Comando | Arquivo Existe? |
|--------|--------------|---------------|---------|-----------------|
| FX-04 | `toNumber('5.2')` → `5.2` | unit | `pnpm test -- fx-calculations` | ❌ Wave 0 |
| FX-04 | `getBrlAmount('120000', '5.2')` → `624000` | unit | `pnpm test -- fx-calculations` | ❌ Wave 0 |
| FX-04 | `getCurrentValue('120000', 5.1559)` → `618708` | unit | `pnpm test -- fx-calculations` | ❌ Wave 0 |
| FX-04 | `getResult(624000, 618708)` → `5292` (positivo) | unit | `pnpm test -- fx-calculations` | ❌ Wave 0 |
| FX-04 | `getResultPct(5292, 624000)` → `~0.848%` | unit | `pnpm test -- fx-calculations` | ❌ Wave 0 |
| FX-04 | `getResult` negativo quando currentValue > brlAmount | unit | `pnpm test -- fx-calculations` | ❌ Wave 0 |
| FX-01 | Schema `fxPurchaseOrders` tem campos obrigatórios | schema/migration | manual (drizzle-kit generate verifica) | ❌ Wave 0 |
| FX-02 | GET /api/fx/rates retorna usd_brl e eur_brl | manual | curl em dev | — |
| FX-03 | Toggle Simulation altera estado visual | manual visual | checkpoint visual | — |

### Sampling Rate
- **Por commit de task:** `pnpm test -- fx-calculations`
- **Por wave merge:** `pnpm test`
- **Phase gate:** Suite completa verde antes do `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/fx-calculations.test.ts` — cobre FX-04 (todas as funções puras)
- [ ] `src/modules/fx/calculations.ts` — implementação das funções testadas

*(Infraestrutura de teste existente cobre tudo — apenas os arquivos específicos de FX precisam ser criados)*

---

## Security Domain

### ASVS Categories Aplicáveis

| Categoria ASVS | Aplica | Controle Standard |
|----------------|--------|-------------------|
| V2 Authentication | sim | `auth()` next-auth em TODOS os Route Handlers e SSR pages |
| V3 Session Management | sim | JWT next-auth, expiração controlada pelo provider |
| V4 Access Control | sim | `resolveGuardianFamilyId()` garante que Guardian só acessa suas próprias POs |
| V5 Input Validation | sim | Zod `purchaseOrderSchema` — sempre antes do insert |
| V6 Cryptography | não | Sem criptografia customizada nesta fase |

### Padrões de Ameaça Conhecidos

| Padrão | STRIDE | Mitigação Standard |
|--------|--------|-------------------|
| IDOR (familyId manipulado pelo cliente) | Spoofing | Nunca aceitar familyId do body/query — derivar de `resolveGuardianFamilyId(session)` |
| SSRF (URL de API customizada) | Tampering | URL `open.er-api.com` hardcoded no Route Handler — nunca aceitar do cliente |
| Injeção via campos livres (company, vendor) | Tampering | Zod `z.string().max(100)` + queries Drizzle parametrizadas (sem SQL raw) |
| Acesso cruzado entre famílias | Elevation of Privilege | WHERE clause sempre inclui `familyId` derivado da sessão |

---

## Environment Availability

| Dependência | Requerida Por | Disponível | Versão | Fallback |
|-------------|--------------|-----------|--------|----------|
| PostgreSQL | DB schema + queries | ✓ | 16.x (via DATABASE_URL) | — |
| open.er-api.com | FX-02 cotação automática | ✓ | API pública | Exibir "—" na UI + mensagem de erro |
| Node.js | Next.js runtime | ✓ | v22.x (TypeScript target ES2022) | — |
| pnpm | Package manager | ✓ | 10.34.1 | — |

**Dependências faltando sem fallback:** nenhuma
**Dependências faltando com fallback:** API open.er-api.com (pode ficar offline; exibir estado de erro na UI sem quebrar a página)

---

## Open Questions

1. **Adição de `familyId` ao JWT do next-auth vs. lookup DB**
   - O que sabemos: lookup DB em `resolveGuardianFamilyId()` funciona mas adiciona 2 queries por request autenticado
   - O que está incerto: o planner pode preferir modificar `auth.ts` para persistir `familyId` no token (mais simples, mas altera auth global)
   - Recomendação: usar lookup DB para não alterar o sistema de auth existente; pode ser otimizado depois com cache

2. **Navegação Guardian (FX-06)**
   - O que sabemos: não há sidebar ou topbar para `/family/*` — FX é o primeiro módulo Guardian com navegação própria
   - O que está incerto: o planner precisa decidir entre (a) link simples no header da page `/family/fx`, (b) criar um layout `/family/layout.tsx` com sidebar mínima
   - Recomendação: link simples no header da FX page para esta fase; sidebar pode vir em fase futura

3. **Filtros de Company/Vendor — distinct query vs. hardcode**
   - O que sabemos: não há tabelas Company/Vendor separadas; os valores são `text` livre na tabela `fx_purchase_orders`
   - O que está incerto: os dropdowns de filtro precisam de `SELECT DISTINCT company` e `SELECT DISTINCT vendor` ou são populados com os dados já carregados do SSR?
   - Recomendação: popular os dropdowns a partir dos dados já carregados no SSR (prop `purchaseOrders`) — sem query adicional; `[...new Set(purchaseOrders.map(p => p.company))]`

---

## Assumptions Log

| # | Claim | Seção | Risco se Errado |
|---|-------|-------|-----------------|
| A1 | open.er-api.com mantém os campos `rates.BRL` na resposta sem mudança de schema | Standard Stack / Route Handler | Campo BRL mudaria de nome → cotação não carregaria |
| A2 | Todos os guardians têm exatamente um membership ativo com role='guardian' por família | resolveGuardianFamilyId | Guardian com múltiplas famílias usaria a primeira encontrada (`.limit(1)`) |
| A3 | Volume de POs < 100 por família (justificando ausência de paginação) | Don't Hand-Roll | Tabela fica lenta com volumes altos |

**A1 é LOW RISK** — resposta testada e confirmada em 2026-06-22. **A2 é ASSUMED** — schema `familyMemberships` suporta múltiplas famílias mas o modelo de negócio atual tem 1 família por guardian.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/drizzle-orm/pg-core` — types confirmados via `numeric.d.ts` [VERIFIED]
- `src/types/next-auth.d.ts` — tipagem da sessão confirmada [VERIFIED: lido nesta sessão]
- `src/lib/db/schema/index.ts` — schema completo verificado [VERIFIED: lido nesta sessão]
- `open.er-api.com` API — testado via `curl` em 2026-06-22, retornou `success` com `rates.BRL` [VERIFIED]
- Zod 4.4.3 runtime — `z.coerce.number()`, `z.string().date()`, `z.enum()` testados [VERIFIED]

### Secondary (MEDIUM confidence)
- `src/app/family/access/[familyId]/page.tsx` — padrão de SSR page com `auth()` [VERIFIED: lido]
- `src/middleware.ts` — padrão de proteção `/family/*` confirmado [VERIFIED: lido]
- `tests/unit/family-authorization.test.ts` — padrão de resolução identityId → familyId [VERIFIED: lido]

### Tertiary (LOW confidence)
- Análise de volume de POs por família (< 100) — baseada em inferência do domínio do negócio [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todas as dependências verificadas em node_modules e testadas em runtime
- Architecture: HIGH — padrões derivados de código existente do projeto
- Pitfalls: HIGH — falhas detectadas via inspeção de types + testes em runtime
- familyId resolution: HIGH — tipagem next-auth.d.ts confirmada; lookup DB verificada em testes existentes

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (open.er-api.com response schema pode mudar; verificar se `rates.BRL` ainda existe)
