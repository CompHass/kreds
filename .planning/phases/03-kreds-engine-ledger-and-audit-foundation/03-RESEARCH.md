# Phase 3: Kreds Engine Ledger and Audit Foundation - Research

**Researched:** 2026-06-07
**Domain:** Append-only financial ledger, integer arithmetic, idempotency, audit views (Drizzle ORM + PostgreSQL + Next.js 16 App Router)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Rounding policy: Math.ceil para todas as operações de 10%. 10% de 7 Kreds = 1 firstfruits (0.7 → 1). Mesma regra para 10% de matching de doação voluntária. Uma política, documentada em constante de código e testada com edge cases.

**D-02:** Rationale: ceiling honra o princípio dos firstfruits mesmo em valores pequenos.

**D-03:** Available balance calculado on-the-fly via SUM das ledger lines para `child_id` + `account_type`. Nenhuma coluna de saldo mantida. Preserva semântica append-only pura; sem risco de drift. Aceitável para volumes v1.

**D-04:** Firstfruits Treasury não é tabela separada. Representada como ledger lines com `account_type: firstfruits`. Treasury balance = SUM de todas as linhas firstfruits para aquele child. Um ledger, múltiplos account types.

**D-05:** Um comando aprovado gera uma transação header + 2+ linhas. Para task approval de +10 Kreds: transaction header (type: `task_earning`, command_id: UUID) + linha 1 (+9 available) + linha 2 (+1 firstfruits).

**D-06:** Idempotência (LEDG-06) via UNIQUE constraint em `command_id` na tabela de transações. Cada ação geradora carrega UUID command_id. Retry seguro por design — command_id duplicado rejeitado a nível de DB.

**D-07:** Negative adjustments (LEDG-05) usam valor livre + texto de razão obrigatório. Sem presets nem limites de valor na Fase 3. Engine valida apenas que o valor de débito é inteiro positivo. Campo reason é obrigatório e armazenado como plain text.

**D-08:** Erros são corrigidos via reversal entries (contrapartida negativa à linha original) + novas entradas corretas se necessário. Linhas históricas nunca editadas ou deletadas. Entradas de correção carregam FK `corrects_transaction_id` e nota de correção do guardian.

**D-09:** Guardian vê full detail: tipo, todas as linhas (available + firstfruits), command_id, razões de ajuste, notas de correção, referências `corrects_transaction_id`.

**D-10:** Child vê versão simplificada: rótulos em linguagem amigável ("You earned 9 Kreds for [task]" / "1 Kreds went to your Firstfruits"). Entradas de correção aparecem como "Correction applied" sem expor razão interna ou detalhes do erro.

### Claude's Discretion

- Nomes exatos de colunas, tabelas, sintaxe Drizzle, e estrutura de rotas API são detalhes de implementação.
- Valores específicos de enum `account_type` (e.g., `available`, `firstfruits`) e `transaction_type` (e.g., `task_earning`, `negative_adjustment`, `reversal`) podem ser escolhidos pelo planner para alinhar com vocabulário de Fase 4/5.
- Design da UI da audit timeline (layout, ícones, cores) segue direção visual Sylvan Growth das referências de design da Fase 2.

### Deferred Ideas (OUT OF SCOPE)

- Configuração de valores de tarefas (quanto vale uma tarefa específica) — Fase 4.
- Valores de negative adjustment preset/configuráveis — Fase 4.
- Integração do engine de matching do Kreds do Bem (GOAL-06) — Fase 7.
- Alocação de Wishlist goal contra saldo de ledger — Fase 6.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEDG-01 | System records Kreds movements as append-only ledger transactions and lines | Schema: `ledger_transactions` (header) + `ledger_lines` (lines). INSERT only, no UPDATE/DELETE. |
| LEDG-02 | System stores Kreds amounts as integer units, not floating-point values | Drizzle `integer()` type; CHECK constraint `amount != 0`; `calculateFirstfruits()` returns integer via Math.ceil. |
| LEDG-03 | System applies single documented rounding policy for 10% firstfruits and 10% donation matching | `FIRSTFRUITS_RATE = 0.10`; `calculateFirstfruits(n) = Math.ceil(n * 0.10)` — função testada com edge cases. |
| LEDG-04 | System automatically withholds 10% of every positive earning into Firstfruits Treasury before available balance changes | `postEarning()` usa `db.transaction()` para inserir header + linha `available` + linha `firstfruits` atomicamente. |
| LEDG-05 | Parent can record a negative adjustment with a reason and optional restoration note | `postNegativeAdjustment(command)`: valida que amount > 0, reason não vazio; insere como linha `debit` no available account. |
| LEDG-06 | System prevents duplicate ledger postings for the same approved command | UNIQUE constraint em `command_id` na tabela `ledger_transactions`; duplicate lança erro PostgreSQL 23505 tratado na API. |
| LEDG-07 | Parent and child can view activity history explaining why each balance changed | API routes diferenciadas: `/api/ledger/[childId]/history` com query param `view=guardian|child`; queries filtradas por `family_id`. |
| LEDG-08 | System corrects ledger mistakes through reversal entries, not editing history | `postReversal(command)` insere entradas negativas com `corrects_transaction_id` FK; sem UPDATE nas linhas existentes. |
</phase_requirements>

---

## Summary

A Fase 3 constrói o coração financeiro do Kreds: um ledger append-only baseado em inteiros, onde cada movimento de Kreds é registrado como um par header + linhas dentro de uma única transação atômica de banco de dados. A principal característica arquitetural é que o saldo nunca é armazenado como valor persistido — ele é sempre calculado via `SUM()` do conjunto de linhas relevantes, eliminando qualquer risco de drift entre saldo e histórico.

O stack técnico para esta fase é idêntico ao já estabelecido: Drizzle ORM 0.45.2 com PostgreSQL, Next.js 16 App Router, TypeScript. Nenhum novo pacote precisa ser instalado — toda a infraestrutura necessária (transações Drizzle, enums pgEnum, constraints UNIQUE/CHECK, SUM aggregations) já está disponível e demonstrada no schema da Fase 2. A fase entrega dois novos módulos: `src/modules/ledger/` (engine de posting) e rotas de API para leitura de histórico, com views diferenciadas para guardian e child.

O risco principal é garantir que a lógica de arredondamento, a atomicidade das transações e o tratamento de erros de idempotência sejam cobertos por testes de unidade e integração desde o Wave 0. O padrão de teste com Testcontainers PostgreSQL já está estabelecido no projeto e deve ser replicado para os testes de integração do ledger.

**Primary recommendation:** Usar `db.transaction(async (tx) => {...})` do Drizzle para cada `postEarning()` — isso garante atomicidade entre header e linhas. Extrair `calculateFirstfruits()` como função pura testável antes de qualquer implementação de rota.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ledger posting (earn, adjust, reverse) | API / Backend (Route Handler) | — | Mutação financeira é server-authoritative; nunca no browser |
| Cálculo de saldo (SUM) | API / Backend | — | Query direta ao PostgreSQL via Drizzle; sem caching de saldo |
| Cálculo de firstfruits (Math.ceil) | API / Backend — módulo puro | — | Lógica de domínio testável; sem dependência de framework |
| Idempotência (UNIQUE command_id) | Database / Storage | API (tratamento do erro 23505) | Constraint no DB é a fonte de verdade; API interpreta o erro |
| Correção via reversals | API / Backend (Route Handler) | Database (FK corrects_transaction_id) | Validação de negócio na API; integridade referencial no DB |
| Guardian audit view | API / Backend | Frontend Server (SSR) | Query server-side com family_id scope obrigatório |
| Child audit view | API / Backend | Frontend Server (SSR) | View simplificada gerada na query, não no cliente |
| Autorização por family_id | API / Backend (middleware/helper) | — | Pattern estabelecido na Fase 2; ledger herda o mesmo helper |

---

## Standard Stack

### Core

Todos os pacotes abaixo já estão instalados no projeto. Nenhuma nova dependência é necessária para a Fase 3.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 | Schema, queries, transações atômicas | Já instalado; suporte nativo a `db.transaction()`, `pgEnum`, `uniqueIndex`, `check` [VERIFIED: npm registry] |
| `drizzle-kit` | 0.31.10 | Geração de migrations SQL | Já instalado; `pnpm db:generate` e `pnpm db:migrate` funcionando [VERIFIED: npm registry] |
| `pg` | 8.21.0 | Driver PostgreSQL para Node.js | Já instalado; padrão de conexão estabelecido em `src/lib/db/index.ts` [VERIFIED: npm registry] |
| `zod` | 4.4.3 | Validação de input do comando de posting | Já instalado; padrão de validação usado em rotas de Fase 2 [VERIFIED: npm registry] |
| `vitest` | 4.1.8 | Testes de unidade (lógica de rounding, engine) | Já instalado; `pnpm test` configurado [VERIFIED: npm registry] |
| `@testcontainers/postgresql` | 12.0.1 | Testes de integração com PostgreSQL real | Já instalado; padrão estabelecido em `tests/integration/` [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-auth` | 5.0.0-beta.31 | Autenticação de sessão para autorização de rotas | Nas rotas de ledger API para verificar `family_id` do guardian [VERIFIED: npm registry] |
| `server-only` | 0.0.1 | Impede importação de código server no client | Marcar `src/modules/ledger/engine.ts` como server-only [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SUM on-the-fly (D-03) | Coluna de saldo mantida com trigger | Trigger é mais rápido para reads, mas cria drift risk e viola append-only; SUM é correto para volume v1 |
| `db.transaction()` Drizzle | Raw SQL BEGIN/COMMIT via `sql` template | Raw SQL funciona mas perde type safety; Drizzle `tx` é preferível |
| `integer()` column | `bigint()` | bigint suporta valores maiores mas é overkill para v1; integer é suficiente para Kreds |

**Installation:** Nenhuma instalação necessária — todos os pacotes já estão no projeto.

---

## Package Legitimacy Audit

> Nenhum novo pacote será instalado nesta fase. Todos os pacotes são reutilizados da Fase 1 e Fase 2.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `drizzle-orm` | npm | ~3 anos | Alto | github.com/drizzle-team/drizzle-orm | N/A (já instalado) | Approved |
| `zod` | npm | ~4 anos | Muito alto | github.com/colinhacks/zod | N/A (já instalado) | Approved |
| `pg` | npm | ~10 anos | Muito alto | github.com/brianc/node-postgres | N/A (já instalado) | Approved |
| `vitest` | npm | ~3 anos | Alto | github.com/vitest-dev/vitest | N/A (já instalado) | Approved |
| `@testcontainers/postgresql` | npm | ~2 anos | Médio | github.com/testcontainers/testcontainers-node | N/A (já instalado) | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none

*slopcheck não estava disponível no ambiente — todos os pacotes acima são dependências já auditadas nas Fases 1 e 2, conhecidas e amplamente usadas no ecossistema Node.js.*

---

## Architecture Patterns

### System Architecture Diagram

```
Guardian/Child Browser
        |
        | HTTP (authenticated, family_id in session)
        v
Next.js App Router (API Route Handlers)
  /api/ledger/[childId]/post-earning      ← Fase 3 (engine call)
  /api/ledger/[childId]/post-adjustment   ← Fase 3 (engine call)
  /api/ledger/[childId]/post-reversal     ← Fase 3 (engine call)
  /api/ledger/[childId]/history           ← Fase 3 (audit query)
        |
        | family_id authorization check (helper da Fase 2)
        v
Kreds Engine Module (src/modules/ledger/)
  engine.ts          ← postEarning(), postNegativeAdjustment(), postReversal()
  calculate.ts       ← calculateFirstfruits() — função pura, testável
  queries.ts         ← getBalance(), getLedgerHistory() — queries de leitura
  commands.ts        ← tipos LedgerCommand, EarningCommand, AdjustmentCommand
        |
        | db.transaction() — atômico
        v
Drizzle ORM (src/lib/db/)
  schema/ledger.ts   ← ledger_transactions + ledger_lines tables + enums
        |
        v
PostgreSQL
  ledger_transactions  (UNIQUE command_id → idempotência)
  ledger_lines         (amount INTEGER, account_type enum → no floats)
        |
        | SUM(amount) WHERE child_id + account_type
        v
Available Balance / Firstfruits Balance  (computed, never stored)
```

### Recommended Project Structure

```
src/
├── lib/db/
│   └── schema/
│       ├── index.ts          # Re-exporta todos os schemas (existente + ledger)
│       └── ledger.ts         # NOVO: ledger_transactions, ledger_lines, enums
├── modules/
│   ├── glossary/
│   │   └── terms.ts          # Adicionar: FIRSTFRUITS, KREDS, TREASURY, LEDGER
│   └── ledger/               # NOVO módulo
│       ├── engine.ts         # postEarning(), postNegativeAdjustment(), postReversal()
│       ├── calculate.ts      # calculateFirstfruits() — pura, sem side effects
│       ├── queries.ts        # getBalance(), getLedgerHistory(childId, view)
│       └── commands.ts       # Tipos TypeScript: LedgerCommand, LedgerLine
└── app/api/ledger/
    └── [childId]/
        ├── post-earning/route.ts
        ├── post-adjustment/route.ts
        ├── post-reversal/route.ts
        └── history/route.ts
tests/
├── unit/
│   └── ledger-calculate.test.ts    # calculateFirstfruits edge cases
├── integration/
│   └── ledger-engine.test.ts       # postEarning, idempotência, reversals
```

### Pattern 1: Drizzle Transaction Atômica para Posting

**What:** Envolve header insert + lines insert em `db.transaction()` para garantir atomicidade. Se qualquer insert falhar, toda a operação é revertida.

**When to use:** Toda função de posting do engine — `postEarning()`, `postNegativeAdjustment()`, `postReversal()`.

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/transactions.mdx
// [VERIFIED: Context7 /drizzle-team/drizzle-orm-docs]
import { db } from '@/lib/db'
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema/ledger'

export async function postEarning(command: EarningCommand) {
  return await db.transaction(async (tx) => {
    // 1. Insert transaction header
    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,       // UNIQUE constraint → idempotency
        transactionType: 'task_earning',
        initiatedByIdentityId: command.guardianIdentityId,
        note: command.note ?? null,
      })
      .returning()

    const firstfruits = calculateFirstfruits(command.amount)
    const available = command.amount - firstfruits

    // 2. Insert lines atomically
    await tx.insert(ledgerLines).values([
      {
        id: crypto.randomUUID(),
        transactionId: txHeader.id,
        childProfileId: command.childProfileId,
        accountType: 'available',
        amount: available,           // INTEGER, positive
      },
      {
        id: crypto.randomUUID(),
        transactionId: txHeader.id,
        childProfileId: command.childProfileId,
        accountType: 'firstfruits',
        amount: firstfruits,         // INTEGER, positive
      },
    ])

    return txHeader
  })
}
```

### Pattern 2: Cálculo de Firstfruits Puro

**What:** Função pura que aplica Math.ceil ao 10% do valor. Separada do engine para facilitar teste unitário isolado.

**When to use:** Toda vez que um earning positivo é postado. Mesma função para matching de doação voluntária (Fase 7).

```typescript
// [ASSUMED] — lógica de domínio, sem dependência de biblioteca externa
export const FIRSTFRUITS_RATE = 0.10 as const

export function calculateFirstfruits(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer')
  }
  return Math.ceil(amount * FIRSTFRUITS_RATE)
}

// Edge cases documentados:
// calculateFirstfruits(1)  → 1  (Math.ceil(0.1) = 1)
// calculateFirstfruits(7)  → 1  (Math.ceil(0.7) = 1)
// calculateFirstfruits(10) → 1  (Math.ceil(1.0) = 1)
// calculateFirstfruits(11) → 2  (Math.ceil(1.1) = 2)
// calculateFirstfruits(100)→ 10 (Math.ceil(10.0) = 10)
```

### Pattern 3: Tratamento de Idempotência (erro 23505)

**What:** O UNIQUE constraint no `command_id` rejeita duplicatas a nível de banco. A API interpreta o erro PostgreSQL 23505 e retorna 409 Conflict — não 500.

**When to use:** Toda rota de posting. O caller (Fase 5: task approval) pode fazer retry seguro enviando o mesmo `command_id`.

```typescript
// [ASSUMED] — padrão de tratamento de erro de constraint PostgreSQL
import type { PostgresError } from 'pg'

try {
  await postEarning(command)
} catch (err: unknown) {
  const pgErr = err as PostgresError
  if (pgErr.code === '23505' && pgErr.constraint?.includes('command_id')) {
    // Idempotent retry — already posted
    return Response.json({ status: 'already_posted' }, { status: 409 })
  }
  throw err
}
```

### Pattern 4: SUM para Saldo Atual

**What:** Saldo é sempre calculado como `SUM(amount)` para o `child_profile_id` e `account_type` desejado. Nenhuma coluna de saldo é mantida.

**When to use:** Para exibir saldo ao child/guardian na UI ou validar que negative adjustment não excede saldo (verificação de negócio na API).

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/latest-releases/drizzle-orm-v0291.mdx
// [VERIFIED: Context7 /drizzle-team/drizzle-orm-docs]
import { sum } from 'drizzle-orm'
import { eq, and } from 'drizzle-orm'
import { ledgerLines } from '@/lib/db/schema/ledger'

export async function getBalance(
  childProfileId: string,
  accountType: 'available' | 'firstfruits'
): Promise<number> {
  const result = await db
    .select({ total: sum(ledgerLines.amount) })
    .from(ledgerLines)
    .where(
      and(
        eq(ledgerLines.childProfileId, childProfileId),
        eq(ledgerLines.accountType, accountType)
      )
    )
  return Number(result[0]?.total ?? 0)
}
```

### Pattern 5: Schema Drizzle para Ledger

**What:** Definição das duas novas tabelas seguindo os padrões já estabelecidos no schema da Fase 2.

```typescript
// [VERIFIED: Context7 /drizzle-team/drizzle-orm-docs] — sintaxe de pgEnum, uniqueIndex, check, integer
import {
  pgTable, pgEnum, uuid, integer, text, timestamp,
  index, uniqueIndex, check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { childProfiles, identities, families } from './index'

export const transactionTypeEnum = pgEnum('transaction_type', [
  'task_earning',
  'negative_adjustment',
  'reversal',
  'donation_match',       // Para Fase 7 — enum deve ser extensível
])

export const accountTypeEnum = pgEnum('account_type', [
  'available',
  'firstfruits',
])

export const ledgerTransactions = pgTable(
  'ledger_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    childProfileId: uuid('child_profile_id').notNull().references(() => childProfiles.id),
    commandId: uuid('command_id').notNull(),                        // UNIQUE → idempotency
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    initiatedByIdentityId: uuid('initiated_by_identity_id').references(() => identities.id),
    correctsTransactionId: uuid('corrects_transaction_id'),        // FK para reversals (D-08)
    note: text('note'),                                             // Razão obrigatória p/ adjustments
    createdAt: timestamp('created_at').defaultNow().notNull(),
    // SEM updatedAt — append-only, nenhum update permitido
  },
  (table) => ({
    commandIdUnique: uniqueIndex('ledger_transactions_command_id_unique').on(table.commandId),
    childIdIdx: index('ledger_transactions_child_profile_id_idx').on(table.childProfileId),
    familyIdIdx: index('ledger_transactions_family_id_idx').on(table.familyId),
    selfReferenceCheck: check(
      'no_self_correction',
      sql`${table.correctsTransactionId} IS NULL OR ${table.correctsTransactionId} != ${table.id}`,
    ),
  })
)

export const ledgerLines = pgTable(
  'ledger_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id').notNull().references(() => ledgerTransactions.id),
    childProfileId: uuid('child_profile_id').notNull().references(() => childProfiles.id),
    accountType: accountTypeEnum('account_type').notNull(),
    amount: integer('amount').notNull(),                            // INTEGER — LEDG-02; pode ser negativo p/ débitos
    createdAt: timestamp('created_at').defaultNow().notNull(),
    // SEM updatedAt — append-only, nenhum update permitido
  },
  (table) => ({
    transactionIdIdx: index('ledger_lines_transaction_id_idx').on(table.transactionId),
    childIdIdx: index('ledger_lines_child_profile_id_idx').on(table.childProfileId),
    nonZeroCheck: check('non_zero_amount', sql`${table.amount} != 0`),
  })
)
```

### Anti-Patterns to Avoid

- **UPDATE em ledger_lines:** Viola LEDG-01 (append-only). Nunca usar `db.update().from(ledgerLines)`. Correções sempre via reversal (D-08).
- **Coluna `balance` em `child_profiles`:** Viola D-03. Saldo é computado, nunca armazenado.
- **`parseFloat()` em amounts:** Viola LEDG-02. Usar apenas `Number.isInteger()` e `integer()` Drizzle.
- **Lógica de arredondamento inline nas routes:** Centralizar em `calculateFirstfruits()` — testável e auditável.
- **Posting fora de `db.transaction()`:** Se o insert de header sucede e o de linha falha, o ledger fica inconsistente. Todo posting usa `db.transaction()`.
- **Guardian vendo dados de outra família:** Toda query de ledger inclui `AND family_id = $familyId`. Herdar o helper de autorização da Fase 2.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomicidade header + linhas | Lógica de compensação manual | `db.transaction(async tx => {...})` Drizzle | Drizzle lida com BEGIN/COMMIT/ROLLBACK; falha automaticamente sem compensação [VERIFIED: Context7] |
| Idempotência de posting | Hash de payload + checagem manual | UNIQUE constraint PostgreSQL em `command_id` | O DB rejeita duplicatas com erro 23505; mais confiável que checagem aplicação [VERIFIED: Context7] |
| SUM de saldo | Campo `balance` + trigger de atualização | `db.select({ total: sum(ledgerLines.amount) })` | Função `sum()` nativa do Drizzle; sem drift, sem trigger lógica [VERIFIED: Context7] |
| Validação de schema de comando | Checagens manuais if/else | Zod schema na rota API | Zod já instalado; `.parse()` lança erro de validação com mensagem clara [VERIFIED: npm registry] |
| Geração de UUID command_id | `Math.random()` ou timestamp | `crypto.randomUUID()` (Node 16+ built-in) | UUID v4 criptograficamente seguro; disponível no runtime sem dependência extra [ASSUMED] |

**Key insight:** O ledger append-only é um padrão bem resolvido pela combinação Drizzle transactions + PostgreSQL UNIQUE constraint. Nenhuma lib adicional de ledger é necessária.

---

## Common Pitfalls

### Pitfall 1: Float contaminando o cálculo de firstfruits

**What goes wrong:** `amount * 0.10` retorna `1.0000000000000002` para alguns valores, quebrando a garantia de inteiro antes do `Math.ceil`.
**Why it happens:** Aritmética de ponto flutuante IEEE 754.
**How to avoid:** Validar na entrada que `amount` é inteiro positivo com `Number.isInteger(amount)`. A função `calculateFirstfruits()` deve lançar se receber float.
**Warning signs:** `calculateFirstfruits(3.5)` retornando valor; teste de `amount % 1 !== 0` falhando silenciosamente.

### Pitfall 2: Saldo available negativo após negative adjustment

**What goes wrong:** Guardian registra debit maior que o saldo available atual, resultando em saldo negativo.
**Why it happens:** D-07 não limita o valor máximo de um negative adjustment — mas a semântica de negócio pode exigir que o saldo não fique negativo.
**How to avoid:** Decidir na implementação se a Phase 3 deve rejeitar debits que excedem o saldo (query `getBalance()` antes do insert) ou permitir saldo negativo. CONTEXT.md (D-07) diz "sem limites de valor", mas a verificação deve ser documentada.
**Warning signs:** `getBalance('available')` retornando valor negativo na UI do child.

> **Nota para o planner:** D-07 diz "sem limites em Fase 3", o que implica que saldo negativo pode ocorrer. O planner deve decidir se a API emite warning ou rejeita. Registrar como `[ASSUMED]` A-01 abaixo.

### Pitfall 3: `corrects_transaction_id` sem validação de família

**What goes wrong:** Um reversal aponta para um `transaction_id` de outra família via API maliciosa.
**Why it happens:** Se a validação de `family_id` não inclui verificar que `corrects_transaction_id` pertence à mesma família.
**How to avoid:** Ao criar reversal, buscar o `corrects_transaction_id` no DB e validar que `family_id` bate com o da sessão antes de inserir.
**Warning signs:** Cross-family reversal possível via `POST /api/ledger/[childId]/post-reversal` com body `{ corrects_transaction_id: <id de outra família> }`.

### Pitfall 4: Duplicação silenciosa quando `command_id` é gerado no server sem idempotência end-to-end

**What goes wrong:** Se o servidor gera o `command_id` internamente (não recebe do caller), cada retry gera um `command_id` diferente — idempotência não funciona.
**Why it happens:** `crypto.randomUUID()` a cada request.
**How to avoid:** O `command_id` deve vir do caller (Fase 5: task approval workflow) ou ser derivado deterministicamente da source action. Para Phase 3 standalone, aceitar `command_id` como input obrigatório no body do POST.
**Warning signs:** Dois `ledger_transactions` com mesmos `child_profile_id` + `transactionType` mas `command_id` diferentes para o mesmo evento.

### Pitfall 5: Testcontainers requer Docker daemon (limitação conhecida do projeto)

**What goes wrong:** `pnpm test` falha nos testes de integração do ledger porque o Docker daemon não está disponível (Podman SSH tunnel não compatível).
**Why it happens:** Limitação documentada em STATE.md Fase 1.
**How to avoid:** Testes de integração do ledger seguem o mesmo padrão dos testes da Fase 2 — podem rodar contra o cluster k3s via port-forward. Documentar claramente no Wave 0 que integração tests requerem `kubectl port-forward`.
**Warning signs:** `Error: Could not find a compatible container runtime` ao rodar `pnpm test`.

---

## Code Examples

### Query de histórico para guardian view

```typescript
// [VERIFIED: Context7 /drizzle-team/drizzle-orm-docs] — padrão leftJoin + where
import { eq, and, desc } from 'drizzle-orm'

export async function getGuardianLedgerHistory(childProfileId: string, familyId: string) {
  return await db
    .select({
      transactionId: ledgerTransactions.id,
      commandId: ledgerTransactions.commandId,
      transactionType: ledgerTransactions.transactionType,
      note: ledgerTransactions.note,
      correctsTransactionId: ledgerTransactions.correctsTransactionId,
      createdAt: ledgerTransactions.createdAt,
      lineId: ledgerLines.id,
      accountType: ledgerLines.accountType,
      amount: ledgerLines.amount,
    })
    .from(ledgerTransactions)
    .leftJoin(ledgerLines, eq(ledgerLines.transactionId, ledgerTransactions.id))
    .where(
      and(
        eq(ledgerTransactions.childProfileId, childProfileId),
        eq(ledgerTransactions.familyId, familyId),   // SEMPRE incluir family_id
      )
    )
    .orderBy(desc(ledgerTransactions.createdAt))
}
```

### Zod schema para validação do comando de earning

```typescript
// [ASSUMED] — sintaxe Zod 4.x (zod@4.4.3 instalado)
import { z } from 'zod'

export const EarningCommandSchema = z.object({
  commandId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  amount: z.number().int().positive(),      // LEDG-02: inteiro positivo
  note: z.string().max(500).optional(),
})

export type EarningCommand = z.infer<typeof EarningCommandSchema>
```

### Negative adjustment com validação de reason obrigatório (D-07)

```typescript
// [ASSUMED] — padrão de validação Zod + engine
export const AdjustmentCommandSchema = z.object({
  commandId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  amount: z.number().int().positive(),   // Valor do debit (positivo; linha será negativa)
  reason: z.string().min(1).max(500),    // OBRIGATÓRIO — D-07
  restorationNote: z.string().max(500).optional(),
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `float` para valores monetários | `integer` (centavos/Kreds como unidade mínima) | Prática padrão pós-problemas 0.1+0.2 | LEDG-02: elimina erros de arredondamento float |
| Coluna `balance` atualizada por trigger | SUM on-the-fly / event sourcing | Popularizado por CQRS/event-sourcing (2010s) | D-03: append-only puro, zero drift, auditável |
| Editar transações antigas para corrigir | Reversal entries + new entries | Prática padrão em sistemas contábeis (double-entry) | LEDG-08: histórico imutável, auditável |
| UUID gerado no server sem passar ao caller | command_id gerado pelo caller e enviado | Padrão de idempotency keys (Stripe, 2015+) | LEDG-06: retry seguro end-to-end |

**Deprecated/outdated:**
- **Triggers de saldo:** Tentador para performance, mas cria drift quando transações são corrigidas e torna difícil auditoria retroativa.
- **DECIMAL/FLOAT para Kreds:** Kreds é uma moeda virtual inteira por design — não há subdivisões de Kreds.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A-01 | Saldo available pode ficar negativo após negative adjustment (D-07 diz "sem limites de valor") | Pitfall 2, Common Pitfalls | Se produto não aceitar saldo negativo, a API precisa de checagem pré-insert — impacta design do `postNegativeAdjustment()` |
| A-02 | `command_id` deve ser enviado pelo caller (e.g., task approval em Fase 5) como input obrigatório do POST | Pattern 3, Code Examples | Se server gera command_id, idempotência end-to-end não funciona em retries verdadeiros |
| A-03 | `crypto.randomUUID()` (Node 16+ built-in) é suficiente para geração de UUIDs onde o caller não dispõe de um | Don't Hand-Roll | Node 26 está em uso no projeto — disponível [ASSUMED, não verificado explicitamente nos docs] |
| A-04 | Enum `transaction_type` deve incluir `donation_match` já na Fase 3 para evitar migration adicional na Fase 7 | Schema Pattern 5 | Se omitido, Fase 7 precisará de migration `ALTER TYPE` para adicionar enum value |
| A-05 | Sintaxe de Zod 4.x (`.int()`, `.positive()`) não mudou de forma breaking vs 3.x | Code Examples | Zod 4 foi lançado recentemente; validar em docs oficiais antes de implementar |

---

## Open Questions

1. **Saldo negativo em negative adjustment**
   - What we know: D-07 diz que o engine apenas valida que o debit amount é inteiro positivo, sem limites de valor
   - What's unclear: A API deve rejeitar um debit que excede o saldo available, ou registrar e deixar saldo negativo?
   - Recommendation: Implementar verificação pré-insert com `getBalance()` e retornar 422 se debit > saldo. Mais fácil relaxar depois do que explicar saldo negativo para child/guardian.

2. **`corrects_transaction_id` como FK vs texto livre**
   - What we know: D-08 especifica FK. Schema proposto inclui FK para `ledger_transactions.id`.
   - What's unclear: A FK deve ser obrigatória (NOT NULL) em reversals, ou opcional? Se obrigatória, um reversal sem `corrects_transaction_id` seria rejeitado pelo DB.
   - Recommendation: Tornar `corrects_transaction_id` NOT NULL apenas para linhas do tipo `reversal` via CHECK constraint, ou validar na aplicação. CHECK constraint é mais seguro.

3. **Note obrigatória para negative adjustment (D-07) vs `note` nullable no header**
   - What we know: D-07 requer reason obrigatório. O schema proposto tem `note text` nullable para comportar todos os tipos.
   - What's unclear: Deve-se ter coluna `note` obrigatória só quando `transaction_type = 'negative_adjustment'`?
   - Recommendation: Validar obrigatoriedade no Zod schema da rota, não no DB constraint — mais flexível para extensões futuras.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime geral | ✓ | 26.0.0 | — |
| PostgreSQL (k3s cluster) | Migrations e testes integração | ✓ (via port-forward) | 18-alpine (Testcontainers) | — |
| Drizzle ORM | Schema e queries | ✓ | 0.45.2 | — |
| Drizzle Kit | Migrations | ✓ | 0.31.10 | — |
| Vitest | Testes de unidade | ✓ | 4.1.8 | — |
| Testcontainers PostgreSQL | Testes de integração | ✓ (com Docker daemon) | 12.0.1 | Usar k3s port-forward (limitação conhecida) |
| Docker daemon | Testcontainers | ✗ (Podman usado no projeto) | — | kubectl port-forward para cluster |

**Missing dependencies with no fallback:** Nenhum — todos os requisitos da Fase 3 usam pacotes já instalados.

**Missing dependencies with fallback:**
- Docker daemon (Testcontainers): A limitação é conhecida desde Fase 1. Testes de integração funcionam via port-forward ao cluster k3s. O Wave 0 deve documentar isso claramente no setup de testes.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` (existente, configurado com jsdom + tsconfigPaths) |
| Quick run command | `pnpm test` (unit only: `pnpm test tests/unit/`) |
| Full suite command | `pnpm test` (todos os testes; integração requer port-forward) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEDG-01 | Append-only: SELECT count > 0, UPDATE/DELETE impossíveis | integration | `pnpm test tests/integration/ledger-engine.test.ts` | ❌ Wave 0 |
| LEDG-02 | amount é sempre inteiro; rejeita float na entrada | unit | `pnpm test tests/unit/ledger-calculate.test.ts` | ❌ Wave 0 |
| LEDG-03 | calculateFirstfruits(1)=1, (7)=1, (10)=1, (11)=2, (100)=10 | unit | `pnpm test tests/unit/ledger-calculate.test.ts` | ❌ Wave 0 |
| LEDG-04 | postEarning(+10) → header + linha +9 available + linha +1 firstfruits | integration | `pnpm test tests/integration/ledger-engine.test.ts` | ❌ Wave 0 |
| LEDG-05 | postNegativeAdjustment(debit=5, reason="X") → linha -5 em available | integration | `pnpm test tests/integration/ledger-engine.test.ts` | ❌ Wave 0 |
| LEDG-06 | Segundo postEarning com mesmo command_id retorna 409/already_posted | integration | `pnpm test tests/integration/ledger-engine.test.ts` | ❌ Wave 0 |
| LEDG-07 | getGuardianLedgerHistory retorna note e commandId; getChildLedgerHistory omite | unit | `pnpm test tests/unit/ledger-queries.test.ts` | ❌ Wave 0 |
| LEDG-08 | postReversal cria entrada negativa com corrects_transaction_id FK; original não editado | integration | `pnpm test tests/integration/ledger-engine.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test tests/unit/`
- **Per wave merge:** `pnpm test` (full suite com port-forward ativo)
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/ledger-calculate.test.ts` — cobre LEDG-02, LEDG-03
- [ ] `tests/unit/ledger-queries.test.ts` — cobre LEDG-07 (mock DB)
- [ ] `tests/integration/ledger-engine.test.ts` — cobre LEDG-01, LEDG-04, LEDG-05, LEDG-06, LEDG-08
- [ ] `src/lib/db/schema/ledger.ts` — schema Drizzle para `ledger_transactions` e `ledger_lines`
- [ ] Migration: `pnpm db:generate` após criar `schema/ledger.ts`

---

## Security Domain

> `security_enforcement: true` em `.planning/config.json`. ASVS level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim (indiretamente) | next-auth session verificada antes de toda rota de ledger |
| V3 Session Management | sim | next-auth existente da Fase 2 |
| V4 Access Control | sim (critical) | family_id scope obrigatório em toda query de ledger; helper da Fase 2 |
| V5 Input Validation | sim | Zod schema em todas as rotas de posting (amount inteiro, reason não vazio, UUIDs válidos) |
| V6 Cryptography | não (direto) | Sem dados criptografados no ledger; command_id via crypto.randomUUID() |

### Known Threat Patterns for Ledger API

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Guardian posta earning para child de outra família | Tampering | Verificar `child_profile_id` pertence à `family_id` da sessão antes de insert |
| Reversal aponta para transaction de outra família | Tampering | Buscar `corrects_transaction_id` no DB e validar `family_id` match |
| Float em `amount` → rounding attack | Tampering | Zod `.int().positive()` + `Number.isInteger()` no engine |
| Replay attack via mesmo command_id diferente | Repudiation | UNIQUE constraint em `command_id` + tratamento 409 |
| Child vê razão interna de adjustment | Info Disclosure | Query separada para child view; `note` e `command_id` omitidos na child query |
| Negative adjustment sem autenticação | Elevation of Privilege | next-auth session + role `guardian` verificada na rota |

---

## Sources

### Primary (HIGH confidence)

- `/drizzle-team/drizzle-orm-docs` (Context7) — transactions, unique constraints, check constraints, pgEnum, sum aggregation, indexes
- `src/lib/db/schema/index.ts` (codebase) — padrões existentes de schema: uuid, pgEnum, uniqueIndex, check, index, references
- `drizzle/0001_omniscient_scarlet_spider.sql` (codebase) — SQL gerado pela Fase 2, confirma sintaxe Drizzle-to-PostgreSQL
- `package.json` (codebase) — versões exatas de todas as dependências instaladas
- `.planning/phases/03-kreds-engine-ledger-and-audit-foundation/03-CONTEXT.md` — todas as decisões locked D-01 a D-10

### Secondary (MEDIUM confidence)

- `tests/integration/family-tenancy.test.ts` (codebase) — padrão Testcontainers + Drizzle migrate para testes de integração
- `.planning/STATE.md` — limitação conhecida Docker/Podman para Testcontainers

### Tertiary (LOW confidence)

- Nenhuma — todos os claims técnicos foram verificados via codebase existente ou Context7.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todos os pacotes já instalados e em uso no projeto
- Architecture patterns: HIGH — schema Drizzle e padrão de transação verificados via Context7 + migration existente
- Pitfalls: MEDIUM — baseados em padrões conhecidos de ledger; A-01 (saldo negativo) é o único ponto ambíguo que requer decisão de implementação
- Test infrastructure: HIGH — vitest.config.ts e padrão Testcontainers já estabelecidos

**Research date:** 2026-06-07
**Valid until:** 2026-08-07 (stack estável; revisar se drizzle-orm >0.46 ou zod v4 breaking changes)
