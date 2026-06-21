---
phase: 02-authentication
plan: 03
subsystem: auth
tags: [server-action, pin-verification, brute-force, cookie, ssr, profile-selection]

# Dependency graph
requires:
  - 02-01 (child-pin.ts verifyPin, child-session.ts checkBruteForce/recordFailedAttempt/resetAttempts/signChildSession)
provides:
  - verifyChildPin(childId, pin) Server Action em src/app/actions/child-auth.ts
  - ProfileCard({ childId, displayName, accentColor }) em src/components/auth/profile-card.tsx
  - /family/access/[familyId] SSR page em src/app/family/access/[familyId]/page.tsx
affects:
  - 02-04 (tela de PIN consome verifyChildPin; link "Trocar perfil" navega para /family/access/[familyId])

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "'use server' na primeira linha de todo arquivo em src/app/actions/ (Pitfall 5)"
    - "await cookies() assíncrono no Next.js 15+ (Pitfall 4)"
    - "Query única busca pinHash + familyId para evitar 2 roundtrips ao DB"
    - "params como Promise no Next.js 15+ — await params em Server Components"
    - "ProfileCard usa onMouseEnter/Leave para ring dinâmico (compatível com SSR)"

key-files:
  created:
    - src/app/actions/child-auth.ts
    - src/components/auth/profile-card.tsx
    - src/app/family/access/[familyId]/page.tsx
  modified: []

key-decisions:
  - "Otimização vs RESEARCH: query única busca pinHash E familyId (1 DB roundtrip vs 2 no padrão do PATTERNS.md)"
  - "URL canônica /family/access/[familyId] confirma decisão do 02-02 — alinhada com middleware.test.ts Test 10"
  - "ProfileCard usa inline style para ring dinâmico (não CSS class) — evita conflito com Tailwind purge"

patterns-established:
  - "Pattern: Server Action = 'use server' + await cookies() (não import síncrono)"
  - "Pattern: SSR page com params Promise — const { id } = await params"
  - "Pattern: inicial do avatar derivada de displayName.charAt(0) (campo avatarInitial não existe no schema)"

requirements-completed: [CAUTH-04]

# Metrics
duration: 3min
completed: 2026-06-21
---

# Phase 02 Plan 03: Server Action verifyChildPin + Tela de Seleção de Perfil — Summary

**Server Action verifyChildPin com brute-force e cookie child-session httpOnly, mais tela SSR /family/access/[familyId] com ProfileCards clicáveis que navegam para /child/[childId]/login**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-21T12:27:21Z
- **Completed:** 2026-06-21T12:30:04Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- `child-auth.ts`: Server Action verifyChildPin — checkBruteForce → busca pinHash+familyId (1 query) → verifyPin bcrypt → signChildSession → cookie child-session httpOnly/sameSite:lax/secure-em-prod/maxAge 8h; retornos discriminados {success:true}|{error:'blocked'|'no-pin'|'invalid'}
- `profile-card.tsx`: Client Component com avatar circle 72px gradiente verde, inicial derivada de displayName.charAt(0), hover scale(0.96) + ring 3px, navega para /child/[childId]/login via Link
- `page.tsx`: Server Component SSR (Next.js 15 params Promise), query Drizzle por familyId, grid 2 colunas para >=3 crianças / 1 coluna para 1-2, título "Quem está aqui?", estado vazio amigável

## Task Commits

1. **Task 1: verifyChildPin Server Action** — `f9b7ef5`
2. **Task 2: ProfileCard + /family/access/[familyId] page** — `a90f32e`

## Files Created/Modified

- `src/app/actions/child-auth.ts` — 'use server'; verifyChildPin com brute-force, query única pinHash+familyId, cookie httpOnly (D-14)
- `src/components/auth/profile-card.tsx` — 'use client'; avatar 72px, inicial derivada de displayName, hover ring, Link para /child/${childId}/login
- `src/app/family/access/[familyId]/page.tsx` — Server Component SSR; await params; query childProfiles WHERE familyId; grid responsivo

## Decisions Made

1. **Query única vs 2 queries:** O PATTERNS.md mostrava 2 queries separadas (uma para pinHash, outra para familyId). Consolidado numa única query que busca ambos os campos — reduz latência e simplifica a lógica.

2. **URL /family/access/[familyId] confirmada:** Alinhado com middleware.test.ts Test 10 e com a decisão registrada no 02-02. D-02 do CONTEXT.md tinha `/family/[familyId]/select-profile` mas os testes definem `/family/access/[familyId]` como URL pública (sem autenticação).

3. **Ring via inline style (não classe Tailwind):** O hover ring `0 0 0 3px rgba(62,107,79,.3)` foi implementado via `onMouseEnter/Leave + inline style` para garantir compatibilidade com Tailwind v4 purge e evitar conflito com classes geradas dinamicamente.

## Deviations from Plan

### Auto-fixed Issues

Nenhum — plano executado exatamente conforme especificado.

**Nota de alinhamento:** O plano Task 2 mencionava `avatarPreset` nos campos da query, mas o PLAN também especificou usar apenas id/displayName/accentColor (pois avatarPreset não é usado no ProfileCard desta fase — a inicial é derivada de displayName). Query implementada com os 3 campos necessários.

## Threat Surface Scan

Nenhuma nova superfície de ameaça introduzida além das documentadas no threat_model do plano:

- `T-02-PIN-BF2`: Mitigado — checkBruteForce antes de verificar (5 tentativas, D-09)
- `T-02-COOKIE-THEFT`: Mitigado — httpOnly + sameSite:lax + secure em prod (D-14)
- `T-02-ENUM-CHILD`: Aceito — tela kiosk expõe nomes por design; query seleciona apenas id/displayName/accentColor (sem pinHash)
- `T-02-PIN-PLAINTEXT`: Mitigado — PIN em plaintext apenas no Server Action (HTTPS em prod), verificado por bcrypt.compare

## Known Stubs

Nenhum — os 3 arquivos estão completamente implementados e ligados corretamente.

## Verification

- `pnpm tsc --noEmit`: sem erros em child-auth.ts, profile-card.tsx e family/access/[familyId]/page.tsx
- 38/38 testes unitários dos módulos 02-01 passando sem regressão (child-auth-endpoint, child-pin-management, child-session-guard, middleware)
- Verificação visual ocorrerá no 02-04 com o fluxo completo de PIN

## Self-Check: PASSED

- FOUND: src/app/actions/child-auth.ts
- FOUND: src/components/auth/profile-card.tsx
- FOUND: src/app/family/access/[familyId]/page.tsx
- Commit f9b7ef5 verificado (verifyChildPin Server Action)
- Commit a90f32e verificado (ProfileCard + select-profile page)
- TypeScript sem erros nos arquivos criados
- 38/38 testes de regressão passando

---
*Phase: 02-authentication*
*Completed: 2026-06-21*
