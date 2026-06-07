---
status: partial
phase: 02-family-access-tenancy-roles-and-profiles
source: [02-VERIFICATION.md]
started: 2026-06-07T00:00:00Z
updated: 2026-06-07T00:00:00Z
---

## Current Test

[aguardando testes humanos]

## Tests

### 1. Fluxo de autenticação ZITADEL ao vivo
expected: session.user.id recebe o `sub` do ZITADEL após login, e `resolveKredsIdentityId` retorna UUID válido de `kreds_identities`
result: [pending]

### 2. Roteamento pós-criação da família
expected: após criar família, `/family/children` carrega normalmente (não redireciona para onboarding), validando CR-01 em runtime
result: [pending]

### 3. Declínio não autenticado
expected: POST unauthenticated com `action=decline` retorna 401, validando CR-03 em runtime
result: [pending]

### 4. Tela de autenticação Sylvan (UI-01)
expected: acessar `/` sem login mostra gradiente Sylvan, símbolo 🧺 dourado, card glass com botão "Entrar com ZITADEL", sem conteúdo bruto de texto
result: [pending]

### 5. Redirect pós-login com família
expected: usuário autenticado com família existente é redirecionado para `/family/children` diretamente ao acessar `/`
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
