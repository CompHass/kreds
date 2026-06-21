# Phase 2: Authentication — Research

**Researched:** 2026-06-20
**Domain:** Next.js App Router authentication — child PIN session (JWT/cookie) + guardian Zitadel OIDC + middleware route protection
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Seleção de Perfil da Criança**
- D-01: Incluir tela de seleção de perfil nesta Fase 2. Sem ela o fluxo da criança não é navegável no app real.
- D-02: URL pública: `/family/[familyId]/select-profile` — sem exigir login de responsável (modo kiosk/dispositivo compartilhado).
- D-03: Ao selecionar avatar → navega para `/child/[childId]/login`. Link "Trocar perfil" → volta para `/family/[familyId]/select-profile`.

**Login Social do Responsável**
- D-04: Google, Apple e Passkey operam via Zitadel federation — não como providers separados no NextAuth. `auth.ts` não muda.
- D-05: Botões Google e Apple são funcionais usando `identity_provider_hint`: `signIn('zitadel', {}, { identity_provider: 'google' })`.
- D-06: Botão Passkey chama `signIn('zitadel')` normalmente — Zitadel oferece passkey como opção interna.

**Backend de PIN da Criança**
- D-07: Verificação de PIN implementada como Server Action (não rota de API). Localização: `src/lib/families/child-session.ts` + Server Action em `src/app/actions/child-auth.ts`.
- D-08: Reconstruir `src/lib/families/child-session.ts` com contrato exato: `signChildSession`, `verifyChildSession`, `checkBruteForce`, `recordFailedAttempt`, `resetAttempts`.
- D-09: Brute force protection: in-memory Map. 5 tentativas antes do bloqueio.
- D-10: Hash do PIN: bcrypt, cost factor 10.
- D-11: JWT de sessão da criança assinado com `CHILD_SESSION_SECRET` (env var já referenciada nos testes). Algoritmo HS256.

**Arquitetura de Rotas e Middleware**
- D-12: Route groups: `src/app/(child)/` e `src/app/(guardian)/`. URLs: `/child/**` e `/guardian/**`. Rotas públicas: `/login`, `/family/[familyId]/select-profile`, `/child/[childId]/login`.
- D-13: Um único `middleware.ts` com branch por pathname prefix — child-session para `/child/**`, next-auth para `/guardian/**`.
- D-14: Cookie `child-session`: httpOnly, sameSite: lax, secure em produção.

### Claude's Discretion

- Layout visual da tela de seleção de perfil (lista de avatares) — seguir design system da Fase 1.
- Expiração do JWT de sessão da criança — valor razoável (ex: 8h ou fim do dia).

### Deferred Ideas (OUT OF SCOPE)

- Frame C (Card de Credenciais da Criança) — out-of-scope v2.0.
- Frame D (Criar Conta / Onboarding) — out-of-scope v2.0.
- Brute force persistido — não necessário agora.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAUTH-01 | Criança vê tela de PIN com 4 dots, teclado numérico 3×4, logo e plant hero animada | UI-SPEC Screen 2 + globals.css animações já implementadas |
| CAUTH-02 | Erro de PIN dispara animação shake nos dots e reseta automaticamente após 950ms | `kredsShake` keyframe existe em globals.css; reset via setTimeout |
| CAUTH-03 | PIN correto abre animação de portão (dois painéis + cubic-bezier 1s) revelando jardim | CSS transform em `.kreds-gateL`/`.kreds-gateR`, trigger após Server Action resolver |
| CAUTH-04 | Link "Trocar perfil" reseta completamente a tela de PIN | Clear state local + navigate para `/family/[familyId]/select-profile` |
| CAUTH-05 | Cada dot preenchido exibe SVG de brotinho com animação kredsSprout | `kredsSprout` keyframe existe; SVG inline por dot |
| GAUTH-01 | Responsável vê tela de login com campo e-mail, senha e botão Entrar via Zitadel OIDC | `signIn('zitadel')` de `auth.ts` já exportado |
| GAUTH-02 | Botões de login social (Google, Apple) e opção Passkey disponíveis | `identity_provider_hint` para Google/Apple (D-05); passkey via `signIn('zitadel')` (D-06) |
| GAUTH-03 | Checkbox "Lembrar-me" funcional com estilo customizado (verde `#3E6B4F`) | Controlled checkbox; não afeta next-auth session strategy |
| GAUTH-04 | Botão de login exibe spinner CSS branco durante loading | `kredsSpin` keyframe existe; estado loading controlado por `useFormStatus` ou useState |
| GAUTH-05 | Tela de redefinição de senha com form e estado de confirmação (e-mail mascarado + reenviar) | Chamada para Zitadel password-reset endpoint ou `signIn('zitadel')` com `prompt=none`; dois estados UI |
</phase_requirements>

---

## Summary

A Fase 2 implementa dois fluxos de autenticação completamente distintos: (1) criança com PIN de 4 dígitos via JWT personalizado em cookie `child-session`, e (2) responsável via Zitadel OIDC já configurado em `auth.ts`. O projeto já tem todas as dependências necessárias instaladas (`jose`, `bcryptjs`, `next-auth`), animações CSS implementadas (`kredsBreath`, `kredsShake`, `kredsSprout`) e o schema do banco com `pinHash` no lugar. O que falta são 4 módulos de código que os testes unitários existentes já definem o contrato:

1. `src/lib/families/child-session.ts` — sign/verify JWT + brute force (5 tentativas, in-memory Map)
2. `src/lib/families/child-pin.ts` — hashPin/verifyPin/validatePinFormat com bcrypt
3. `src/lib/auth/child-guard.ts` — validateChildSessionScope/extractChildProfileId/extractFamilyId
4. `src/middleware.ts` — middleware único com branch `/child/*` (child-session JWT) vs `/family/*`+`/guardian/*` (next-auth cookie)

Além disso, 4 páginas/telas precisam ser criadas: seleção de perfil, PIN da criança, login do responsável e redefinição de senha — todas seguindo o contrato visual do `02-UI-SPEC.md`.

**Descoberta crítica:** O `middleware.test.ts` usa `/family/access/[familyId]` como URL pública para a tela de seleção de perfil, mas o CONTEXT.md D-02 define `/family/[familyId]/select-profile`. Esta discrepância precisa ser resolvida antes de criar o middleware (ver Open Questions).

**Primary recommendation:** Implementar os 4 módulos de backend primeiro (satisfazem os testes existentes), depois o middleware, depois as 4 páginas em sequência.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Child PIN verification | API / Backend (Server Action) | — | D-07 locked: Server Action, não API route. Hash bcrypt server-side |
| Child session JWT sign/verify | API / Backend | — | Segredo `CHILD_SESSION_SECRET` nunca exposto ao browser |
| Brute force protection | API / Backend | — | in-memory Map no processo Node.js |
| Child session cookie set | API / Backend | Browser | Cookie httpOnly setado pelo Server Action; browser apenas armazena |
| Zitadel OIDC flow | API / Backend (next-auth) | — | `auth.ts` lida com OIDC, browser segue redirects |
| Route protection (child) | API / Backend (middleware) | — | Middleware Edge verifica `child-session` JWT antes de renderizar |
| Route protection (guardian) | API / Backend (middleware) | — | Middleware Edge verifica next-auth session cookie |
| PIN UI / animations | Browser / Client | — | React state para dots, shake, portão; animações CSS já em globals.css |
| Guardian login form | Browser / Client (+ Server Action) | — | Form no browser; submit via `signIn()` client-side ou Server Action |
| Profile selection screen | Browser / Client | Frontend Server (SSR) | Lista de perfis carregada server-side; interação no client |
| Password reset form | Browser / Client | — | Dois estados UI gerenciados no client; chamada OIDC para reset |

---

## Standard Stack

### Core (já instalado no projeto — zero instalação necessária)

| Library | Version instalada | Purpose | Por que usar |
|---------|------------------|---------|--------------|
| `jose` | 6.2.3 | JWT sign/verify para child-session | Já no projeto; usado no middleware.test.ts |
| `bcryptjs` | 3.0.3 | Hash e verificação de PIN | Já no projeto; D-10 define bcrypt |
| `next-auth` | 5.0.0-beta.31 | Sessão do responsável via Zitadel OIDC | Já configurado em `auth.ts`; não modificar |
| `server-only` | 0.0.1 | Marcar módulos como server-only | Todos os testes já fazem `vi.mock('server-only')` |
| `zod` | 4.4.3 | Validação de entrada em Server Actions | Já no projeto |

### Supporting (já instalado)

| Library | Version | Purpose | Quando usar |
|---------|---------|---------|-------------|
| `react-hook-form` | 7.77.0 | Form do responsável | Guardian login form + reset form |
| `@hookform/resolvers` | 5.0.1 | Integração zod + react-hook-form | Validação de e-mail/senha |
| `drizzle-orm` | 0.45.2 | Query para buscar childProfiles por familyId | Select profile screen + PIN verification |

**Nenhum pacote novo precisa ser instalado para esta fase.**

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `jose` (SignJWT) | `jsonwebtoken` | jsonwebtoken não está no projeto; jose é edge-compatible e já está instalado |
| `bcryptjs` | `argon2` | argon2 mais moderno mas não está instalado; bcryptjs já é dependência do projeto |
| Server Action para PIN | API Route | D-07 locked como Server Action |

---

## Package Legitimacy Audit

> Todos os packages desta fase já são dependências instaladas no projeto (package.json) — não há instalação de pacotes novos.

| Package | Registry | Age | Source Repo | Verdict | Disposition |
|---------|----------|-----|-------------|---------|-------------|
| `jose` | npm | ~12 anos (2014) | github.com/panva/jose | OK | Aprovado — já instalado |
| `bcryptjs` | npm | ~13 anos (2013) | github.com/dcodeIO/bcrypt.js | OK | Aprovado — já instalado |
| `next-auth` | npm | ~8 anos (2018) | github.com/nextauthjs/next-auth | OK | Aprovado — já instalado |

**Packages removed due to SLOP verdict:** nenhum
**Packages flagged as suspicious SUS:** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (mobile)
    │
    ├─ GET /family/[familyId]/select-profile (pública)
    │      └─ page.tsx SSR → db.select childProfiles WHERE familyId
    │              └─ ProfileCard[] → tap avatar → navigate /child/[childId]/login
    │
    ├─ GET /child/[childId]/login (pública)
    │      └─ PinScreen (client component)
    │              ├─ NumericKeypad → onDigit() → PinDots state
    │              ├─ 4 dígitos → Server Action: verifyChildPin(childId, pin)
    │              │       ├─ checkBruteForce(childId) → blocked? → return {error:'blocked'}
    │              │       ├─ db.select childProfiles.pinHash WHERE id=childId
    │              │       ├─ verifyPin(pin, pinHash) → false → recordFailedAttempt → return {error:'invalid'}
    │              │       └─ resetAttempts → signChildSession → cookies().set('child-session', jwt, opts)
    │              │                                              → return {success: true}
    │              ├─ error → PinDots shake (kredsShake 0.5s) → reset after 950ms
    │              └─ success → GateLock.open() → setTimeout 1100ms → router.push('/child/[id]/garden')
    │
    ├─ GET /login (pública — guardian login)
    │      └─ GuardianLoginForm (client component)
    │              ├─ email + senha → signIn('zitadel', {redirect:true, redirectTo:'/family'})
    │              ├─ Google → signIn('zitadel', {}, {identity_provider:'google'})
    │              ├─ Apple → signIn('zitadel', {}, {identity_provider:'apple'})
    │              └─ Passkey → signIn('zitadel')
    │
    ├─ GET /login/reset (pública — password reset)
    │      └─ PasswordResetForm (client component)
    │              └─ estado 1 (form) → Zitadel password reset → estado 2 (confirmação)
    │
    ├─ GET /child/** (protegido) ──→ middleware verifica child-session JWT
    │      └─ válido → NextResponse.next()
    │      └─ inválido/ausente → redirect /family/access/[familyId] ou /
    │
    └─ GET /guardian/** ou /family/** (protegido) ──→ middleware verifica next-auth cookie
           └─ válido → NextResponse.next()
           └─ ausente → redirect /api/auth/signin
```

### Recommended Project Structure

```
src/
├── middleware.ts                         # CRIAR — proteção de rotas (child + guardian)
├── lib/
│   ├── families/
│   │   ├── child-session.ts             # CRIAR — signChildSession, verifyChildSession, brute force
│   │   └── child-pin.ts                 # CRIAR — hashPin, verifyPin, validatePinFormat
│   └── auth/
│       └── child-guard.ts               # CRIAR — validateChildSessionScope, extractChildProfileId, extractFamilyId
├── app/
│   ├── actions/
│   │   └── child-auth.ts                # CRIAR — Server Action: verifyChildPin
│   ├── (child)/
│   │   └── child/
│   │       └── [childId]/
│   │           └── login/
│   │               └── page.tsx         # CRIAR — tela de PIN
│   ├── (guardian)/
│   │   └── guardian/                    # placeholder para fases futuras
│   ├── family/
│   │   └── [familyId]/
│   │       └── select-profile/
│   │           └── page.tsx             # CRIAR — seleção de perfil
│   ├── login/
│   │   ├── page.tsx                     # CRIAR — login responsável
│   │   └── reset/
│   │       └── page.tsx                 # CRIAR — redefinição de senha
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts             # CRIAR — handlers do next-auth v5
└── components/
    └── auth/
        ├── profile-card.tsx             # CRIAR
        ├── pin-dot.tsx                  # CRIAR
        ├── pin-dots.tsx                 # CRIAR
        ├── numeric-keypad.tsx           # CRIAR
        ├── gate-lock.tsx                # CRIAR
        ├── guardian-login-form.tsx      # CRIAR
        ├── social-auth-buttons.tsx      # CRIAR
        ├── auth-input.tsx               # CRIAR
        ├── spinner-button.tsx           # CRIAR
        └── password-reset-form.tsx      # CRIAR
```

### Pattern 1: Child Session JWT (jose SignJWT HS256)

**What:** JWT assinado com CHILD_SESSION_SECRET, verificado no middleware via jwtVerify.
**When to use:** Toda vez que precisar assinar ou verificar a sessão da criança.

```typescript
// Source: panva/jose docs + middleware.test.ts contract
import { SignJWT, jwtVerify, decodeJwt } from 'jose'

const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)

// signChildSession — contrato exato de child-auth-endpoint.test.ts
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

// verifyChildSession — lança Error para token inválido (contrato do teste)
export async function verifyChildSession(token: string): Promise<{
  childProfileId: string
  familyId: string
  role: 'child'
}> {
  const { payload } = await jwtVerify(token, secret)
  return payload as { childProfileId: string; familyId: string; role: 'child' }
}
```

### Pattern 2: Brute Force Protection (in-memory Map)

**What:** Map<childId, attemptCount> com máximo de 5 tentativas antes de bloquear.
**When to use:** checkBruteForce antes de verificar PIN; recordFailedAttempt em falha; resetAttempts em sucesso.

```typescript
// Source: child-auth-endpoint.test.ts contract (5 attempts = blocked, attemptsLeft=0)
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

### Pattern 3: Middleware com branch por prefix

**What:** `src/middleware.ts` com verificação JWT para child e cookie-check para guardian/family.
**When to use:** Proteção de todas as rotas `/child/*`, `/family/*` (exceto `/family/access/*`), `/guardian/*`.

```typescript
// Source: middleware.test.ts contract (12 test cases)
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, decodeJwt } from 'jose'

const CHILD_SESSION_COOKIE = 'child-session'

// HTTP vs HTTPS cookie name para next-auth
function nextAuthCookieName(url: string): string {
  return url.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token'
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const url = req.url

  // Rotas públicas explícitas — pass through
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/child/') ||
    pathname.startsWith('/family/access/')
  ) {
    return NextResponse.next()
  }

  // Proteção das rotas da criança
  if (pathname.startsWith('/child/')) {
    const cookieValue = req.cookies.get(CHILD_SESSION_COOKIE)?.value
    if (!cookieValue) return NextResponse.redirect(new URL('/', req.url))

    try {
      const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
      const { payload } = await jwtVerify(cookieValue, secret)
      if (payload.role !== 'child') {
        // Redireciona para /family/access/[familyId] se familyId decodificável
        const familyId = (payload as any).familyId
        return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
      }
      return NextResponse.next()
    } catch {
      // Token expirado mas decodificável → redireciona para family/access
      try {
        const decoded = decodeJwt(cookieValue)
        const familyId = (decoded as any).familyId
        if (familyId) return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
      } catch { /* malformed */ }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Proteção das rotas do responsável (/family/* exceto /family/access/*, /guardian/*)
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

### Pattern 4: Server Action para verificação de PIN

**What:** `src/app/actions/child-auth.ts` — Server Action que verifica PIN e seta cookie.
**When to use:** Chamado pelo componente de PIN ao completar 4 dígitos.

```typescript
// Source: D-07, D-08, D-09, D-10, D-11 de CONTEXT.md
'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkBruteForce, recordFailedAttempt, resetAttempts, signChildSession } from '@/lib/families/child-session'
import { verifyPin } from '@/lib/families/child-pin'

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

  // Buscar familyId para incluir no JWT
  const [profile] = await db.select({ familyId: childProfiles.familyId })
    .from(childProfiles)
    .where(eq(childProfiles.id, childId))
    .limit(1)

  const jwt = await signChildSession({ childProfileId: childId, familyId: profile.familyId, role: 'child' })
  resetAttempts(childId)

  const cookieStore = await cookies()
  cookieStore.set('child-session', jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 horas
  })

  return { success: true as const }
}
```

### Anti-Patterns to Avoid

- **Chamar `auth()` no middleware para verificar sessão da criança:** `auth()` só verifica next-auth sessions. Para child-session, usar `jwtVerify` com `CHILD_SESSION_SECRET`.
- **Usar `next/headers` cookies() no middleware:** O middleware tem acesso a `req.cookies` diretamente — `next/headers` não funciona no middleware Edge.
- **Hash do PIN no cliente:** O PIN nunca deve ser hashado no browser. O Server Action recebe o PIN em plaintext e verifica server-side.
- **Alterar `auth.ts`:** D-04 locked — auth.ts não muda. Google/Apple/Passkey são via Zitadel federation.
- **Verificar next-auth JWT cryptograficamente no middleware:** O middleware verifica apenas a presença do cookie (cookie-check heurístico), não decripta o JWT do next-auth (isso exigiria `AUTH_SECRET`). O middleware.test.ts confirma: presença do cookie = passa.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT sign/verify | função custom HMAC | `jose` SignJWT + jwtVerify | Timing attacks, edge runtime compat, já instalado |
| Password/PIN hashing | crypto.createHash('sha256') | `bcryptjs` hashSync com cost 10 | SHA não é resistente a brute force; bcrypt já instalado |
| OIDC login flow | custom OAuth 2.0 | `next-auth` v5 + Zitadel provider | PKCE, token refresh, nonce, já configurado em auth.ts |

**Key insight:** Todos os problemas de crypto/auth já têm solução instalada no projeto. Não há NADA que precise ser hand-rolled nesta fase.

---

## Common Pitfalls

### Pitfall 1: Discrepância de URL — select-profile vs family/access

**What goes wrong:** O CONTEXT.md D-02 define `/family/[familyId]/select-profile` como URL pública. Porém o `middleware.test.ts` define `/family/access/abc123` como rota pública (Test 10) — e protege `/family/*` genericamente (Tests 5 e 6). Se o middleware implementar `/family/[familyId]/select-profile` como rota pública sem corresponder à URL que os testes verificam, os testes passarão mas a rota real ficará protegida.

**Why it happens:** Os testes foram escritos com uma URL diferente da que o CONTEXT.md decidiu. Ou o CONTEXT.md precisa ser atualizado para `/family/access/[familyId]`, ou o middleware precisa de uma exceção adicional para `/family/[familyId]/select-profile`.

**How to avoid:** Ver Open Questions #1. O planner deve escolher: (a) implementar a rota de seleção em `/family/access/[familyId]` (alinhado com testes), ou (b) adicionar `/family/[familyId]/select-profile` como exceção no middleware E no test.

**Warning signs:** Middleware tests passam mas ao clicar em "Trocar perfil" no app real redireciona para /api/auth/signin.

### Pitfall 2: next-auth cookie name diferente em HTTP vs HTTPS

**What goes wrong:** O next-auth v5 usa `authjs.session-token` em HTTP e `__Secure-authjs.session-token` em HTTPS. Implementar com nome fixo quebra em produção (HTTPS) ou em dev (HTTP).

**Why it happens:** next-auth v5 aplica o prefixo `__Secure-` automaticamente em conexões HTTPS.

**How to avoid:** Middleware deve derivar o nome do cookie a partir de `req.url.startsWith('https')`. Ver Pattern 3 acima. O `middleware.test.ts` já tem testes para ambos (Tests 6, 8 vs HTTPS section).

**Warning signs:** Login do responsável funciona em `localhost:3000` (HTTP) mas não em produção (HTTPS).

### Pitfall 3: `decodeJwt` vs `jwtVerify` no middleware para token expirado

**What goes wrong:** `jwtVerify` lança erro em token expirado. O middleware precisa extrair `familyId` do payload expirado para redirecionar para `/family/access/[familyId]` (Test 3). Se apenas capturar o erro e redirecionar para `/`, a família perde o contexto.

**Why it happens:** Por segurança, `jwtVerify` rejeita tokens expirados. O `decodeJwt` da `jose` decodifica sem verificar — é adequado para extrair claims de tokens cujo payload já é irrelevante para segurança.

**How to avoid:** No catch do `jwtVerify`, usar `decodeJwt(cookieValue)` para extrair `familyId` e redirecionar para `/family/access/${familyId}`. Token malformado (não decodificável) → redirecionar para `/`.

**Warning signs:** Test 3 do middleware.test.ts falha: "should redirect to /family/access/[familyId] when token expired".

### Pitfall 4: `cookies()` é async no Next.js 15+

**What goes wrong:** Chamar `cookies().set(...)` sem `await` em Server Actions resulta em erro silencioso no Next.js 16.x (versão do projeto).

**Why it happens:** A API `next/headers` foi tornada assíncrona a partir do Next.js 15.

**How to avoid:** Sempre usar `const cookieStore = await cookies()` antes de chamar `.set()` ou `.get()`.

**Warning signs:** Cookie `child-session` não aparece no browser após login bem-sucedido.

### Pitfall 5: Server Actions requerem `'use server'` no topo do arquivo

**What goes wrong:** Server Actions sem a diretiva `'use server'` no topo do arquivo são tratadas como funções cliente e falham em produção.

**Why it happens:** O compilador do Next.js usa a diretiva para marcar funções como Server Actions.

**How to avoid:** Todo arquivo em `src/app/actions/` deve começar com `'use server'`. Módulos de lib com `server-only` devem importar `import 'server-only'` no topo.

---

## Code Examples

### Child Pin Module (child-pin.ts) — contrato dos testes

```typescript
// Source: tests/unit/child-pin-management.test.ts contract
import 'server-only'
import bcrypt from 'bcryptjs'

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

### Child Guard Module (child-guard.ts) — contrato dos testes

```typescript
// Source: tests/unit/child-session-guard.test.ts contract
import 'server-only'

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

### next-auth handlers route (rota que precisa existir)

```typescript
// Source: next-auth v5 docs — deve estar em src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/../../auth' // importa do auth.ts raiz
export const { GET, POST } = handlers
```

### Animação de portão — estrutura HTML/CSS

```tsx
// Source: 02-UI-SPEC.md + design_handoff_kreds/README.md §Frame A
// gate-lock.tsx — dois painéis de sobreposição
'use client'
export function GateLock({ open }: { open: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="kreds-gateL absolute top-0 left-0 w-1/2 h-full bg-[#27372C]"
        style={{ transform: open ? 'translateX(-101%)' : 'translateX(0)', transition: 'transform 1s cubic-bezier(.76,0,.24,1)' }}
      />
      <div
        className="kreds-gateR absolute top-0 right-0 w-1/2 h-full bg-[#27372C]"
        style={{ transform: open ? 'translateX(101%)' : 'translateX(0)', transition: 'transform 1s cubic-bezier(.76,0,.24,1)' }}
      />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/headers` cookies() síncrono | `await cookies()` assíncrono | Next.js 15 | Server Actions devem usar `await` |
| `getServerSideProps` para auth | `auth()` no Server Component ou middleware | Next.js 13+ App Router | Middleware protege rota antes de renderizar |
| `next-auth` v4 `getSession()` | `auth()` do next-auth v5 | next-auth 5 beta | Importar de `auth.ts` do projeto, não de `next-auth` |
| API Routes para mutações | Server Actions | Next.js 13.4+ | D-07 locked: PIN via Server Action |

**Deprecated/outdated:**
- `pages/api/auth/[...nextauth].ts`: O projeto usa App Router, a rota correta é `src/app/api/auth/[...nextauth]/route.ts` com `export const { GET, POST } = handlers`.
- `useSession()` do next-auth no servidor: Usar `auth()` server-side; `useSession()` é para Client Components que precisam do session state.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Expiração do JWT da criança: 8h (Claude's Discretion) | Standard Stack + Code Examples | Sessão expira muito cedo ou tarde; ajustável sem reescrever |
| A2 | URL de seleção de perfil nos testes (`/family/access/*`) é o contrato real que o middleware deve seguir — CONTEXT.md D-02 (`/family/[familyId]/select-profile`) pode precisar de exceção adicional | Common Pitfalls #1 | Ver Open Questions #1 — discrepância real que precisa ser resolvida |
| A3 | O GAUTH-05 (reset de senha) chama o endpoint de reset de senha do Zitadel via `signIn('zitadel', {}, { prompt: 'login' })` ou similar — não há SDK Zitadel explícito no projeto para isso | Architecture Patterns | Se o Zitadel não expor o endpoint esperado, tela de reset pode precisar de approach diferente |

---

## Open Questions (RESOLVED)

1. **Discrepância de URL para seleção de perfil** — RESOLVED
   - O que sabemos: CONTEXT.md D-02 define `/family/[familyId]/select-profile` como URL pública. `middleware.test.ts` Test 10 define `/family/access/abc123` como rota pública (sem cookie). Tests 5 e 6 protegem `/family/*` genericamente.
   - **Resolução:** Adotar `/family/access/[familyId]` como URL canônica da tela de seleção de perfil — alinha com o contrato dos testes existentes. CONTEXT.md D-02 tem discrepância com os testes; os testes são o contrato de implementação. Planner anotou no ROADMAP. A página fica em `src/app/family/access/[familyId]/page.tsx`.

2. **Redefinição de senha via Zitadel** — RESOLVED
   - O que sabemos: GAUTH-05 requer tela de reset com form de e-mail + estado de confirmação.
   - **Resolução:** Entregar dois estados UI locais (estado 1: form de e-mail; estado 2: confirmação com e-mail mascarado + botão "Reenviar e-mail"). A chamada ao Zitadel é um redirect externo — o deliverable verificável da Fase 2 é o UI de dois estados. Implementação de integração real com Zitadel password reset fica para fase de hardening. Verificação manual-only (VALIDATION.md registra isso).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `jose` (npm) | child-session JWT | ✓ | 6.2.3 | — |
| `bcryptjs` (npm) | PIN hashing | ✓ | 3.0.3 | — |
| `next-auth` (npm) | guardian OIDC | ✓ | 5.0.0-beta.31 | — |
| `CHILD_SESSION_SECRET` env var | child-session JWT | ✓ (testes já usam) | min 32 chars | — |
| `AUTH_ZITADEL_ID` / `AUTH_ZITADEL_SECRET` env var | guardian OIDC | ✓ (env.ts valida) | — | — |
| Zitadel instance | guardian login | [ASSUMED] disponível | — | Tela de login renderiza, OIDC flow falha |
| PostgreSQL + childProfiles com pinHash | PIN verification | ✓ (schema existe) | — | — |

**Missing dependencies with no fallback:** nenhuma
**Missing dependencies with fallback:** Zitadel instance assume-se disponível (app não funciona sem ela, mas telas podem ser desenvolvidas localmente sem Zitadel real).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` (raiz) |
| Quick run command | `pnpm test -- --reporter=verbose tests/unit/child-auth-endpoint.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAUTH-01..05 | PIN screen + animações | visual/manual | `pnpm test -- tests/unit/child-auth-endpoint.test.ts tests/unit/child-pin-management.test.ts` | ✅ existem (falham pq módulos não existem) |
| GAUTH-01..04 | Guardian login form | visual/manual | `pnpm test -- tests/unit/middleware.test.ts` | ✅ existe (falha pq middleware.ts não existe) |
| GAUTH-05 | Password reset form | visual/manual | — | — manual only |
| D-08 (child-session) | signChildSession, verifyChildSession, brute force | unit | `pnpm test -- tests/unit/child-auth-endpoint.test.ts` | ✅ Wave 0: criar `src/lib/families/child-session.ts` |
| D-10 (PIN hash) | hashPin, validatePinFormat, verifyPin | unit | `pnpm test -- tests/unit/child-pin-management.test.ts` | ✅ Wave 0: criar `src/lib/families/child-pin.ts` |
| D-13 (middleware) | 12 cenários de proteção de rotas | unit | `pnpm test -- tests/unit/middleware.test.ts` | ✅ Wave 0: criar `src/middleware.ts` |
| child-guard | validateChildSessionScope, extractChildProfileId, extractFamilyId | unit | `pnpm test -- tests/unit/child-session-guard.test.ts` | ✅ Wave 0: criar `src/lib/auth/child-guard.ts` |

### Sampling Rate

- **Per task commit:** `pnpm test -- tests/unit/child-auth-endpoint.test.ts tests/unit/child-pin-management.test.ts tests/unit/child-session-guard.test.ts tests/unit/middleware.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green antes do `/gsd-verify-work`

### Wave 0 Gaps

Os 4 módulos abaixo devem ser criados antes de executar qualquer outro task da fase:

- [ ] `src/lib/families/child-session.ts` — cobre `child-auth-endpoint.test.ts` (7 testes)
- [ ] `src/lib/families/child-pin.ts` — cobre `child-pin-management.test.ts` (9 testes)
- [ ] `src/lib/auth/child-guard.ts` — cobre `child-session-guard.test.ts` (6 testes)
- [ ] `src/middleware.ts` — cobre `middleware.test.ts` (12 testes)
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — handlers do next-auth v5 (sem teste unitário, necessário para GAUTH-01)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | next-auth v5 Zitadel OIDC para responsável; bcrypt PIN para criança |
| V3 Session Management | sim | JWT httpOnly cookie `child-session`; next-auth JWT session |
| V4 Access Control | sim | middleware protege `/child/*` e `/guardian/*` por sessão |
| V5 Input Validation | sim | `validatePinFormat` (regex `^\d{4,6}$`); zod nos forms do responsável |
| V6 Cryptography | sim | jose HS256 para JWT; bcrypt cost 10 para PIN — nunca hand-roll |

### Known Threat Patterns for auth stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| PIN brute force | Elevation of Privilege | in-memory Map, 5 tentativas, bloqueio por childId (D-09) |
| Session cookie theft | Spoofing | httpOnly + sameSite:lax + secure em produção (D-14) |
| JWT tampering | Tampering | jose jwtVerify valida assinatura HMAC-SHA256 |
| OIDC CSRF | Spoofing | next-auth v5 implementa state+PKCE nativamente |
| Timing attack em comparação de PIN | Information Disclosure | bcrypt.compare() constante no tempo (bcryptjs) |

---

## Sources

### Primary (HIGH confidence)

- `/panva/jose` (Context7) — SignJWT, jwtVerify, decodeJwt com HS256
- `/vercel/next.js` (Context7) — middleware JWT verification pattern, async cookies(), Server Actions
- `tests/unit/child-auth-endpoint.test.ts` — contrato exato de `src/lib/families/child-session.ts`
- `tests/unit/child-pin-management.test.ts` — contrato exato de `src/lib/families/child-pin.ts`
- `tests/unit/child-session-guard.test.ts` — contrato exato de `src/lib/auth/child-guard.ts`
- `tests/unit/middleware.test.ts` — contrato exato de `src/middleware.ts` (12 cenários)

### Secondary (MEDIUM confidence)

- `02-UI-SPEC.md` — contrato visual completo para todas as 4 telas
- `design_handoff_kreds/README.md` — especificação Frame A (PIN), Frame B (Guardian login), Frame E (Reset)
- `auth.ts` — configuração next-auth v5 existente (não modificar)
- `src/lib/db/schema/index.ts` — childProfiles com pinHash, familyId, displayName

### Tertiary (LOW confidence / ASSUMED)

- Comportamento do endpoint de reset de senha do Zitadel — [ASSUMED] baseado em conhecimento geral do Zitadel OIDC

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — todas as deps já estão instaladas; versões verificadas via npm view
- Architecture: HIGH — baseado nos contratos exatos dos testes e decisões locked no CONTEXT.md
- Pitfalls: HIGH — identificados diretamente nos testes e pela análise do código existente
- GAUTH-05 (reset senha): LOW — endpoint Zitadel não verificado nesta sessão

**Research date:** 2026-06-20
**Valid until:** 2026-08-20 (estável — next-auth v5 beta.31 fixo no package.json)
