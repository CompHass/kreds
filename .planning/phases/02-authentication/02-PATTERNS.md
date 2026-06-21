# Phase 2: Authentication — Pattern Map

**Mapped:** 2026-06-20
**Files analyzed:** 16 new files + 1 existing file verified
**Analogs found:** 4 / 16 (projeto novo — a maioria são os primeiros do seu tipo)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/families/child-session.ts` | utility/service | request-response | `auth.ts` (JWT pattern) | partial — mesma intenção JWT, stack diferente (jose vs next-auth) |
| `src/lib/families/child-pin.ts` | utility | transform | `auth.ts` (crypto pattern) | partial — bcrypt exist; no direct analog |
| `src/lib/auth/child-guard.ts` | utility | request-response | — | no analog |
| `src/middleware.ts` | middleware | request-response | — | no analog (primeiro middleware do projeto) |
| `src/app/actions/child-auth.ts` | service/action | request-response | — | no analog (primeiro Server Action do projeto) |
| `src/app/api/auth/[...nextauth]/route.ts` | route | request-response | — | no analog (primeira route handler do projeto) |
| `src/app/(child)/child/[childId]/login/page.tsx` | component/page | event-driven | `src/app/page.tsx` | partial — mesmo layout shell, conteúdo diferente |
| `src/app/family/[familyId]/select-profile/page.tsx` | component/page | CRUD (SSR read) | `src/app/page.tsx` | partial — mesmo layout shell |
| `src/app/login/page.tsx` | component/page | request-response | `src/app/page.tsx` | partial — mesmo layout shell |
| `src/app/login/reset/page.tsx` | component/page | request-response | `src/app/page.tsx` | partial — mesmo layout shell |
| `src/components/auth/profile-card.tsx` | component | event-driven | — | no analog |
| `src/components/auth/pin-dot.tsx` | component | event-driven | — | no analog |
| `src/components/auth/pin-dots.tsx` | component | event-driven | — | no analog |
| `src/components/auth/numeric-keypad.tsx` | component | event-driven | — | no analog |
| `src/components/auth/gate-lock.tsx` | component | event-driven | — | no analog |
| `src/components/auth/guardian-login-form.tsx` | component | request-response | — | no analog |
| `src/components/auth/social-auth-buttons.tsx` | component | request-response | — | no analog |
| `src/components/auth/auth-input.tsx` | component | event-driven | — | no analog |
| `src/components/auth/spinner-button.tsx` | component | event-driven | — | no analog |
| `src/components/auth/password-reset-form.tsx` | component | request-response | — | no analog |

---

## Pattern Assignments

### `src/lib/families/child-session.ts` (utility, JWT sign/verify)

**Analog:** `auth.ts` — JWT callbacks e crypto pattern. **Contrato definitivo:** `tests/unit/child-auth-endpoint.test.ts`.

**Imports pattern** — copiar de `auth.ts` linhas 1-6 e adaptar:
```typescript
import 'server-only'
import { SignJWT, jwtVerify, decodeJwt } from 'jose'
```

**Core JWT pattern** — extraído do RESEARCH.md Pattern 1 (validado contra `tests/unit/child-auth-endpoint.test.ts`):
```typescript
const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)

export async function signChildSession(payload: {
  childProfileId: string
  familyId: string
  role: 'child'
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyChildSession(token: string): Promise<{
  childProfileId: string
  familyId: string
  role: 'child'
}> {
  const { payload } = await jwtVerify(token, secret)
  return payload as { childProfileId: string; familyId: string; role: 'child' }
}
```

**Brute force pattern** — extraído de RESEARCH.md Pattern 2 (validado contra `tests/unit/child-auth-endpoint.test.ts` linhas 63-87):
```typescript
const MAX_ATTEMPTS = 5
const attempts = new Map<string, number>()

export function checkBruteForce(childId: string): { blocked: boolean; attemptsLeft: number } {
  const count = attempts.get(childId) ?? 0
  return { blocked: count >= MAX_ATTEMPTS, attemptsLeft: Math.max(0, MAX_ATTEMPTS - count) }
}

export function recordFailedAttempt(childId: string): void {
  attempts.set(childId, (attempts.get(childId) ?? 0) + 1)
}

export function resetAttempts(childId: string): void {
  attempts.delete(childId)
}
```

---

### `src/lib/families/child-pin.ts` (utility, transform)

**Analog:** Sem analog direto — `auth.ts` usa next-auth para crypto. **Contrato definitivo:** `tests/unit/child-pin-management.test.ts`.

**Imports pattern:**
```typescript
import 'server-only'
import bcrypt from 'bcryptjs'
```

**Core pattern** — extraído de RESEARCH.md Code Examples:
```typescript
const COST_FACTOR = 10

export function validatePinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, COST_FACTOR)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
```

---

### `src/lib/auth/child-guard.ts` (utility, request-response)

**Analog:** Sem analog. **Contrato definitivo:** `tests/unit/child-session-guard.test.ts`.

**Imports pattern:**
```typescript
import 'server-only'
```

**Core pattern** — extraído de RESEARCH.md Code Examples:
```typescript
interface ChildSession {
  childProfileId: string
  familyId: string
  role: 'child'
}

export function validateChildSessionScope(
  session: ChildSession | null | { childProfileId: string; familyId: string; role: string },
  requestedChildId: string
): boolean {
  if (!session) return false
  if (session.role !== 'child') return false
  return session.childProfileId === requestedChildId
}

export function extractChildProfileId(session: ChildSession): string {
  return session.childProfileId
}

export function extractFamilyId(session: ChildSession): string {
  return session.familyId
}
```

---

### `src/middleware.ts` (middleware, request-response)

**Analog:** Sem analog — primeiro middleware do projeto. **Contrato definitivo:** `tests/unit/middleware.test.ts` (14 cenários, linhas 61-236).

**Imports pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, decodeJwt } from 'jose'
```

**Core pattern** — extraído de RESEARCH.md Pattern 3 (validado contra cada describe block de `middleware.test.ts`):
```typescript
const CHILD_SESSION_COOKIE = 'child-session'

// Tests 6, 8 vs HTTPS section — cookie name muda por protocolo
function nextAuthCookieName(url: string): string {
  return url.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token'
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const url = req.url

  // Tests 9, 10, 11, 12 — rotas públicas pass-through
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/child/') ||
    pathname.startsWith('/family/access/')
  ) {
    return NextResponse.next()
  }

  // Tests 1-4 + Invalid role test — proteção /child/*
  if (pathname.startsWith('/child/')) {
    const cookieValue = req.cookies.get(CHILD_SESSION_COOKIE)?.value
    if (!cookieValue) return NextResponse.redirect(new URL('/', req.url))

    try {
      const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
      const { payload } = await jwtVerify(cookieValue, secret)
      if (payload.role !== 'child') {
        const familyId = (payload as any).familyId
        return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
      }
      return NextResponse.next()
    } catch {
      // Test 3 — token expirado mas familyId decodificável
      try {
        const decoded = decodeJwt(cookieValue)
        const familyId = (decoded as any).familyId
        if (familyId) return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
      } catch { /* malformed */ }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Tests 5-8 — proteção /family/* (exceto /family/access/*) e /guardian/*
  if (pathname.startsWith('/family/') || pathname.startsWith('/guardian/')) {
    const nextAuthCookie = nextAuthCookieName(url)
    const sessionToken = req.cookies.get(nextAuthCookie)?.value
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/api/auth/signin', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|sw\\.?js).*)'],
}
```

---

### `src/app/actions/child-auth.ts` (service/action, request-response)

**Analog:** Sem analog — primeiro Server Action do projeto.

**Imports pattern — copiar convenção de caminho de `auth.ts` linhas 3-6:**
```typescript
'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkBruteForce, recordFailedAttempt, resetAttempts, signChildSession } from '@/lib/families/child-session'
import { verifyPin } from '@/lib/families/child-pin'
```

**Core pattern** — Drizzle select igual ao padrão de `auth.ts` linhas 48-56:
```typescript
export async function verifyChildPin(childId: string, pin: string) {
  const bf = checkBruteForce(childId)
  if (bf.blocked) return { error: 'blocked' as const }

  const [child] = await db.select({ pinHash: childProfiles.pinHash })
    .from(childProfiles)
    .where(eq(childProfiles.id, childId))
    .limit(1)

  if (!child?.pinHash) return { error: 'no-pin' as const }

  const valid = await verifyPin(pin, child.pinHash)
  if (!valid) {
    recordFailedAttempt(childId)
    return { error: 'invalid' as const }
  }

  const [profile] = await db.select({ familyId: childProfiles.familyId })
    .from(childProfiles)
    .where(eq(childProfiles.id, childId))
    .limit(1)

  const jwt = await signChildSession({ childProfileId: childId, familyId: profile.familyId, role: 'child' })
  resetAttempts(childId)

  // PITFALL #4: cookies() é async no Next.js 15+
  const cookieStore = await cookies()
  cookieStore.set('child-session', jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60,
  })

  return { success: true as const }
}
```

---

### `src/app/api/auth/[...nextauth]/route.ts` (route, request-response)

**Analog:** `auth.ts` (raiz do projeto) — este arquivo apenas re-exporta os handlers.

**Full file content** — copiar exatamente:
```typescript
import { handlers } from '@/../../../auth'
export const { GET, POST } = handlers
```

> Nota: O alias `@` aponta para `src/`, portanto a importação do `auth.ts` raiz precisa de caminho relativo. Verificar `tsconfig.json` para confirmar o caminho exato antes de implementar.

---

### `src/app/(child)/child/[childId]/login/page.tsx` (component/page, event-driven)

**Analog:** `src/app/page.tsx` (linhas 1-7) — padrão de Server Component page sem `'use client'`.

**Layout shell pattern — copiar de `src/app/page.tsx`:**
```tsx
// Server Component — sem 'use client'
export default function ChildLoginPage({ params }: { params: { childId: string } }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-kreds-bg">
      {/* PinScreen é 'use client' — importado aqui */}
    </main>
  )
}
```

**Font pattern — copiar de `src/app/layout.tsx` linhas 1-3:**
```typescript
import type { Metadata } from 'next'
// Plus Jakarta Sans já está no RootLayout — não replicar
```

---

### `src/app/family/[familyId]/select-profile/page.tsx` (component/page, CRUD SSR read)

**Analog:** `src/app/page.tsx` + `src/lib/db/index.ts` para Drizzle select.

**Drizzle pattern — copiar de `auth.ts` linhas 48-56:**
```typescript
// SSR: buscar child profiles para esta família
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Dentro do Server Component:
const children = await db.select({
  id: childProfiles.id,
  displayName: childProfiles.displayName,
  avatarPreset: childProfiles.avatarPreset,
  accentColor: childProfiles.accentColor,
})
  .from(childProfiles)
  .where(eq(childProfiles.familyId, params.familyId))
```

> DECISÃO DE URL: O middleware.test.ts Test 10 define `/family/access/[familyId]` como rota pública. O CONTEXT.md D-02 define `/family/[familyId]/select-profile`. O planner DEVE resolver essa discrepância. Recomendação: usar `/family/access/[familyId]` como URL canônica (alinhado com os 14 testes do middleware), criando a page em `src/app/family/access/[familyId]/page.tsx`.

---

### `src/app/login/page.tsx` (component/page, request-response)

**Analog:** `src/app/page.tsx` — shell de Server Component.

**Auth pattern — extraído de `auth.ts` linhas 8 (exports usados nos forms):**
```typescript
// O GuardianLoginForm importa signIn de auth.ts via:
// import { signIn } from '@/../../../auth'  (ou wrapper 'use server')
// D-05: identity_provider_hint
// signIn('zitadel', {}, { identity_provider: 'google' })
// signIn('zitadel', {}, { identity_provider: 'apple' })
```

---

### `src/app/login/reset/page.tsx` (component/page, request-response)

**Analog:** `src/app/page.tsx` — shell de Server Component. Sem analog de reset flow.

---

### Componentes em `src/components/auth/` (components, event-driven)

**Analog:** Sem analog de componentes no projeto — primeiros componentes. Todos devem seguir:

**Client Component pattern — declaração obrigatória:**
```tsx
'use client'
import { useState } from 'react'
```

**Animation classes pattern — extraído de `src/app/globals.css` linhas 42-121:**
```tsx
// Shake no erro de PIN — class CSS definida em globals.css
// --animate-kreds-shake: kredsShake 0.5s cubic-bezier(.36,.07,.19,.97)
// Aplicar via className inline style ou classe utilitária Tailwind:
<div style={{ animation: error ? 'var(--animate-kreds-shake)' : undefined }} />

// Sprout por dot preenchido
// --animate-kreds-sprout: kredsSprout 0.45s cubic-bezier(.2,.85,.3,1.3)

// Breathing para elementos de fundo
// --animate-kreds-breath: kredsBreath 5s ease-in-out infinite

// Spinner durante loading
// --animate-kreds-spin: kredsSpin 0.7s linear infinite
```

**GateLock pattern — extraído de RESEARCH.md Code Examples:**
```tsx
'use client'
export function GateLock({ open }: { open: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="kreds-gateL absolute top-0 left-0 w-1/2 h-full bg-[#27372C]"
        style={{
          transform: open ? 'translateX(-101%)' : 'translateX(0)',
          transition: 'transform 1s cubic-bezier(.76,0,.24,1)',
        }}
      />
      <div
        className="kreds-gateR absolute top-0 right-0 w-1/2 h-full bg-[#27372C]"
        style={{
          transform: open ? 'translateX(101%)' : 'translateX(0)',
          transition: 'transform 1s cubic-bezier(.76,0,.24,1)',
        }}
      />
    </div>
  )
}
```

---

## Shared Patterns

### Drizzle DB Query (select com eq + limit)
**Source:** `auth.ts` linhas 48-56
**Apply to:** `src/app/actions/child-auth.ts`, `src/app/family/[familyId]/select-profile/page.tsx`
```typescript
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'

// Padrão: desestruturar primeiro elemento do array
const [row] = await db
  .select({ id: schema.TABLE.id })
  .from(schema.TABLE)
  .where(eq(schema.TABLE.column, value))
  .limit(1)
```

### Path Alias `@/`
**Source:** `auth.ts` linha 3 (`@/lib/env`), `src/app/layout.tsx` linha 2
**Apply to:** Todos os arquivos em `src/`
```typescript
// CORRETO: usar @/ para imports dentro de src/
import { db } from '@/lib/db'
import { env } from '@/lib/env'

// ATENÇÃO: auth.ts está na raiz — não em src/
// Importar de dentro de src/app/ requer caminho relativo:
// import { handlers } from '@/../../../auth'
// Confirmar no tsconfig.json antes de implementar
```

### Server-Only Guard
**Source:** `tests/unit/child-auth-endpoint.test.ts` linha 5 (`vi.mock('server-only')`)
**Apply to:** `src/lib/families/child-session.ts`, `src/lib/families/child-pin.ts`, `src/lib/auth/child-guard.ts`
```typescript
import 'server-only'
// Deve ser a primeira linha do arquivo (após shebang se houver)
```

### Tailwind Color Tokens
**Source:** `src/app/page.tsx` linha 2 (`text-kreds-primary`), `src/app/layout.tsx` linha 7 (`bg-kreds-bg`)
**Apply to:** Todos os componentes e pages
```tsx
// Tokens de cor Kreds já definidos no Tailwind config:
// bg-kreds-bg        — background principal
// text-kreds-primary — cor primária
// bg-[#3E6B4F]       — PIN dot preenchido (CONTEXT.md §Specifics)
// bg-[#D8916B]       — PIN dot erro (CONTEXT.md §Specifics)
// bg-[#27372C]       — painéis do gate (CONTEXT.md §Specifics)
// bg-[#4F9B57]       — botão do responsável (CONTEXT.md §Specifics)
```

### Font Setup
**Source:** `src/app/layout.tsx` linhas 2-11
**Apply to:** Todos os componentes (já herdado via RootLayout — não replicar no nível de page/component)
```typescript
// Plus Jakarta Sans já está em RootLayout via variable --font-plus-jakarta
// NÃO importar next/font/google novamente em subpages
// Usar className="font-sans" (mapeado para --font-plus-jakarta no Tailwind)
```

### Zod Env Validation
**Source:** `src/lib/env.ts` linhas 9 (`CHILD_SESSION_SECRET`)
**Apply to:** `src/lib/families/child-session.ts`
```typescript
// CHILD_SESSION_SECRET já está no schema de env.ts (linha 9):
// CHILD_SESSION_SECRET: z.string().min(32),
// Importar env ao invés de process.env diretamente quando possível
// (mas middleware Edge não pode importar env.ts — usar process.env diretamente)
```

---

## No Analog Found

Arquivos sem correspondente próximo na base de código (planner deve usar os contratos dos testes e RESEARCH.md):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/middleware.ts` | middleware | request-response | Primeiro middleware do projeto |
| `src/app/actions/child-auth.ts` | service/action | request-response | Primeiro Server Action do projeto |
| `src/components/auth/*.tsx` (10 componentes) | component | event-driven | Primeiros componentes React do projeto |
| `src/app/api/auth/[...nextauth]/route.ts` | route | request-response | Primeira route handler do projeto |

---

## Critical Decisions for Planner

### URL da seleção de perfil (RESOLVER ANTES DE IMPLEMENTAR)
O `middleware.test.ts` Tests 5-6 protegem `/family/*` genericamente, mas Test 10 abre `/family/access/*`. O CONTEXT.md D-02 define `/family/[familyId]/select-profile`. Se a page ficar em `/family/[familyId]/select-profile`, o middleware (conforme os testes) vai redirecioná-la para `/api/auth/signin` — quebrando o modo kiosk.

**Recomendação do mapeador:** Implementar a page em `src/app/family/access/[familyId]/page.tsx` (alinhado com Test 10) e documentar no PLAN que D-02 foi ajustado para `/family/access/[familyId]`.

### Import de `auth.ts` raiz a partir de `src/`
O `auth.ts` está na raiz do projeto, fora de `src/`. Ao importá-lo de dentro de `src/app/api/auth/[...nextauth]/route.ts`, verificar `tsconfig.json` para o caminho correto antes de implementar.

---

## Metadata

**Analog search scope:** `/Users/hass/repos/github/comphass/kreds/src/`, `/Users/hass/repos/github/comphass/kreds/auth.ts`, `/Users/hass/repos/github/comphass/kreds/tests/unit/`
**Files scanned:** 10 arquivos de código fonte + 3 arquivos de teste
**Pattern extraction date:** 2026-06-20
