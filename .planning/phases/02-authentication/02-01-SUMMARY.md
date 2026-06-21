---
phase: 02-authentication
plan: 01
subsystem: auth
tags: [jwt, bcrypt, jose, bcryptjs, server-only, brute-force, pin]

# Dependency graph
requires: []
provides:
  - hashPin/verifyPin/validatePinFormat (bcryptjs cost 10) em src/lib/families/child-pin.ts
  - signChildSession/verifyChildSession (jose HS256, CHILD_SESSION_SECRET, 8h) em src/lib/families/child-session.ts
  - checkBruteForce/recordFailedAttempt/resetAttempts (in-memory Map, 5 tentativas) em src/lib/families/child-session.ts
  - validateChildSessionScope/extractChildProfileId/extractFamilyId em src/lib/auth/child-guard.ts
affects:
  - 02-02 (middleware usa decodeJwt re-exportado de child-session.ts)
  - 02-03 (Server Action verifyChildPin usa verifyPin + checkBruteForce + signChildSession)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "import 'server-only' como primeira linha de todo módulo de auth backend"
    - "bcrypt.compare() para comparação constante no tempo (anti timing-attack)"
    - "jose SignJWT HS256 com TextEncoder().encode(secret) para assinar JWTs"
    - "Map<string, number> para brute-force protection in-memory por childId"
    - "verifyChildSession retorna apenas campos do domínio, filtra iat/exp do jose"

key-files:
  created:
    - src/lib/families/child-pin.ts
    - src/lib/families/child-session.ts
    - src/lib/auth/child-guard.ts
  modified: []

key-decisions:
  - "D-09: brute force in-memory Map com 5 tentativas por childId (aceita reset em restart)"
  - "D-10: bcrypt cost factor 10 para hash de PIN (resistência a brute force)"
  - "D-11: JWT assinado com CHILD_SESSION_SECRET via HS256 (jose), expiração 8h"
  - "verifyChildSession filtra payload jose para retornar apenas {childProfileId, familyId, role}"

patterns-established:
  - "Pattern: módulos de auth backend começam com import 'server-only'"
  - "Pattern: PIN comparison via bcrypt.compare (nunca ===)"
  - "Pattern: verifyChildSession extrai campos explicitamente do payload para evitar vazamento de claims do jose (iat, exp)"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-06-20
---

# Phase 02 Plan 01: Fundação Criptográfica da Autenticação da Criança — Summary

**Três módulos de backend puros criados com bcrypt PIN hashing, jose JWT HS256 com proteção brute-force in-memory Map, e guard de escopo de sessão — 22 testes unitários passando (9+7+6)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-20T22:43:00Z
- **Completed:** 2026-06-20T22:45:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `child-pin.ts`: hash/verify de PIN com bcrypt cost 10, validação de formato 4-6 dígitos
- `child-session.ts`: sign/verify JWT HS256 (jose), brute-force Map 5 tentativas por childId, decodeJwt re-exportado para middleware
- `child-guard.ts`: validação de escopo de sessão da criança (role, childId), extractores de campos

## Task Commits

Cada task foi commitada atomicamente:

1. **Task 1: Módulo child-pin.ts** - `20584e7` (feat)
2. **Task 2: Módulo child-session.ts** - `3a9710b` (feat)
3. **Task 3: Módulo child-guard.ts** - `c480dd4` (feat)

## Files Created/Modified

- `src/lib/families/child-pin.ts` — hashPin (bcrypt cost 10), verifyPin (compare constante no tempo), validatePinFormat (regex /^\d{4,6}$/)
- `src/lib/families/child-session.ts` — signChildSession (jose HS256, 8h), verifyChildSession (extrai campos explicitamente), checkBruteForce/recordFailedAttempt/resetAttempts (Map 5 tentativas), decodeJwt re-exportado
- `src/lib/auth/child-guard.ts` — validateChildSessionScope (null + role + childId checks), extractChildProfileId, extractFamilyId

## Decisions Made

- Expiração JWT da criança: 8h (Claude's Discretion — valor razoável conforme CONTEXT.md)
- `verifyChildSession` extrai campos explicitamente ao invés de fazer cast do payload completo — necessário para filtrar `iat` e `exp` que o jose injeta automaticamente no payload retornado
- `decodeJwt` re-exportado de `child-session.ts` para que o middleware (02-02) possa importar de um único local ao invés de depender diretamente de `jose`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] verifyChildSession retornava payload completo incluindo iat/exp**

- **Found during:** Task 2 (Módulo child-session.ts)
- **Issue:** O cast `payload as { childProfileId, familyId, role }` retornava o objeto completo do jose, incluindo `iat` (issued at) e `exp` (expiration) que o `setIssuedAt()` e `setExpirationTime('8h')` injetam. O teste do `toEqual` falhou com objetos distintos.
- **Fix:** Substituído o cast por extração explícita dos campos: `{ childProfileId: payload['childProfileId'], familyId: payload['familyId'], role: payload['role'] }`
- **Files modified:** src/lib/families/child-session.ts
- **Verification:** 7/7 testes de child-auth-endpoint.test.ts passando após correção
- **Committed in:** `3a9710b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — payload com campos extras do jose)
**Impact on plan:** Auto-fix necessário para corretude do contrato de tipos. Sem escopo adicional.

## Issues Encountered

Nenhum problema além do desvio documentado acima.

## User Setup Required

Nenhum — os módulos usam `CHILD_SESSION_SECRET` que já é referenciado nos testes existentes e deve estar configurado no `.env`.

## Next Phase Readiness

- Fundação criptográfica completa — 02-02 (middleware) pode usar `decodeJwt` e `verifyChildSession` via import de `child-session.ts`
- 02-03 (Server Action verifyChildPin) pode usar `verifyPin`, `checkBruteForce`, `recordFailedAttempt`, `resetAttempts`, `signChildSession`
- Todos os 3 módulos iniciam com `import 'server-only'` — seguro para importar em Server Actions e middleware sem vazar para bundle do cliente

---
*Phase: 02-authentication*
*Completed: 2026-06-20*
