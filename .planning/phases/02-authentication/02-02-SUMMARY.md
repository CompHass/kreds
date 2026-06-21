---
phase: 02-authentication
plan: 02
subsystem: auth
tags: [middleware, jwt, next-auth, jose, edge-runtime, route-protection]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: "02-01: child-pin.ts, child-session.ts, child-guard.ts — base criptográfica para JWT da criança"

provides:
  - "middleware.ts — Edge middleware único com branch por prefixo: /child/* via JWT HS256, /family/*+/guardian/* via cookie next-auth"
  - "[...nextauth]/route.ts — handlers GET/POST do next-auth v5 re-exportados de auth.ts"
  - "16 testes de proteção de rota passando (config.matcher, 12 cenários HTTP/HTTPS, role inválido)"

affects: [02-03, 02-04, 02-05, proteção de todas as rotas do app]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge middleware com branch por pathname prefix (não usar auth() nem next/headers)"
    - "Cookie name derivado de protocolo: HTTP usa authjs.session-token, HTTPS usa __Secure-authjs.session-token"
    - "decodeJwt no catch de jwtVerify para extrair familyId de token expirado (redirect contextual)"
    - "Re-export de handlers next-auth v5 via caminho relativo (auth.ts fora de src/)"

key-files:
  created:
    - src/app/api/auth/[...nextauth]/route.ts
  modified:
    - src/middleware.ts

key-decisions:
  - "D-URL: /family/access/[familyId] é a URL canônica da tela de seleção de perfil — testes do middleware são o contrato (Test 10 valida /family/access/*); D-02 do CONTEXT.md (select-profile) ajustado"
  - "D-13: um único middleware.ts com branch por prefixo — /child/* verifica JWT, /family/*+/guardian/* verifica cookie next-auth (cookie-check heurístico, não descriptografa)"
  - "D-04: auth.ts não modificado — route.ts apenas re-exporta handlers via caminho relativo"

patterns-established:
  - "Pattern: Middleware Edge não pode importar @/lib/env nem next/headers — usar process.env direto e req.cookies"
  - "Pattern: nextAuthCookieName(url) — derivar nome do cookie next-auth pelo protocolo da URL"
  - "Pattern: /family/access/ avaliado ANTES de /family/ nas condições de rota pública (ordem importa)"

requirements-completed: [GAUTH-01]

# Metrics
duration: 15min
completed: 2026-06-21
---

# Phase 02 Plan 02: Route Protection Middleware Summary

**Middleware Edge único com branch JWT para criança e cookie-check para responsável, mais route handler next-auth v5 re-exportando handlers de auth.ts via caminho relativo**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-21T09:18:00Z
- **Completed:** 2026-06-21T09:33:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `src/middleware.ts` com branch por prefixo: `/child/*` verifica JWT HS256 via jwtVerify/decodeJwt; `/family/*`+`/guardian/*` verifica presença de cookie next-auth (HTTP vs HTTPS); rotas públicas pass-through em ordem correta
- 16 cenários de `middleware.test.ts` todos passando: config.matcher, Tests 1-12, HTTPS, role inválido
- `src/app/api/auth/[...nextauth]/route.ts` re-exporta `{ GET, POST }` de `handlers` (auth.ts raiz via `../../../../../auth`)
- GAUTH-01 desbloqueado: fluxo OIDC do responsável tem endpoint funcional

## Task Commits

1. **Task 1: middleware.ts — proteção de rotas branching por prefixo** - `72e5d73` (feat)
2. **Task 2: [...nextauth]/route.ts — re-export handlers next-auth v5** - `95621f6` (feat, pré-existente — validado em HEAD)

## Files Created/Modified

- `src/middleware.ts` — Edge middleware: branch /child/* (jwtVerify HS256), /family/*+/guardian/* (cookie check), /family/access/* público
- `src/app/api/auth/[...nextauth]/route.ts` — Re-export `{ GET, POST }` de handlers (auth.ts raiz)

## Decisions Made

- **URL canônica de seleção de perfil:** `/family/access/[familyId]` — middleware.test.ts Test 10 é o contrato de implementação. CONTEXT.md D-02 (`/family/[familyId]/select-profile`) foi ajustado para refletir esta URL. Páginas futuras devem usar `src/app/family/access/[familyId]/page.tsx`.
- **Cookie name dinâmico:** `nextAuthCookieName(url)` deriva o nome do cookie next-auth pelo protocolo da requisição (HTTP → `authjs.session-token`, HTTPS → `__Secure-authjs.session-token`). Pitfall 2 da RESEARCH.md mitigado.
- **decodeJwt no catch:** token expirado mas decodificável extrai `familyId` para redirect contextual para `/family/access/${familyId}`. Token malformado → redirect para `/`. Pitfall 3 da RESEARCH.md mitigado.

## Deviations from Plan

**Task 1 (middleware.ts):** O arquivo já existia no working tree com uma implementação mais limpa e coesa (sem as constantes separadas `NEXTAUTH_COOKIE_DEV`/`NEXTAUTH_COOKIE_PROD` e sem o array `PUBLIC_PREFIXES` — substituídos por condicionais inline claros). Todos os 16 testes passavam. Commit realizado com a versão melhorada.

**Task 2 (route.ts):** O arquivo já existia no HEAD (commit `95621f6`) com o conteúdo exato exigido pelo plano. Nenhuma ação de criação necessária — verificação de type-check confirmou que a importação de `auth.ts` via `../../../../../auth` resolve corretamente.

**Total deviations:** Nenhuma auto-fix necessária — ambos os arquivos estavam corretos.
**Impact on plan:** Nenhum impacto negativo — estado GREEN alcançado em ambas as tasks.

## Threat Surface Scan

Nenhuma superfície nova além do previsto no threat model do plano:
- T-02-AC-BYPASS: mitigado — branch por prefixo cobre todas as rotas protegidas (16 testes)
- T-02-JWT-FORGE: mitigado — jwtVerify valida assinatura; token forjado → catch → redirect
- T-02-COOKIE-PROTO: mitigado — nextAuthCookieName() diferencia HTTP/HTTPS
- T-02-OIDC-CSRF: mitigado — next-auth v5 implementa state+PKCE nativamente (auth.ts não modificado)

## Issues Encountered

Nenhum — os dois arquivos estavam em estado correto. O `middleware.ts` tinha uma versão melhorada não commitada que foi commitada neste plano.

## Next Phase Readiness

- Proteção de rotas funcional: 02-03 (páginas da criança) e 02-04 (páginas do responsável) podem ser implementados com confiança que as rotas serão protegidas
- `/family/access/[familyId]` deve ser criado em 02-03 como rota pública para seleção de perfil
- `/api/auth/[...nextauth]` habilitado para fluxo OIDC do Zitadel

---
*Phase: 02-authentication*
*Completed: 2026-06-21*

## Self-Check: PASSED

- [x] `src/middleware.ts` — FOUND
- [x] `src/app/api/auth/[...nextauth]/route.ts` — FOUND
- [x] Commit `72e5d73` — middleware.ts
- [x] Commit `95621f6` — route.ts (pré-existente, validado)
- [x] 16 testes de middleware.test.ts passando
