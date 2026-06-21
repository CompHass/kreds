---
status: testing
phase: 02-authentication
source: [02-VERIFICATION.md]
started: 2026-06-21T23:02:42Z
updated: 2026-06-21T23:02:42Z
---

## Current Test

number: 1
name: GAUTH-02 — Redirect OIDC Google/Apple com identity_provider hint
expected: |
  Botão Google/Apple redireciona para Zitadel OIDC com parâmetro identity_provider=google|apple
awaiting: user response

## Tests

### 1. CAUTH-01..05 — Animações da tela de PIN (visual checkpoint)
expected: 4 dots, teclado 3×4, kredsBreath, kredsSprout nos dots, kredsShake no erro, portão cubic-bezier no acerto, "Trocar perfil" limpa tela
result: approved (2026-06-21 — usuário digitou "approved" durante execução do plano 02-04)

### 2. GAUTH-01/03/04/05 — Login responsável visual (visual checkpoint)
expected: form e-mail/senha, toggle olho, spinner kredsSpin, checkbox Lembrar-me custom, reset com 2 estados e e-mail mascarado
result: approved (2026-06-21 — aprovado durante checkpoint visual do plano 02-05)

### 3. GAUTH-02 — Redirect OIDC Google/Apple com identity_provider hint
expected: |
  Botão "Entrar com Google" → redirect Zitadel com identity_provider=google
  Botão "Entrar com Apple" → redirect Zitadel com identity_provider=apple
  Requer Zitadel configurado com providers federados.
result: [pending]

### 4. GAUTH-04 — Spinner kredsSpin durante loading
expected: Botão "Entrar" mostra spinner CSS branco (kredsSpin) e fica desabilitado durante a chamada ao Server Action
result: approved (2026-06-21 — coberto no checkpoint visual do plano 02-05)

## Summary

total: 4
passed: 3
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
