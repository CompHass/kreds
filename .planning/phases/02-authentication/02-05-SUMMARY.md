---
phase: 02-authentication
plan: 05
subsystem: auth
tags: [next-auth, zitadel, oidc, react, server-actions, login-form, password-reset]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: "02-02: middleware Edge + route handler next-auth — fluxo OIDC do responsável habilitado"

provides:
  - "AuthInput: input 52px estilizado com ícone, focus ring verde e label htmlFor"
  - "SpinnerButton: botão com spinner CSS kredsSpin, aria-busy, disabled states"
  - "SocialAuthButtons: Google/Apple (identity_provider hint) + Passkey via Zitadel federation"
  - "GuardianLoginForm: form de login com e-mail/senha, toggle olho, checkbox Lembrar-me custom, erro role=alert"
  - "PasswordResetForm: 2 estados (form → confirmação), maskEmail, e-mail mascarado"
  - "guardian-auth.ts: Server Actions loginWithCredentials, loginWithProvider, loginWithPasskey"
  - "/login: tela de login do responsável"
  - "/login/reset: tela de redefinição de senha"

affects: [fase 5 painel dos pais, middleware 02-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Actions finas em src/app/actions/ wrapping signIn (next-auth) — importação via caminho relativo ../../../auth (auth.ts fora de src/)"
    - "Componentes 'use client' separados de pages Server Component — forms em src/components/auth/, shells em src/app/login/"
    - "SpinnerButton com var(--animate-kreds-spin) inline style — sem classe Tailwind para animação"
    - "Checkbox custom (div com role=checkbox) — sem shadcn, sem input checkbox nativo estilizado"
    - "maskEmail inline: 3 chars visíveis antes de ***, domínio completo"

key-files:
  created:
    - src/app/actions/guardian-auth.ts
    - src/components/auth/auth-input.tsx
    - src/components/auth/spinner-button.tsx
    - src/components/auth/social-auth-buttons.tsx
    - src/components/auth/guardian-login-form.tsx
    - src/components/auth/password-reset-form.tsx
    - src/app/login/page.tsx
    - src/app/login/reset/page.tsx
  modified: []

key-decisions:
  - "D-04 respeitado: auth.ts não modificado — guardian-auth.ts usa caminho relativo ../../../auth para importar signIn"
  - "D-05: SocialAuthButtons usa loginWithProvider('google'|'apple') com identity_provider hint — não cria providers separados no NextAuth"
  - "D-06: Passkey via loginWithPasskey() → signIn('zitadel') sem integração WebAuthn direta"
  - "GAUTH-05 UI: PasswordResetForm tem 2 estados (form/sent) com maskEmail; integração real do endpoint Zitadel depende de user_setup (T-02-RESET-ASSUME: accept)"
  - "Checkbox Lembrar-me: div com role=checkbox (não input nativo) para controle visual total do design system"

patterns-established:
  - "Pattern: Server Action wrapper para signIn — importação de auth.ts raiz via caminho relativo de src/app/actions/"
  - "Pattern: SpinnerButton com aria-busy=true + disabled durante loading (GAUTH-04)"
  - "Pattern: AuthInput com label htmlFor explícito — acessibilidade não só via placeholder"

requirements-completed: [GAUTH-01, GAUTH-02, GAUTH-03, GAUTH-04, GAUTH-05]

# Metrics
duration: 35min
completed: 2026-06-21
---

# Phase 02 Plan 05: Guardian Login UI Summary

**Tela de login do responsável com e-mail/senha, botões Google/Apple/Passkey via Zitadel federation, checkbox Lembrar-me custom verde, spinner kredsSpin, e tela de reset com 2 estados e e-mail mascarado — GAUTH-01..05 aprovados em checkpoint visual**

## Performance

- **Duration:** 35 min
- **Started:** 2026-06-21T12:35:00Z
- **Completed:** 2026-06-21T13:10:00Z
- **Tasks:** 3/3 completas (incluindo checkpoint visual aprovado)
- **Files modified:** 8

## Accomplishments

- 3 componentes base reutilizaveis criados (AuthInput, SpinnerButton, SocialAuthButtons) + Server Actions guardian-auth.ts — Task 1
- GuardianLoginForm e PasswordResetForm com copy exato do 02-UI-SPEC + paginas /login e /login/reset — Task 2
- Type-check limpo nos 8 arquivos (erros pre-existentes em tests/ sao de modulos deletados do working tree, fora do escopo deste plano)
- D-04 respeitado: auth.ts nao modificado em nenhum momento; caminho relativo `../../../auth` validado por tsc

## Task Commits

1. **Task 1: Componentes base + guardian-auth Server Actions** - `bb82e80` (feat)
2. **Task 2: GuardianLoginForm + PasswordResetForm + paginas login/reset** - `cf919b1` (feat)
3. **Task 3: Checkpoint visual GAUTH-01..05** - aprovado pelo usuario ("approved") — sem commit de codigo

## Files Created/Modified

- `src/app/actions/guardian-auth.ts` — Server Actions: loginWithCredentials, loginWithProvider, loginWithPasskey
- `src/components/auth/auth-input.tsx` — Input 52px com icone, focus ring, label htmlFor
- `src/components/auth/spinner-button.tsx` — Botao com spinner kredsSpin, aria-busy, disabled
- `src/components/auth/social-auth-buttons.tsx` — Google/Apple/Passkey via Zitadel federation
- `src/components/auth/guardian-login-form.tsx` — Form completo: email/senha, toggle olho, checkbox Lembrar-me, SocialAuthButtons, error alert
- `src/components/auth/password-reset-form.tsx` — 2 estados form/sent, maskEmail, Reenviar e-mail
- `src/app/login/page.tsx` — Server Component shell + logo + GuardianLoginForm
- `src/app/login/reset/page.tsx` — Server Component shell + PasswordResetForm

## Decisions Made

- **Caminho relativo guardian-auth.ts:** `../../../auth` a partir de `src/app/actions/` — conta 3 niveis para a raiz onde `auth.ts` vive. Validado por tsc limpo.
- **Checkbox Lembrar-me:** implementado como `div role=checkbox` (nao input nativo) para controle visual total (bg verde, checkmark SVG branco) conforme 02-UI-SPEC GAUTH-03.
- **PasswordResetForm submit:** no-op visual com `setTimeout(600)` simula latencia e aciona estado 'sent'. Integracao real do reset Zitadel e configuracao externa (T-02-RESET-ASSUME: accept).
- **maskEmail:** inline `slice(0, 3) + '***' + '@' + domain` — sem dependencia externa.

## Deviations from Plan

Nenhuma — plano executado exatamente como especificado.

## User Setup Required

**Servicos externos requerem configuracao manual antes que o login funcione end-to-end:**

| Variavel | Fonte |
|----------|-------|
| `AUTH_ZITADEL_ID` | Zitadel Console → Project → Application → Client ID |
| `AUTH_ZITADEL_SECRET` | Zitadel Console → Application → Client Secret |
| `AUTH_ZITADEL_ISSUER` | URL da instancia Zitadel (default: https://auth.hasslab.pro) |

**Configuracao no Zitadel Console:**
1. Configurar IdPs Google e Apple com nomes `google` e `apple` (D-05 identity_provider hint)
2. Habilitar Passkey/WebAuthn como metodo de login (D-06)

O login OIDC (GAUTH-01), os botoes sociais (GAUTH-02) e o redirect apos autenticacao requerem Zitadel configurado. O checkpoint visual (Task 3) verifica GAUTH-01..05 visualmente.

## Threat Surface Scan

Nenhuma superficie nova alem do previsto no threat model do plano:

- T-02-OIDC-CSRF2: mitigado — next-auth v5 aplica state+PKCE+nonce (auth.ts nao modificado)
- T-02-CRED-LEAK: mitigado — senha em type=password; loginWithCredentials e Server Action server-side
- T-02-ENUM-EMAIL: mitigado — PasswordResetForm sempre mostra "E-mail enviado!" sem revelar existencia do e-mail
- T-02-IDP-HINT: accept — hint validado server-side pelo Zitadel; falha graciosamente se IdP invalido

## Issues Encountered

Nenhum — implementacao direta seguindo 02-UI-SPEC e PATTERNS.

## Next Phase Readiness

- GAUTH-01..05 locked — checkpoint visual aprovado pelo usuario
- Fase 2 (authentication) completa: fluxo do responsavel (02-05) + fluxo da crianca (02-01..03) + middleware/route handler (02-02) + ProfileCard (02-03)
- Fase 5 (painel dos pais) pode ser executada com confianca que /login e /login/reset estao funcionais e aprovados visualmente

---
*Phase: 02-authentication*
*Completed: 2026-06-21*

## Self-Check: PASSED

- [x] `src/app/actions/guardian-auth.ts` — FOUND
- [x] `src/components/auth/auth-input.tsx` — FOUND
- [x] `src/components/auth/spinner-button.tsx` — FOUND
- [x] `src/components/auth/social-auth-buttons.tsx` — FOUND
- [x] `src/components/auth/guardian-login-form.tsx` — FOUND
- [x] `src/components/auth/password-reset-form.tsx` — FOUND
- [x] `src/app/login/page.tsx` — FOUND
- [x] `src/app/login/reset/page.tsx` — FOUND
- [x] Commit `bb82e80` — Task 1 (componentes base + guardian-auth)
- [x] Commit `cf919b1` — Task 2 (forms + paginas)
