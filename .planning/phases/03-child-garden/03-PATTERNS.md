# Phase 3: Child Garden — Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 20 (13 componentes garden + page + schema + migração + seed DB + seed TS + 7 testes)
**Analogs found:** 17 / 20

---

## File Classification

| Arquivo Novo/Modificado | Role | Data Flow | Análogo Mais Próximo | Qualidade |
|-------------------------|------|-----------|----------------------|-----------|
| `src/app/(child)/child/[childId]/garden/page.tsx` | page (Server Component) | request-response | `src/app/(child)/child/[childId]/login/page.tsx` | exact |
| `src/components/garden/garden-view.tsx` | component (Client root) | event-driven | `src/components/auth/pin-screen.tsx` | role-match |
| `src/components/garden/garden-header.tsx` | component (display) | — | `src/components/auth/profile-card.tsx` | role-match |
| `src/components/garden/garden-hero.tsx` | component (display container) | — | `src/components/auth/pin-screen.tsx` (hero plant section) | partial |
| `src/components/garden/plant-stage.tsx` | component (display) | — | `src/components/auth/pin-dot.tsx` | role-match |
| `src/components/garden/water-tracker.tsx` | component (display) | — | `src/components/auth/pin-dots.tsx` | role-match |
| `src/components/garden/season-badge.tsx` | component (display) | — | `src/components/auth/pin-dot.tsx` | partial |
| `src/components/garden/speech-bubble.tsx` | component (display, animated) | — | `src/components/auth/gate-lock.tsx` (CSS var animation) | partial |
| `src/components/garden/harvest-button.tsx` | component (CTA, animated) | event-driven | `src/components/auth/spinner-button.tsx` | role-match |
| `src/components/garden/harvest-glow.tsx` | component (display, visual effect) | — | `src/components/auth/gate-lock.tsx` | partial |
| `src/components/garden/water-drops.tsx` | component (animation trigger) | event-driven | `src/components/auth/pin-dot.tsx` (kredsSprout CSS var) | partial |
| `src/components/garden/decorative-flowers.tsx` | component (conditional display) | — | `src/components/auth/gate-lock.tsx` | partial |
| `src/components/garden/celebration-overlay.tsx` | component (modal overlay) | event-driven | `src/components/auth/gate-lock.tsx` (fixed overlay) | role-match |
| `src/components/garden/confetti-field.tsx` | component (animation) | — | `src/components/auth/gate-lock.tsx` (repeated divs, CSS var) | partial |
| `src/lib/db/schema/index.ts` (MODIFY) | schema | CRUD | `src/lib/db/schema/index.ts` linha 211+ (wishlistGoals, simple table) | exact |
| `drizzle/0008_bible_verses.sql` (NEW via drizzle-kit) | migration | — | `drizzle/0007_tidy_cerise.sql` | exact |
| `drizzle/seed/bible-verses.sql` | seed (SQL) | batch | `drizzle/0007_tidy_cerise.sql` (estrutura SQL) | partial |
| `src/lib/seed/garden-seed.ts` | seed (TypeScript constants) | — | sem análogo direto | none |
| `tests/unit/garden-*.test.tsx` (7 arquivos) | test (unit, component) | — | `tests/unit/child-session-guard.test.ts` | role-match |
| `tests/unit/garden-stage.test.ts` | test (unit, pure function) | — | `tests/unit/ledger-calculate.test.ts` | exact |

---

## Pattern Assignments

### `src/app/(child)/child/[childId]/garden/page.tsx` (page, Server Component)

**Análogo:** `src/app/(child)/child/[childId]/login/page.tsx`

**Padrão de imports** (linhas 1–5 do análogo):
```typescript
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { PinScreen } from '@/components/auth/pin-screen'
```

**Padrão de Server Component async com params Promise** (linhas 7–11):
```typescript
export default async function ChildLoginPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params
```

**Padrão de query Drizzle** (linhas 14–21):
```typescript
const [child] = await db
  .select({
    displayName: childProfiles.displayName,
    familyId: childProfiles.familyId,
  })
  .from(childProfiles)
  .where(and(eq(childProfiles.id, childId), eq(childProfiles.active, true)))
  .limit(1)
```

**Aplicar para `garden/page.tsx`:** substituir query por `db.select().from(bibleVerses).orderBy(sql\`RANDOM()\`).limit(1)` e passar `verse` + constante de seed como props para `<GardenView>`.

---

### `src/components/garden/garden-view.tsx` (Client Component raiz, event-driven)

**Análogo:** `src/components/auth/pin-screen.tsx`

**Padrão de Client Component com estado** (linhas 1–21):
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ...

export function PinScreen({ childId, familyId, displayName }: PinScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [pending, setPending] = useState(false)
```

**Padrão de layout container** (linhas 69–80):
```typescript
return (
  <div
    style={{
      minHeight: '100vh',
      background: 'var(--color-kreds-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 48,
      paddingBottom: 48,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
```

**Padrão de handler com setTimeout para animação** (linhas 35–41):
```typescript
setGateOpen(true)
setTimeout(() => {
  router.push(`/child/${childId}/garden`)
}, 1100)
```

**Aplicar para `garden-view.tsx`:** usar `useState` para `tasks`, `waterTick`, `showPop`, `harvested`. Handler `handleTaskComplete` incrementa `waterTick` e dispara `showPop` com `setTimeout`. Handler `handleHarvest` seta `harvested = true`.

---

### `src/components/garden/garden-header.tsx` (component, display)

**Análogo:** `src/components/auth/profile-card.tsx`

**Padrão de avatar com gradiente e inicial** (linhas 24–37):
```typescript
<div
  className="flex items-center justify-center rounded-full select-none"
  style={{
    width: 72,
    height: 72,
    background: `linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)`,
    fontSize: 28,
    fontWeight: 700,
    color: '#ffffff',
  }}
>
  {initial}
</div>
```

**Padrão de tipografia com tokens CSS** (linhas 46–53):
```typescript
<span
  className="text-[12px] font-medium leading-[1.4]"
  style={{ color: 'var(--color-kreds-text)' }}
>
  {displayName}
</span>
```

**Aplicar para `garden-header.tsx`:** avatar `46×46px` com `border-radius: 15px` (design handoff). Badge de moedas é pill `bg var(--color-kreds-card)` com borda `var(--color-kreds-border)`. Coin value usa `color: var(--color-kreds-gold)`.

---

### `src/components/garden/garden-hero.tsx` (component, display container)

**Análogo:** `src/components/auth/pin-screen.tsx` — seção hero da planta (linhas 116–149)

**Padrão de animação CSS via variável** (linha 119):
```typescript
<div
  style={{
    marginBottom: 32,
    animation: 'var(--animate-kreds-breath)',
  }}
>
```

**Padrão de SVG com `aria-hidden`** (linhas 124–128):
```typescript
<svg
  width="80"
  height="100"
  viewBox="0 0 80 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
```

**Aplicar para `garden-hero.tsx`:** container `height: 316px`, `border-radius: 28px`, `overflow: hidden`, `position: relative`. Elementos filhos (sol, nuvens, morros, chão, planta) são `position: absolute`. Sol e nuvens usam `style={{ animation: 'var(--animate-kreds-sun)' }}` e `var(--animate-kreds-drift1/2)`.

---

### `src/components/garden/plant-stage.tsx` (component, display)

**Análogo:** `src/components/auth/pin-dot.tsx`

**Padrão de renderização condicional com animação CSS var** (linhas 43–44):
```typescript
style={{ animation: 'var(--animate-kreds-sprout)', position: 'absolute' }}
```

**Padrão de prop booleana controla visual** (linhas 8–19):
```typescript
const getBg = () => {
  if (error) return '#D8916B'
  if (filled) return '#3E6B4F'
  return 'transparent'
}
```

**Aplicar para `plant-stage.tsx`:** props `stage: 'a' | 'b' | 'c' | 'd'`, `droop: boolean`, `pop: boolean`. Usar `<img src={\`/garden/plant-${stage}.png\`} alt="Planta no estágio X" />` com `style={{ transform: droop ? 'translateX(-50%) rotate(-2.5deg)' : 'translateX(-50%)', transformOrigin: '50% 94%' }}`. `pop` aplica `style={{ animation: 'var(--animate-kreds-pop)' }}`.

---

### `src/components/garden/water-tracker.tsx` (component, display)

**Análogo:** `src/components/auth/pin-dots.tsx` (4 dots de estado)

O `pin-dots.tsx` renderiza N dots com prop booleana de preenchimento. Aplicar mesmo padrão:

**Padrão inferido de `pin-dot.tsx` aplicado a array de 4:**
```typescript
// water-tracker.tsx
interface WaterTrackerProps {
  filled: number // 0–4
}

export function WaterTracker({ filled }: WaterTrackerProps) {
  return (
    <div
      aria-label={`Tracker de água: ${filled} de 4 tarefas concluídas`}
      style={{ display: 'flex', gap: 6 }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < filled ? 'var(--color-kreds-water)' : 'rgba(255,255,255,.35)',
          }}
        />
      ))}
    </div>
  )
}
```

---

### `src/components/garden/season-badge.tsx` (component, display)

**Análogo:** `src/components/auth/profile-card.tsx` (pill/chip estilo)

**Padrão de pill/chip com borda** (linhas 20–32 adaptado):
```typescript
style={{
  background: 'var(--color-kreds-card)',
  border: '1px solid var(--color-kreds-border)',
  borderRadius: 'var(--radius-pill)',
  padding: '4px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}}
```

**Aplicar para `season-badge.tsx`:** dot colorido `8×8px borderRadius 50%` à esquerda, label texto `12px 700`. Cores por estação: primavera `#5A8A66`, verão `#E3C57C`, outono `#B5623F`, inverno `#6E9BA0`.

---

### `src/components/garden/speech-bubble.tsx` (component, display animado)

**Análogo:** `src/components/auth/gate-lock.tsx` — padrão de CSS var aplicada via `style` prop

**Padrão de animação CSS var via style prop** (linhas 14–18 do gate-lock):
```typescript
style={{
  transform: open ? 'translateX(0)' : 'translateX(-101%)',
  transition: open ? 'transform 1s cubic-bezier(.76,0,.24,1)' : 'none',
}}
```

**Aplicar para `speech-bubble.tsx`:** `visible` boolean controla `display`. Quando montado/visível, aplicar `style={{ animation: 'var(--animate-kreds-bubble)' }}` no elemento principal. Posição `absolute bottom: 60px`, centralizado horizontalmente.

---

### `src/components/garden/harvest-button.tsx` (CTA, animado)

**Análogo:** `src/components/auth/spinner-button.tsx`

**Padrão de botão com props de visibilidade/disabled:**

Botão com `visible` prop. Quando `visible = false`, `display: none`. Quando `visible = true`, gradiente `#C77F52 → #B5623F`, `border-radius: 999px`, `animation: var(--animate-kreds-fruit)`, `aria-label="Colher os frutos do jardim"`, `min-height: 44px` (WCAG touch target).

---

### `src/components/garden/harvest-glow.tsx` (visual effect, condicional)

**Análogo:** `src/components/auth/gate-lock.tsx`

**Padrão de overlay absoluto condicional** (linhas 7–29):
```typescript
export function GateLock({ open }: GateLockProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-101%)',
          ...
        }}
      />
    </div>
  )
}
```

**Aplicar para `harvest-glow.tsx`:** `position: absolute`, `pointer-events: none`, `border-radius: 50%`, `background: radial-gradient(circle, rgba(227,197,124,.4) 0%, transparent 70%)`, `opacity: visible ? 1 : 0`, `transition: opacity 0.4s ease`.

---

### `src/components/garden/water-drops.tsx` (animation trigger, remontagem por key)

**Análogo:** `src/components/auth/pin-dot.tsx` — kredsSprout via CSS var

**Padrão de CSS var animation aplicada** (linha 43):
```typescript
style={{ animation: 'var(--animate-kreds-sprout)', position: 'absolute' }}
```

**Aplicar para `water-drops.tsx`:** 5 divs `position: absolute`, espalhados horizontalmente. Cada um usa `style={{ animation: 'var(--animate-kreds-drop)', animationDelay: \`${i * 80}ms\` }}`. O componente é remontado via `key={waterTick}` no `garden-view.tsx` para re-executar a animação.

---

### `src/components/garden/decorative-flowers.tsx` (display condicional SVG)

**Análogo:** `src/components/auth/pin-dot.tsx` — SVG inline com `aria-hidden`

**Padrão de SVG inline com aria-hidden** (linhas 38–55):
```typescript
<svg
  width="80"
  height="100"
  viewBox="0 0 80 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  {/* paths SVG */}
</svg>
```

**Aplicar para `decorative-flowers.tsx`:** `visible` boolean controla `display`. Flores SVG inline, cor `var(--color-kreds-rose)` (`#C98AA0`), `position: absolute`, `aria-hidden="true"`.

---

### `src/components/garden/celebration-overlay.tsx` (modal overlay, event-driven)

**Análogo:** `src/components/auth/gate-lock.tsx` — fixed overlay sobre tudo

**Padrão de overlay fixed** (linhas 7–11):
```typescript
<div
  className="absolute inset-0 overflow-hidden pointer-events-none"
>
```

**Aplicar para `celebration-overlay.tsx`:** `position: fixed`, `inset: 0`, `z-index: 50`, `background: rgba(244,241,232,.98)`. Quando `visible = false`, `display: none`. Card do versículo com `animation: var(--animate-kreds-cele)`. Props: `visible: boolean`, `verse: { reference: string; text: string } | null`, `onClose: () => void`. Botão "Voltar ao jardim" como único elemento focável (`role="dialog"`, `aria-modal="true"`).

---

### `src/components/garden/confetti-field.tsx` (animation, array estático)

**Análogo:** `src/components/auth/gate-lock.tsx` — divs mapeados com CSS var

**Padrão de múltiplos divs com CSS var animation** — extraído do design dos painéis:
```typescript
// gate-lock usa 2 divs; confetti-field usa 20 — mesmo padrão de style prop
style={{
  animation: 'var(--animate-kreds-confetti)',
  animationDelay: c.delay,
  position: 'absolute',
}}
```

**Array estático (sem Math.random() em render):** constante fora do componente para evitar hydration mismatch. Ver Pattern 4 do RESEARCH.md.

---

### `src/lib/db/schema/index.ts` — MODIFICAR (adicionar `bibleVerses`)

**Análogo:** mesmo arquivo — padrão de `wishlistGoals` (tabela simples, linha 210–229)

**Padrão de tabela simples sem FK** (linhas 210–229):
```typescript
export const wishlistGoals = pgTable(
  'wishlist_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    // ...
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    childIdIdx: index('wishlist_goals_child_profile_id_idx').on(table.childProfileId),
  }),
)
```

**Padrão de imports já no arquivo** (linhas 1–15):
```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  // ...
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
```

**Aplicar para `bibleVerses`:** tabela sem FK (standalone), sem índices (tabela pequena), com `uuid PK`, `text reference`, `text text` (não `notNull()` edge case — ambos notNull), `timestamp created_at`. Adicionar no final do arquivo antes do último `export`. O `sql` import já existe na linha 15 — reusar para query RANDOM().

---

### `drizzle/0008_bible_verses.sql` (migração via drizzle-kit)

**Análogo:** `drizzle/0007_tidy_cerise.sql`

**Padrão de migração gerada** (linhas 1–13 do análogo):
```sql
CREATE TYPE "public"."donation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "donations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "family_id" uuid NOT NULL,
    ...
    CONSTRAINT "donation_amount_positive" CHECK ("donations"."amount_kreds" > 0)
);
--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT ...
```

**Ação:** NÃO escrever manualmente. Rodar `pnpm db:generate` após adicionar `bibleVerses` ao schema. O arquivo será gerado automaticamente em `drizzle/0008_*.sql`.

---

### `drizzle/seed/bible-verses.sql` (seed SQL com 7 versículos)

**Análogo:** estrutura SQL de `drizzle/0007_tidy_cerise.sql` (DDL), mas o seed é DML (INSERT)

**Padrão SQL:** usar `gen_random_uuid()` para IDs (padrão do projeto — visto em todas migrations). Inserir 7 versículos conforme listados no UI-SPEC §Bible Verses Seed.

---

### `src/lib/seed/garden-seed.ts` (constantes TypeScript)

**Análogo:** sem análogo direto no codebase

Usar padrão de constantes TypeScript com interfaces exportadas. Ver Code Examples do RESEARCH.md — estrutura completa já definida com `GardenSeed`, `GardenTask`, `SEED_STAGE_A..SEED_HARVESTED`.

---

### `tests/unit/garden-stage.test.ts` (test, pure function)

**Análogo:** `tests/unit/ledger-calculate.test.ts`

**Padrão exato de teste de função pura** (linhas 1–46):
```typescript
import { describe, it, expect } from 'vitest'
import {
  calculateFirstfruits,
  FIRSTFRUITS_RATE,
} from '../../src/modules/ledger/calculate'

describe('calculateFirstfruits', () => {
  it('returns 1 for amount 1', () => {
    expect(FIRSTFRUITS_RATE).toBe(0.10)
    expect(calculateFirstfruits(1)).toBe(1)
  })
  // ...
})
```

**Aplicar para `garden-stage.test.ts`:** importar `getPlantStage` de `../../src/lib/seed/garden-seed` (ou onde for definida). Testar: `getPlantStage(0,4) === 'a'`, `(1,4) === 'b'`, `(2,4) === 'c'`, `(3,4) === 'c'`, `(4,4) === 'd'`.

---

### `tests/unit/garden-*.test.tsx` (6 arquivos de componente)

**Análogo:** `tests/unit/child-session-guard.test.ts`

**Padrão de cabeçalho de teste unitário** (linhas 1–9):
```typescript
// @vitest-environment node   ← mudar para jsdom para componentes React
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

process.env.DATABASE_URL ??= 'https://example.com'
process.env.AUTH_SECRET ??= 'test-auth-secret'
```

**Para testes de componente React, adicionar:**
```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
```

**Padrão de describe/it** — copiar estrutura de `child-session-guard.test.ts` linhas 25–67. Cada `it()` testa um comportamento isolado. Sem `beforeEach` desnecessário — setup mínimo por describe.

---

## Shared Patterns

### Animações via CSS Variables
**Fonte:** `src/app/globals.css` linhas 42–56
**Aplicar a:** `garden-hero.tsx` (sol, nuvens), `plant-stage.tsx` (pop), `water-drops.tsx` (drop), `speech-bubble.tsx` (bubble), `harvest-button.tsx` (fruit), `celebration-overlay.tsx` (cele), `confetti-field.tsx` (confetti)

```typescript
// Padrão — NÃO usar className Tailwind para estas animações
// USAR style prop com variável CSS:
style={{ animation: 'var(--animate-kreds-sun)' }}
style={{ animation: 'var(--animate-kreds-drift1)' }}
style={{ animation: 'var(--animate-kreds-drop)', animationDelay: '80ms' }}
```

### Tokens de Design via CSS Variables
**Fonte:** `src/app/globals.css` linhas 4–22
**Aplicar a:** todos os componentes garden

```typescript
// Cores: var(--color-kreds-bg), var(--color-kreds-card), var(--color-kreds-text)
// var(--color-kreds-muted), var(--color-kreds-water), var(--color-kreds-rose)
// var(--color-kreds-gold), var(--color-kreds-coin), var(--color-kreds-orange)
// Sombras: var(--shadow-card), var(--shadow-cta)
// Border radius: var(--radius-card-lg), var(--radius-pill), var(--radius-card-md)
```

### Padrão de Componente Puramente Presentacional
**Fonte:** `src/components/auth/pin-dot.tsx` (sem 'use client' necessário para componentes só visuais)

Componentes sem estado e sem event handlers não precisam de `'use client'`. Apenas `garden-view.tsx` (root Client), `harvest-button.tsx` (onClick), `celebration-overlay.tsx` (onClose) precisam de `'use client'`.

### Padrão de `<img>` Simples (não next/image)
**Fonte:** RESEARCH.md Anti-Patterns — `pin-screen.tsx` usa SVG inline, não `<Image>` do next/image
**Aplicar a:** `plant-stage.tsx`

```typescript
<img
  src={`/garden/plant-${stage}.png`}
  alt={`Planta no estágio ${stage} — ${stageLabel[stage]}`}
  // SEM next/image — projeto usa <img> simples
/>
```

---

## No Analog Found

| Arquivo | Role | Data Flow | Motivo |
|---------|------|-----------|--------|
| `src/lib/seed/garden-seed.ts` | seed (TypeScript constants) | — | Nenhuma constante de seed TypeScript existe no projeto. Seguir estrutura definida no RESEARCH.md Code Examples. |

---

## Metadata

**Diretórios pesquisados:** `src/app/`, `src/components/auth/`, `src/lib/db/schema/`, `drizzle/`, `tests/unit/`, `src/app/globals.css`
**Arquivos lidos:** 14
**Data de mapeamento:** 2026-06-21
