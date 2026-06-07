# Phase 4: Weekly Task Templates and Activity Cycles - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 9 (novos ou modificados)
**Analogs found:** 9 / 9

---

## File Classification

| Novo/Modificado | Role | Data Flow | Analog mais próximo | Qualidade |
|-----------------|------|-----------|---------------------|-----------|
| `src/lib/db/schema/index.ts` (extensão) | model | CRUD | próprio arquivo (extensão in-place) | exact |
| `src/modules/activity/cycle.ts` | utility | transform | `src/modules/glossary/terms.ts` | role-match |
| `src/lib/db/tasks/queries.ts` | service | CRUD | `src/lib/families/commands.ts` | role-match |
| `src/lib/db/tasks/commands.ts` | service | CRUD | `src/lib/families/commands.ts` | exact |
| `src/app/api/families/tasks/route.ts` | controller | request-response | `src/app/api/families/children/route.ts` | exact |
| `src/app/api/families/tasks/[id]/route.ts` | controller | request-response | `src/app/api/families/children/deactivate/route.ts` | exact |
| `src/app/family/tasks/page.tsx` | component | request-response | `src/app/family/children/page.tsx` | exact |
| `src/app/family/tasks/current/page.tsx` | component | request-response | `src/app/family/children/page.tsx` | role-match |
| `src/modules/glossary/terms.ts` (extensão) | utility | transform | próprio arquivo (extensão in-place) | exact |
| `tests/unit/activity-cycle.test.ts` | test | transform | `tests/unit/family-authorization.test.ts` | role-match |
| `tests/unit/task-template-schema.test.ts` | test | CRUD | `tests/unit/family-authorization.test.ts` | role-match |
| `tests/integration/task-templates.test.ts` | test | CRUD | `tests/integration/family-child-profiles.test.ts` | exact |

---

## Pattern Assignments

### `src/lib/db/schema/index.ts` — extensão: tabela `task_templates`

**Analog:** próprio `src/lib/db/schema/index.ts` (linhas 54–102)

**Imports pattern** (linhas 1–15 do arquivo existente):
```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
```
Todos os símbolos necessários (`integer`, `boolean`, `check`, `index`) já estão importados. Apenas adicionar `taskTemplates` ao final do arquivo, antes do fechamento.

**Core pattern — tabela com index + check** (linhas 54–74 e 77–102, padrão `childProfiles` + `familyMemberships`):
```typescript
export const taskTemplates = pgTable(
  'task_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    assignedChildId: uuid('assigned_child_id')
      .notNull()
      .references(() => childProfiles.id),
    title: text('title').notNull(),
    description: text('description'),                      // nullable por omissão no Drizzle
    kredsValue: integer('kreds_value').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    deactivatedAt: timestamp('deactivated_at'),            // nullable — D-06
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('task_templates_family_id_idx').on(table.familyId),
    childIdIdx: index('task_templates_child_id_idx').on(table.assignedChildId),
    kredsValueCheck: check(
      'kreds_value_positive',
      sql`${table.kredsValue} > 0`,
    ),
  }),
)
```

**Padrões que DEVEM ser copiados do analog:**
- `uuid('id').defaultRandom().primaryKey()` — linha 55 de `childProfiles`
- `.references(() => families.id)` — linha 59 de `childProfiles`
- `timestamp('deactivated_at')` sem `.notNull()` — linha 67 de `childProfiles` (mesmo padrão nullable)
- `(table) => ({...})` segundo argumento de `pgTable` — linhas 71–74 de `childProfiles`
- `check('nome', sql\`...\`)` — linhas 97–100 de `familyMemberships`

---

### `src/modules/activity/cycle.ts` — função pura `getCycleForDate`

**Analog:** `src/modules/glossary/terms.ts` (arquivo inteiro — exportações puras, sem side-effects, sem imports de DB)

**Imports pattern** (sem imports externos — zero dependências):
```typescript
// Nenhum import necessário — usa apenas a Intl API do Node.js nativo
```

**Core pattern — exportação named pura** (análogo às linhas 1–21 de `terms.ts`):
```typescript
export function getCycleForDate(
  date: Date,
  timezone: string,
): { cycleStart: Date; cycleEnd: Date } {
  // Step 1: extrair componentes locais da data no timezone alvo
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const p: Record<string, string> = {}
  dateParts.forEach(({ type, value }) => { p[type] = value })

  const dayOfWeek: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const localDow = dayOfWeek[p.weekday]
  const localYear = Number(p.year)
  const localMonth0 = Number(p.month) - 1
  const localDay = Number(p.day)

  // Step 2: extrair offset UTC para este timezone nesta data (handles DST e meias-horas)
  const offsetPart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date).find((part) => part.type === 'timeZoneName')

  const offsetStr = offsetPart?.value ?? 'GMT+0'
  const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/)
  const sign = match ? (match[1] === '+' ? 1 : -1) : 0
  const hours = match ? Number(match[2]) : 0
  const mins = match ? Number(match[3] ?? '0') : 0
  const offsetMs = sign * (hours * 60 + mins) * 60 * 1000

  // Step 3: meia-noite local do domingo em UTC
  const cycleStart = new Date(
    Date.UTC(localYear, localMonth0, localDay - localDow) - offsetMs,
  )
  const cycleEnd = new Date(cycleStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  return { cycleStart, cycleEnd }
}
```

**Padrões que DEVEM ser copiados do analog (`terms.ts`):**
- Arquivo com apenas exportações nomeadas, sem imports — linhas 1–19
- `export const` / `export function` no topo, sem wrapper default — linha 1
- `export type` derivado do objeto — linha 21
- Nenhum import de `@/lib/db` ou `drizzle-orm` — este arquivo é puro

---

### `src/lib/db/tasks/queries.ts` — queries de leitura

**Analog:** `src/lib/families/commands.ts` (linhas 1–4: imports Drizzle; linhas 62–154: padrão de queries com `eq` + `and`)

**Imports pattern** (cópia direta das linhas 1–4 de `commands.ts`):
```typescript
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
```

**Core pattern — query com family_id scoping + join** (baseado no padrão `.select().from().where()` de `commands.ts` linhas 63–70):
```typescript
export async function getActiveTasksForFamily(familyId: string) {
  return db
    .select({
      id: schema.taskTemplates.id,
      title: schema.taskTemplates.title,
      description: schema.taskTemplates.description,
      kredsValue: schema.taskTemplates.kredsValue,
      assignedChildId: schema.taskTemplates.assignedChildId,
      childName: schema.childProfiles.displayName,
      childAvatarPreset: schema.childProfiles.avatarPreset,
    })
    .from(schema.taskTemplates)
    .innerJoin(
      schema.childProfiles,
      eq(schema.taskTemplates.assignedChildId, schema.childProfiles.id),
    )
    .where(
      and(
        eq(schema.taskTemplates.familyId, familyId),
        eq(schema.taskTemplates.isActive, true),
        eq(schema.childProfiles.active, true),
      ),
    )
}

export async function getAllTasksForFamily(familyId: string) {
  return db
    .select()
    .from(schema.taskTemplates)
    .where(eq(schema.taskTemplates.familyId, familyId))
}
```

**Regra crítica:** todo `WHERE` DEVE incluir `eq(schema.taskTemplates.familyId, familyId)` — FAM-05.

---

### `src/lib/db/tasks/commands.ts` — mutações de escrita

**Analog:** `src/lib/families/commands.ts` (linhas 52–155: transação Drizzle, insert com .returning(), update com .set().where())

**Imports pattern** (linhas 1–4 de `commands.ts`):
```typescript
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
```

**Core pattern — insert com validação pré-DB** (baseado nas linhas 56–61 e 88–96 de `commands.ts`):
```typescript
export async function createTaskTemplate(input: {
  familyId: string
  assignedChildId: string
  title: string
  description?: string
  kredsValue: number
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(schema.taskTemplates)
    .values({
      familyId: input.familyId,
      assignedChildId: input.assignedChildId,
      title: input.title.trim(),
      description: input.description,
      kredsValue: input.kredsValue,
    })
    .returning({ id: schema.taskTemplates.id })
  return row
}
```

**Core pattern — update com family_id scoping** (baseado no padrão `.update().set().where()` do Drizzle, mesmo `and(eq, eq)` de `commands.ts` linha 128-133):
```typescript
export async function deactivateTaskTemplate(
  templateId: string,
  familyId: string,
): Promise<void> {
  await db
    .update(schema.taskTemplates)
    .set({ isActive: false, deactivatedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(schema.taskTemplates.id, templateId),
      eq(schema.taskTemplates.familyId, familyId),
    ))
}

export async function reactivateTaskTemplate(
  templateId: string,
  familyId: string,
): Promise<void> {
  await db
    .update(schema.taskTemplates)
    .set({ isActive: true, deactivatedAt: null, updatedAt: new Date() })
    .where(and(
      eq(schema.taskTemplates.id, templateId),
      eq(schema.taskTemplates.familyId, familyId),
    ))
}
```

**Padrões que DEVEM ser copiados do analog:**
- `.returning({ id: schema.X.id })` após insert — linha 94 de `commands.ts`
- `db.transaction(async (tx) => {...})` quando múltiplas operações precisam de atomicidade — linha 62
- `input.familyName.trim()` para sanitização de strings — linha 91

---

### `src/app/api/families/tasks/route.ts` — GET list + POST create

**Analog:** `src/app/api/families/children/route.ts` (arquivo inteiro)

**Imports pattern** (linhas 1–8 de `children/route.ts`):
```typescript
import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity } from '@/lib/auth/authorization'
```

**Auth pattern** (linhas 17–24 de `children/route.ts`):
```typescript
const session = await auth()

let identity
try {
  identity = requireAuthenticatedIdentity(session)
} catch {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}
```

**Family membership lookup pattern** (linhas 35–43 de `children/route.ts`):
```typescript
const [membership] = await db
  .select({ familyId: schema.familyMemberships.familyId })
  .from(schema.familyMemberships)
  .where(eq(schema.familyMemberships.identityId, identity.id))
  .limit(1)

if (!membership) {
  return NextResponse.json({ error: 'No family found. Create a family first.' }, { status: 400 })
}

const familyId = membership.familyId
```

**Error handling pattern** (linhas 52–66 de `children/route.ts`):
```typescript
try {
  await createTaskTemplate({ familyId, ...validatedInput })
  return NextResponse.json({ success: true }, { status: 201 })
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to create task template'
  return NextResponse.json({ error: message }, { status: 400 })
}
```

**Zod validation — adicionar antes da chamada de command:**
```typescript
import { z } from 'zod'

const taskTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  assignedChildId: z.string().uuid('Must select a child'),
  kredsValue: z.coerce.number().int('Kreds value must be a whole number').positive('Kreds value must be positive'),
})
```

---

### `src/app/api/families/tasks/[id]/route.ts` — PATCH edit/deactivate/reactivate

**Analog:** `src/app/api/families/children/deactivate/route.ts` (arquivo inteiro)

**Imports pattern** (linhas 1–8 de `deactivate/route.ts`):
```typescript
import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../../auth'   // ajustar profundidade para [id]/route.ts
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity } from '@/lib/auth/authorization'
```

**Auth + family membership pattern** (linhas 15–49 de `deactivate/route.ts` — idêntico ao route anterior, copiar):
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, identity.id))
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found' }, { status: 400 })
  }

  // Validar action = 'deactivate' | 'reactivate' | 'update' do body
  // Chamar command correspondente com (params.id, membership.familyId)
}
```

**Error handling** (linhas 51–56 de `deactivate/route.ts`):
```typescript
try {
  await deactivateTaskTemplate(params.id, membership.familyId)
  return NextResponse.json({ success: true })
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to update task template'
  return NextResponse.json({ error: message }, { status: 400 })
}
```

---

### `src/app/family/tasks/page.tsx` — lista de task templates do guardião

**Analog:** `src/app/family/children/page.tsx` (arquivo inteiro)

**Imports pattern** (linhas 1–15 de `children/page.tsx`):
```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity } from '@/lib/auth/authorization'
```

**Directiva de renderização dinâmica** (linha 16 de `children/page.tsx`):
```typescript
export const dynamic = 'force-dynamic'
```

**Auth guard pattern** (linhas 25–34 de `children/page.tsx`):
```typescript
export default async function FamilyTasksPage() {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId, role: schema.familyMemberships.role })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, identity.id))
    .limit(1)

  if (!membership) {
    redirect('/family/onboarding')
  }

  const familyId = membership.familyId
```

**JSX pattern — form POST + lista com action inline** (linhas 65–170 de `children/page.tsx`):
```tsx
<form action="/api/families/tasks" method="POST">
  {/* campos do template */}
  <button type="submit">Add Task</button>
</form>

<ul>
  {tasks.map((task) => (
    <li key={task.id}>
      <strong>{task.title}</strong> — {task.kredsValue} Kreds
      <form action={`/api/families/tasks/${task.id}`} method="POST">
        <input type="hidden" name="_method" value="PATCH" />
        <input type="hidden" name="action" value="deactivate" />
        <button type="submit">Deactivate</button>
      </form>
    </li>
  ))}
</ul>
```

---

### `src/app/family/tasks/current/page.tsx` — visão do ciclo atual

**Analog:** `src/app/family/children/page.tsx` (mesma estrutura de server component SSR)

**Padrão adicional — uso de `getCycleForDate`:**
```typescript
import { getCycleForDate } from '@/modules/activity/cycle'

// Dentro do server component, após obter family:
const [family] = await db
  .select({ timezone: schema.families.timezone })
  .from(schema.families)
  .where(eq(schema.families.id, familyId))
  .limit(1)

const { cycleStart, cycleEnd } = getCycleForDate(new Date(), family.timezone)

// Formatar para exibição sempre com timezone da família:
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: family.timezone,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(d)
```

**Auth guard e membership lookup:** copiar exatamente das linhas 25–51 de `children/page.tsx` — estrutura idêntica.

---

### `src/modules/glossary/terms.ts` — extensão: novas constantes

**Analog:** próprio arquivo `src/modules/glossary/terms.ts` (linhas 1–22)

As constantes `TASK_TEMPLATE`, `TASK_COMPLETION`, `SEVENTY_TWO_HOUR_RULE`, e `WEEKLY_CYCLE` **já existem** no arquivo (linhas 6–9). Verificar se `ACTIVITY_CYCLE` precisa ser adicionado — o arquivo atual usa `WEEKLY_CYCLE`. Se necessário, adicionar dentro do objeto `TERMS` seguindo o padrão de linhas 1–19:

```typescript
// Adicionar dentro do objeto TERMS existente, se ausente:
ACTIVITY_CYCLE: 'Activity Cycle',
TASK: 'Task',
```

**Regra:** nunca alterar as chaves existentes — apenas adicionar novas ao final do objeto antes de `} as const`.

---

### `tests/unit/activity-cycle.test.ts`

**Analog:** `tests/unit/family-authorization.test.ts` (linhas 1–15: imports; linhas 49–115: estrutura describe/it/expect)

**Imports pattern** (linhas 1–2 de `family-authorization.test.ts`):
```typescript
import { describe, it, expect } from 'vitest'
import { getCycleForDate } from '../../src/modules/activity/cycle'
```

**Test structure pattern** (linhas 49–96 de `family-authorization.test.ts`):
```typescript
describe('getCycleForDate', () => {
  it('returns Sunday 00:00 through Saturday 23:59:59.999 for SP timezone', () => {
    const { cycleStart, cycleEnd } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'America/Sao_Paulo',
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short',
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
    expect(cycleStart.toISOString()).toBe('2026-06-07T03:00:00.000Z')
    expect(cycleEnd.toISOString()).toBe('2026-06-14T02:59:59.999Z')
  })

  it('handles half-hour UTC offset (Asia/Kolkata)', () => { ... })
  it('handles year boundary crossing', () => { ... })
  it('returns same cycle when input IS Sunday midnight', () => { ... })
})
```

---

### `tests/unit/task-template-schema.test.ts`

**Analog:** `tests/unit/family-authorization.test.ts` (estrutura describe/it/expect puro — sem DB)

**Test structure:**
```typescript
import { describe, it, expect } from 'vitest'
import { taskTemplateSchema } from '../../src/lib/db/tasks/schema'  // ou onde o schema Zod for definido

describe('taskTemplateSchema (ACT-01 Zod validation)', () => {
  it('accepts valid task template input', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Wash dishes',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects float kredsValue (D-07)', () => {
    const result = taskTemplateSchema.safeParse({ ..., kredsValue: 5.5 })
    expect(result.success).toBe(false)
  })

  it('rejects negative kredsValue', () => { ... })
  it('rejects zero kredsValue', () => { ... })
  it('rejects missing title', () => { ... })
  it('rejects invalid assignedChildId UUID', () => { ... })
})
```

---

### `tests/integration/task-templates.test.ts`

**Analog:** `tests/integration/family-child-profiles.test.ts` (arquivo inteiro — Testcontainers + Drizzle migrate)

**Imports pattern** (linhas 1–17 de `family-child-profiles.test.ts`):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../../src/lib/db/schema'
import {
  createTaskTemplate,
  deactivateTaskTemplate,
  reactivateTaskTemplate,
} from '../../src/lib/db/tasks/commands'
import { getActiveTasksForFamily } from '../../src/lib/db/tasks/queries'
```

**Lifecycle pattern** (linhas 20–34 de `family-child-profiles.test.ts`):
```typescript
describe('Task templates integration (ACT-01, ACT-03)', () => {
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

  // ... testes
})
```

---

## Shared Patterns

### Autenticação (aplicar a todos os route handlers)

**Source:** `src/app/api/families/children/route.ts` linhas 16–24 e `src/lib/auth/authorization.ts` linhas 34–57

```typescript
const session = await auth()

let identity
try {
  identity = requireAuthenticatedIdentity(session)
} catch {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}
```

### Family membership lookup (aplicar a todos os route handlers e server components)

**Source:** `src/app/api/families/children/route.ts` linhas 35–45

```typescript
const [membership] = await db
  .select({ familyId: schema.familyMemberships.familyId })
  .from(schema.familyMemberships)
  .where(eq(schema.familyMemberships.identityId, identity.id))
  .limit(1)

if (!membership) {
  return NextResponse.json({ error: 'No family found.' }, { status: 400 })
}

const familyId = membership.familyId
// NUNCA confiar no family_id enviado pelo cliente — sempre derivar da sessão
```

### Error handling (aplicar a todos os route handlers)

**Source:** `src/app/api/families/children/route.ts` linhas 62–67

```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : 'Operation failed'
  return NextResponse.json({ error: message }, { status: 400 })
}
```

### Family scoping obrigatório em todas as queries (FAM-05)

**Source:** `src/lib/families/commands.ts` linhas 62–70 (padrão `and(eq(table.familyId, familyId), ...)`)

Todo `SELECT`, `UPDATE` e `DELETE` em `task_templates` DEVE incluir:
```typescript
.where(and(
  eq(schema.taskTemplates.familyId, familyId),  // SEMPRE presente
  // ... outras condições
))
```

### Server component auth guard (aplicar a todas as pages)

**Source:** `src/app/family/children/page.tsx` linhas 16, 25–48

```typescript
export const dynamic = 'force-dynamic'

export default async function PageName() {
  const session = await auth()
  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, identity.id))
    .limit(1)

  if (!membership) redirect('/family/onboarding')
  const familyId = membership.familyId
  // ...
}
```

---

## No Analog Found

Nenhum arquivo sem analog. Todos os 9 arquivos têm correspondência direta no codebase existente.

---

## Metadata

**Analog search scope:** `src/app/api/families/`, `src/lib/`, `src/modules/`, `tests/`
**Files scanned:** 12
**Pattern extraction date:** 2026-06-07
