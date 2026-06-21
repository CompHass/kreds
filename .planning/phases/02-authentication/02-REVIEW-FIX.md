---
phase: 02-authentication
fixed_at: 2026-06-21T00:00:00Z
review_path: .planning/phases/02-authentication/02-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 9
skipped: 2
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-21T00:00:00Z
**Source review:** .planning/phases/02-authentication/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11 (6 Critical + 5 Warning)
- Fixed: 9
- Skipped: 2

## Fixed Issues

### CR-02: Middleware usa decodeJwt não verificado para redirect

**Files modified:** `src/middleware.ts`
**Commit:** ed7b25f
**Applied fix:** Removido o bloco catch interno que chamava `decodeJwt` sem verificação de assinatura. Token expirado ou inválido agora redireciona incondicionalmente para `/`. Import de `decodeJwt` também removido do middleware.

---

### CR-03: /family/access/[familyId] sem guard de autenticação — IDOR em dados de crianças

**Files modified:** `src/app/family/access/[familyId]/page.tsx`
**Commit:** 09e96f5
**Applied fix:** Adicionado `session = await auth()` no início do Server Component com `redirect('/login')` se não houver sessão. A página agora exige sessão Guardian válida antes de consultar ou renderizar perfis infantis.

---

### CR-05: Race condition em handleDigit — dupla submissão do PIN

**Files modified:** `src/components/auth/pin-screen.tsx`
**Commit:** fc31739
**Applied fix:** Introduzido estado `pending` (`useState(false)`) definido sincronamente antes do `await verifyChildPin`. O guard `if (error || gateOpen || pending) return` na entrada de `handleDigit` e `handleBackspace` previne disparos concorrentes durante o round-trip de rede. O estado é liberado no bloco `finally`.

---

### CR-06: child-auth.ts não valida formato do PIN antes de bcrypt

**Files modified:** `src/app/actions/child-auth.ts`
**Commit:** 1a6ca51
**Applied fix:** Adicionada chamada a `validatePinFormat(pin)` no início de `verifyChildPin`, rejeitando strings fora do padrão `^\d{4,6}$` com `{ error: 'invalid' }` antes de qualquer operação de banco ou bcrypt. `validatePinFormat` adicionada ao import de `@/lib/families/child-pin`.

---

### WR-01: Coluna `active` nunca filtrada — perfis desativados aparecem e podem fazer login

**Files modified:** `src/app/family/access/[familyId]/page.tsx`, `src/app/(child)/child/[childId]/login/page.tsx`
**Commit:** 758200b
**Applied fix:** Adicionado `and(eq(...), eq(childProfiles.active, true))` em ambas as queries. Perfis com `active = false` não aparecem mais na grade de seleção nem permitem autenticação via PIN. Import de `and` adicionado em ambos os arquivos.

---

### WR-02: Formulário de reset de senha usa stub setTimeout — exibe "E-mail enviado!" sem enviar nada

**Files modified:** `src/components/auth/password-reset-form.tsx`
**Commit:** c89fc0d
**Applied fix:** Adicionado guard `if (process.env.NODE_ENV === 'production') { throw new Error(...) }` antes do stub de setTimeout. Em produção, o formulário lança erro explícito em vez de silenciosamente simular sucesso.

---

### WR-03: `rememberMe` coletado mas nunca usado em GuardianLoginForm

**Files modified:** `src/components/auth/guardian-login-form.tsx`
**Commit:** abee442
**Applied fix:** Removidos o estado `rememberMe`, o componente `IconCheck` e o bloco JSX completo do checkbox "Lembrar-me". O link "Esqueci minha senha" foi mantido, realinhado à direita. Comentário GAUTH-03 removido do JSDoc.

---

### WR-04: SocialAuthButtons dispara server actions sem tratamento de erros

**Files modified:** `src/components/auth/social-auth-buttons.tsx`
**Commit:** 02d6825
**Applied fix:** Adicionados handlers `handleProvider(idp)` e `handlePasskey()` com try/catch e estado `authError`. Mensagem de erro é exibida via `role="alert"` acima dos botões. Os três botões agora usam os handlers async em vez de chamar server actions diretamente.

---

### WR-05: Middleware guardian usa check heurístico — inconsistência com branch /child/*

**Files modified:** `src/middleware.ts`
**Commit:** 97a7d2b
**Applied fix:** Adicionado comentário de aviso explícito no código do middleware documentando que a verificação de `/family/*` e `/guardian/*` é heurística (presença de cookie apenas) e que cada Server Component nessas rotas deve chamar `auth()` independentemente para validação real da sessão.

---

## Skipped Issues

### CR-01: Contador de brute-force em memória — contornável por restart do servidor

**File:** `src/lib/families/child-session.ts:32`
**Reason:** A fix requer migração do estado de brute-force do `Map` em memória para um store persistente (Redis, tabela DB com TTL ou similar). Isso implica criação de schema de banco, configuração de infraestrutura adicional e decisões de design (janela de tempo, TTL, chave de partição) que vão além de um fix pontual de código. A mitigação adequada deve ser implementada como task separada de infra/backend.

**Original issue:** Contador em Map() é resetado a cada restart do processo e não é compartilhado entre instâncias em deployment multi-processo, tornando o bloqueio de brute-force ineficaz.

---

### CR-04: Página de login da criança vaza displayName e familyId sem autenticação

**File:** `src/app/(child)/child/[childId]/login/page.tsx:14-35`
**Reason:** A fix completa requer redesenho do fluxo de autenticação: ocultar o nome até após PIN correto implica mover a saudação para o client com fetch pós-verificação, e eliminar a exposição de `familyId` ao cliente implica mudança na action `verifyChildPin` (retornar familyId no sucesso) e remoção do prop da `PinScreen`. A mitigação parcial mais relevante (filtro `active` via WR-01 e guard de sessão em CR-03) já foi aplicada, reduzindo a cadeia de exploit. A fix completa de CR-04 requer planning de UX separado.

**Original issue:** displayName e familyId são renderizados server-side e expostos ao DOM em rota pública, permitindo enumeração de crianças por ID de perfil.

---

_Fixed: 2026-06-21T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
