# Phase 03: Kreds Engine Ledger and Audit Foundation - Pattern Map

**Mapped:** 2026-06-06
**Files analyzed:** 10 (novos/modificados)
**Analogs found:** 9 / 10

---

## File Classification

| Novo/Modificado | Role | Data Flow | Closest Analog | Match Quality |
|-----------------|------|-----------|----------------|---------------|
| `src/lib/db/schema/ledger.ts` | model | CRUD | `src/lib/db/schema/index.ts` | exact |
| `src/lib/db/schema/index.ts` (re-export) | config | — | `src/lib/db/schema/index.ts` | exact |
| `src/modules/ledger/calculate.ts` | utility | transform | `src/modules/glossary/terms.ts` | role-partial (módulo puro sem side-effects) |
| `src/modules/ledger/commands.ts` | utility | — | `src/modules/glossary/terms.ts` | role-partial (tipos/constantes exportadas) |
| `src/modules/ledger/engine.ts` | service | CRUD (append-only) | `src/lib/db/index.ts` + schema/index.ts (padrão Drizzle transaction) | role-match |
| `src/modules/ledger/queries.ts` | service | request-response | `src/app/api/families/route.ts` (padrão db.select) | role-match |
| `src/app/api/ledger/[childId]/post-earning/route.ts` | controller | request-response | `src/app/api/families/route.ts` | role-match |
| `src/app/api/ledger/[childId]/post-adjustment/route.ts` | controller | request-response | `src/app/api/families/route.ts` | role-match |
| `src/app/api/ledger/[childId]/post-reversal/route.ts` | controller | request-response | `src/app/api/families/route.ts` | role-match |
| `src/app/api/ledger/[childId]/history/route.ts` | controller | request-response | `src/app/api/families/route.ts` | role-match |
| `src/modules/glossary/terms.ts` (extensão) | config | — | `src/modules/glossary/terms.ts` | exact |
| `tests/unit/ledger-calculate.test.ts` | test | — | `tests/unit/glossary.test.ts` | exact |
| `tests/unit/ledger-queries.test.ts` | test | — | `tests/unit/family-authorization.test.ts` | role-match |
| `tests/integration/ledger-engine.test.ts` | test | CRUD | `tests/integration/family-tenancy.test.ts` | exact |

---

## Pattern Assignments

### `src/lib/db/schema/ledger.ts` (model, CRUD)

**Analog:** `src/lib/db/schema/index.ts`

**Imports pattern** (linhas 1–16 do analog):
```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { families, childProfiles, identities } from './index'
```

**Enum pattern** (linhas 18–26 do analog — `familyRoleEnum`, `membershipStatusEnum`):
```typescript
// Copiar padrão: pgEnum('nome_snake_case', ['valor1', 'valor2'])
export const transactionTypeEnum = pgEnum('transaction_type', [
  'task_earning',
  'negative_adjustment',
  'reversal',
  'donation_match',
])

export const accountTypeEnum = pgEnum('account_type', [
  'available',
  'firstfruits',
])
```

**Tabela com uniqueIndex + check** (linhas 77–102 do analog — `familyMemberships`):
```typescript
// Copiar padrão de (table) => ({ uniqueIndex, check })
export const ledgerTransactions = pgTable(
  'ledger_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    childProfileId: uuid('child_profile_id').notNull().references(() => childProfiles.id),
    commandId: uuid('command_id').notNull(),              // UNIQUE → idempotência LEDG-06
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    initiatedByIdentityId: uuid('initiated_by_identity_id').references(() => identities.id),
    correctsTransactionId: uuid('corrects_transaction_id'), // FK para reversals D-08
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    // SEM updatedAt — append-only (LEDG-01)
  },
  (table) => ({
    commandIdUnique: uniqueIndex('ledger_transactions_command_id_unique').on(table.commandId),
    childIdIdx: index('ledger_transactions_child_profile_id_idx').on(table.childProfileId),
    familyIdIdx: index('ledger_transactions_family_id_idx').on(table.familyId),
    // Padrão check: sql`...` igual ao oneTargetCheck da familyMemberships (linha 97-100)
    selfReferenceCheck: check(
      'no_self_correction',
      sql`${table.correctsTransactionId} IS NULL OR ${table.correctsTransactionId} != ${table.id}`,
    ),
  })
)
```

**Tabela com check simples** (padrão `nonZeroCheck` nova, sem analog direto — usar mesmo estilo `check` do analog):
```typescript
export const ledgerLines = pgTable(
  'ledger_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id').notNull().references(() => ledgerTransactions.id),
    childProfileId: uuid('child_profile_id').notNull().references(() => childProfiles.id),
    accountType: accountTypeEnum('account_type').notNull(),
    amount: integer('amount').notNull(),  // INTEGER — LEDG-02; negativo para débitos
    createdAt: timestamp('created_at').defaultNow().notNull(),
    // SEM updatedAt — append-only (LEDG-01)
  },
  (table) => ({
    transactionIdIdx: index('ledger_lines_transaction_id_idx').on(table.transactionId),
    childIdIdx: index('ledger_lines_child_profile_id_idx').on(table.childProfileId),
    nonZeroCheck: check('non_zero_amount', sql`${table.amount} != 0`),
  })
)
```

---

### `src/lib/db/schema/index.ts` (re-export ledger)

**Analog:** `src/lib/db/schema/index.ts` (o próprio arquivo)

**Padrão de extensão:** Adicionar re-export no final do arquivo existente, sem modificar nenhuma linha existente:
```typescript
// Ao final de src/lib/db/schema/index.ts, adicionar:
export * from './ledger'
```

---

### `src/modules/ledger/calculate.ts` (utility, transform)

**Analog:** `src/modules/glossary/terms.ts` (módulo puro, sem side-effects, só exports)

**Padrão do analog** (linhas 1–21):
```typescript
// Módulo puro: export const + export type, sem imports de dependências externas
export const TERMS = { ... } as const
export type TermKey = keyof typeof TERMS
```

**Padrão a copiar para calculate.ts:**
```typescript
// Mesmo estilo: export const + export function, sem imports externos
export const FIRSTFRUITS_RATE = 0.10 as const

export function calculateFirstfruits(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer')
  }
  return Math.ceil(amount * FIRSTFRUITS_RATE)
}
// Edge cases documentados: (1)→1, (7)→1, (10)→1, (11)→2, (100)→10
```

---

### `src/modules/ledger/commands.ts` (utility — tipos TypeScript)

**Analog:** `src/modules/glossary/terms.ts` (padrão de exportar constantes e tipos)

**Padrão a copiar:**
```typescript
// Mesmo padrão: export type + z.infer — sem lógica, só tipos e schemas Zod
import { z } from 'zod'

export const EarningCommandSchema = z.object({
  commandId: z.string().uuid(),
  familyId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  guardianIdentityId: z.string().uuid(),
  amount: z.number().int().positive(),
  note: z.string().max(500).optional(),
})
export type EarningCommand = z.infer<typeof EarningCommandSchema>

export const AdjustmentCommandSchema = z.object({
  commandId: z.string().uuid(),
  familyId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  guardianIdentityId: z.string().uuid(),
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(500),   // obrigatório — D-07
  restorationNote: z.string().max(500).optional(),
})
export type AdjustmentCommand = z.infer<typeof AdjustmentCommandSchema>

export const ReversalCommandSchema = z.object({
  commandId: z.string().uuid(),
  familyId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  guardianIdentityId: z.string().uuid(),
  correctsTransactionId: z.string().uuid(),  // obrigatório — D-08
  correctionNote: z.string().min(1).max(500),
})
export type ReversalCommand = z.infer<typeof ReversalCommandSchema>
```

---

### `src/modules/ledger/engine.ts` (service, CRUD append-only)

**Analog:** `src/lib/db/index.ts` (instância `db`) + padrão de transação da RESEARCH.md Pattern 1

**Import do db** (linhas 1–6 do analog `src/lib/db/index.ts`):
```typescript
// Copiar exatamente este import — mesma instância usada em toda a app
import { db } from '@/lib/db'
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema/ledger'
import { calculateFirstfruits } from './calculate'
import type { EarningCommand, AdjustmentCommand, ReversalCommand } from './commands'
```

**Padrão de transação atômica** (baseado em `src/lib/db/index.ts` via `drizzle-orm/node-postgres`):
```typescript
// Usar db.transaction(async (tx) => {...}) — mesmo pool/instância do projeto
export async function postEarning(command: EarningCommand) {
  return await db.transaction(async (tx) => {
    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,
        transactionType: 'task_earning',
        initiatedByIdentityId: command.guardianIdentityId,
        note: command.note ?? null,
      })
      .returning()

    const firstfruits = calculateFirstfruits(command.amount)
    const available = command.amount - firstfruits

    await tx.insert(ledgerLines).values([
      { id: crypto.randomUUID(), transactionId: txHeader.id, childProfileId: command.childProfileId, accountType: 'available', amount: available },
      { id: crypto.randomUUID(), transactionId: txHeader.id, childProfileId: command.childProfileId, accountType: 'firstfruits', amount: firstfruits },
    ])

    return txHeader
  })
}
```

**Nota de server-only:** Adicionar `import 'server-only'` como primeira linha de `engine.ts` para impedir importação no client bundle.

---

### `src/modules/ledger/queries.ts` (service, request-response)

**Analog:** `src/app/api/families/route.ts` (padrão `db.select().from()`)

**Import e padrão de query** (linhas 1–8 do analog):
```typescript
import { db } from '@/lib/db'
// Analog usa: import * as schema from '@/lib/db/schema'
// Para queries: importar tabelas específicas do ledger
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema/ledger'
import { eq, and, desc, sum } from 'drizzle-orm'
```

**Padrão db.select** (linha 6 do analog `families/route.ts`):
```typescript
// Analog: const rows = await db.select().from(schema.families)
// Para ledger — getBalance:
export async function getBalance(childProfileId: string, accountType: 'available' | 'firstfruits'): Promise<number> {
  const result = await db
    .select({ total: sum(ledgerLines.amount) })
    .from(ledgerLines)
    .where(and(eq(ledgerLines.childProfileId, childProfileId), eq(ledgerLines.accountType, accountType)))
  return Number(result[0]?.total ?? 0)
}

// getGuardianLedgerHistory — adiciona leftJoin + family_id scope obrigatório
export async function getGuardianLedgerHistory(childProfileId: string, familyId: string) {
  return await db
    .select({ /* todos os campos incluindo commandId, note, correctsTransactionId */ })
    .from(ledgerTransactions)
    .leftJoin(ledgerLines, eq(ledgerLines.transactionId, ledgerTransactions.id))
    .where(and(eq(ledgerTransactions.childProfileId, childProfileId), eq(ledgerTransactions.familyId, familyId)))
    .orderBy(desc(ledgerTransactions.createdAt))
}

// getChildLedgerHistory — omite commandId, note, correctsTransactionId (D-09, D-10)
export async function getChildLedgerHistory(childProfileId: string, familyId: string) {
  return await db
    .select({ /* apenas campos safe para child: transactionType, accountType, amount, createdAt */ })
    .from(ledgerTransactions)
    .leftJoin(ledgerLines, eq(ledgerLines.transactionId, ledgerTransactions.id))
    .where(and(eq(ledgerTransactions.childProfileId, childProfileId), eq(ledgerTransactions.familyId, familyId)))
    .orderBy(desc(ledgerTransactions.createdAt))
}
```

---

### `src/app/api/ledger/[childId]/post-earning/route.ts` (controller, request-response)

**Analog:** `src/app/api/families/route.ts` (único route handler existente)

**Imports pattern** (linhas 1–3 do analog):
```typescript
import { NextResponse } from 'next/server'
// Adicionar para ledger:
import { postEarning } from '@/modules/ledger/engine'
import { EarningCommandSchema } from '@/modules/ledger/commands'
```

**Padrão de handler** (linhas 5–8 do analog — `GET()` com `NextResponse.json`):
```typescript
// Analog: export async function GET() { return NextResponse.json(rows) }
// Para ledger POST com validação Zod + tratamento 23505:
export async function POST(request: Request, { params }: { params: { childId: string } }) {
  const body = await request.json()
  const parsed = EarningCommandSchema.safeParse({ ...body, childProfileId: params.childId })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const txHeader = await postEarning(parsed.data)
    return NextResponse.json({ data: txHeader }, { status: 201 })
  } catch (err: unknown) {
    // Tratar erro de idempotência PostgreSQL 23505 (D-06)
    const pgErr = err as { code?: string; constraint?: string }
    if (pgErr.code === '23505' && pgErr.constraint?.includes('command_id')) {
      return NextResponse.json({ status: 'already_posted' }, { status: 409 })
    }
    throw err
  }
}
```

**Mesmo padrão se aplica a:** `post-adjustment/route.ts` e `post-reversal/route.ts`, trocando schema e função de engine.

---

### `src/app/api/ledger/[childId]/history/route.ts` (controller, request-response)

**Analog:** `src/app/api/families/route.ts`

**Padrão de GET com query param:**
```typescript
import { NextResponse } from 'next/server'
import { getGuardianLedgerHistory, getChildLedgerHistory } from '@/modules/ledger/queries'

// Análogo ao GET() do families/route.ts, mas com view diferenciada por query param
export async function GET(request: Request, { params }: { params: { childId: string } }) {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')  // 'guardian' | 'child'

  // Autorização: verificar session + family_id (padrão Fase 2)
  // ...

  if (view === 'guardian') {
    const rows = await getGuardianLedgerHistory(params.childId, familyId)
    return NextResponse.json(rows)
  }

  const rows = await getChildLedgerHistory(params.childId, familyId)
  return NextResponse.json(rows)
}
```

---

### `src/modules/glossary/terms.ts` (extensão)

**Analog:** O próprio arquivo `src/modules/glossary/terms.ts`

**Padrão atual** (linhas 1–21 — `as const` + exportar tipo):
```typescript
export const TERMS = {
  // termos existentes...
  KREDS: 'Kreds',
  FIRSTFRUITS: 'Firstfruits',
  // ...
} as const
```

**Extensão a adicionar** (novos termos dentro do objeto `TERMS`, após `LEDGER_TRANSACTION`):
```typescript
// Adicionar dentro do objeto TERMS existente:
AVAILABLE_BALANCE: 'Available Balance',
FIRSTFRUITS_BALANCE: 'Firstfruits Balance',
REVERSAL: 'Reversal',
ADJUSTMENT_REASON: 'Adjustment Reason',
CORRECTION_NOTE: 'Correction Note',
```
**Nota:** `KREDS`, `FIRSTFRUITS`, `FIRSTFRUITS_TREASURY`, `KREDS_ENGINE`, `NEGATIVE_ADJUSTMENT`, `LEDGER_TRANSACTION` já existem no arquivo — NÃO duplicar.

---

### `tests/unit/ledger-calculate.test.ts` (test, unit)

**Analog:** `tests/unit/glossary.test.ts`

**Padrão de imports** (linhas 1–2 do analog):
```typescript
import { describe, it, expect } from 'vitest'
import { calculateFirstfruits, FIRSTFRUITS_RATE } from '../../src/modules/ledger/calculate'
```

**Padrão de estrutura** (linhas 4–25 do analog):
```typescript
describe('calculateFirstfruits', () => {
  it('should apply Math.ceil to 10% of amount', () => {
    expect(calculateFirstfruits(10)).toBe(1)
  })

  // Edge cases documentados em CONTEXT.md + RESEARCH.md (D-01, LEDG-03):
  it('should return 1 for amount=1 (Math.ceil(0.1) = 1)', () => {
    expect(calculateFirstfruits(1)).toBe(1)
  })
  it('should return 1 for amount=7 (Math.ceil(0.7) = 1)', () => {
    expect(calculateFirstfruits(7)).toBe(1)
  })
  it('should return 2 for amount=11 (Math.ceil(1.1) = 2)', () => {
    expect(calculateFirstfruits(11)).toBe(2)
  })
  it('should return 10 for amount=100', () => {
    expect(calculateFirstfruits(100)).toBe(10)
  })

  // Rejeitar floats — LEDG-02
  it('should throw for float input', () => {
    expect(() => calculateFirstfruits(3.5)).toThrow()
  })

  // Rejeitar zero e negativos
  it('should throw for zero or negative input', () => {
    expect(() => calculateFirstfruits(0)).toThrow()
    expect(() => calculateFirstfruits(-5)).toThrow()
  })
})
```

---

### `tests/unit/ledger-queries.test.ts` (test, unit com mock DB)

**Analog:** `tests/unit/family-authorization.test.ts` (testa funções puras importadas de módulos ainda não criados — estilo RED phase)

**Padrão de imports e mock** (linhas 1–20 do analog):
```typescript
import { describe, it, expect } from 'vitest'
// Importar de módulo ainda a criar — RED phase
import { getGuardianLedgerHistory, getChildLedgerHistory, getBalance } from '../../src/modules/ledger/queries'
```

**Padrão de asserção de visibilidade** (baseado em estilo do analog — testar que campos corretos estão ou não estão presentes):
```typescript
describe('getChildLedgerHistory', () => {
  it('should not include commandId in child view (D-09)', async () => {
    // mock DB ou verificar tipo retornado não tem commandId
  })
  it('should not include note/reason in child view (D-10)', async () => { ... })
})

describe('getGuardianLedgerHistory', () => {
  it('should include commandId, note, correctsTransactionId in guardian view (D-09)', async () => { ... })
})
```

---

### `tests/integration/ledger-engine.test.ts` (test, integration)

**Analog:** `tests/integration/family-tenancy.test.ts`

**Padrão de imports + setup Testcontainers** (linhas 1–28 do analog):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../../src/lib/db/schema'
```

**Padrão beforeAll/afterAll** (linhas 12–28 do analog — exatamente igual):
```typescript
let container: any
let pool: any
let db: any

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:18-alpine').start()
  pool = new Pool({ connectionString: container.getConnectionUri() })
  db = drizzle(pool)
  await migrate(db, { migrationsFolder: './drizzle' })
}, 60000)

afterAll(async () => {
  await pool.end()
  await container.stop()
})
```

**Padrão de test cases** (estilo do analog — RED phase, tabelas de schema verificadas):
```typescript
describe('postEarning (LEDG-04)', () => {
  it('should create header + available line + firstfruits line atomically', async () => {
    // INSERT + verificar 3 rows (1 header + 2 lines)
  })
})

describe('Idempotência (LEDG-06)', () => {
  it('should reject duplicate command_id with error 23505', async () => {
    // Segundo insert com mesmo commandId deve lançar
  })
})

describe('postReversal (LEDG-08)', () => {
  it('should create reversal entry with corrects_transaction_id; original must not be modified', async () => {
    // Verificar que linha original está inalterada após reversal
  })
})
```

---

## Shared Patterns

### DB Import
**Source:** `src/lib/db/index.ts` (linhas 1–6)
**Apply to:** `engine.ts`, `queries.ts`, todas as route handlers
```typescript
import { db } from '@/lib/db'
```

### NextResponse Pattern
**Source:** `src/app/api/families/route.ts` (linhas 1, 7)
**Apply to:** Todos os 4 route handlers de ledger
```typescript
import { NextResponse } from 'next/server'
// ...
return NextResponse.json(data, { status: 200 | 201 | 409 | 422 })
```

### Schema Import Alias
**Source:** `src/app/api/families/route.ts` (linha 3) + `src/lib/db/index.ts` (linha 4)
**Apply to:** Todos os arquivos que acessam tabelas
```typescript
// Para acesso a tabelas ledger — importar especificamente (não import * as schema):
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema/ledger'
// Para acesso ao db:
import { db } from '@/lib/db'
```

### Tratamento de Erro de Idempotência (LEDG-06)
**Source:** RESEARCH.md Pattern 3 (sem analog direto no código existente)
**Apply to:** `post-earning/route.ts`, `post-adjustment/route.ts`, `post-reversal/route.ts`
```typescript
const pgErr = err as { code?: string; constraint?: string }
if (pgErr.code === '23505' && pgErr.constraint?.includes('command_id')) {
  return NextResponse.json({ status: 'already_posted' }, { status: 409 })
}
throw err
```

### Family ID Scope (isolamento multi-tenant)
**Source:** `src/lib/db/schema/index.ts` — toda tabela tem `familyId` com index
**Apply to:** `queries.ts`, todos os route handlers
```typescript
// Toda query de ledger SEMPRE inclui family_id no WHERE:
.where(and(eq(ledgerTransactions.childProfileId, childProfileId), eq(ledgerTransactions.familyId, familyId)))
```

### Append-Only Discipline
**Source:** CONTEXT.md D-08, RESEARCH.md Anti-patterns
**Apply to:** `engine.ts` inteiro
```typescript
// NUNCA usar db.update() ou db.delete() em ledger_transactions ou ledger_lines
// Correções via postReversal() com corrects_transaction_id
```

### Testcontainers Setup
**Source:** `tests/integration/family-tenancy.test.ts` (linhas 12–28)
**Apply to:** `tests/integration/ledger-engine.test.ts`
```typescript
// Copiar beforeAll/afterAll integralmente — mesma imagem postgres:18-alpine
// mesma pasta de migrations: './drizzle'
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/modules/ledger/engine.ts` (lógica de `db.transaction()`) | service | CRUD atomic | Não há nenhum service existente que use `db.transaction(async tx => {...})` — padrão novo no projeto; usar RESEARCH.md Pattern 1 como referência |

---

## Metadata

**Analog search scope:** `src/`, `tests/`
**Files scanned:** 11 arquivos lidos
**Pattern extraction date:** 2026-06-06

**Limitação conhecida para testes de integração:** Docker daemon não disponível (Podman no projeto). Testes de integração do ledger devem ser executados com `kubectl port-forward` ao cluster k3s, seguindo o mesmo workaround documentado em STATE.md da Fase 1.
