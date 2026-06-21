# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 02-authentication
**Areas discussed:** Seleção de perfil, Login social do responsável, Backend de PIN, Arquitetura de rotas

---

## Seleção de Perfil

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Tela de seleção de perfil | Tela inicial lista avatares de todos os filhos. Criança toca no avatar → tela de PIN. | ✓ |
| URL única por criança | Cada criança tem link próprio. Vai direto para /child/[childId]/login. | |

**Incluída na Fase 2:** Sim (não stub)

**Acesso à tela de seleção:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| familyId na URL (kiosk) | /family/[familyId]/select-profile — sem login de responsável | ✓ |
| Cookie de sessão familiar | Responsável pré-autentica, cookie fica no dispositivo | |

**Notes:** Família é pública por ID no dispositivo compartilhado (tablet/kiosk de família). "Trocar perfil" volta para seleção.

---

## Login Social do Responsável

**Roteamento de Google/Apple:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Via Zitadel federation | Zitadel redireciona para o provider. auth.ts não muda. | ✓ |
| Providers separados no NextAuth | GoogleProvider + AppleProvider no auth.ts. Mais complexo. | |

**Comportamento dos botões:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Funcionais com identity_provider_hint | signIn('zitadel', {}, { identity_provider: 'google' }) | ✓ |
| Visuais por agora | Placeholder sem comportamento | |

**Passkey:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Via Zitadel Passkey nativo | signIn('zitadel') normal — Zitadel oferece passkey internamente | ✓ |
| Visual por agora | Sem comportamento | |

**Notes:** auth.ts permanece inalterado. Toda federação de identidade fica no Zitadel.

---

## Backend de PIN

**Padrão de implementação:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Server Action | src/app/actions/child-auth.ts. Sem rota HTTP exposta. | ✓ |
| Rota de API | POST /api/child/auth/pin | |

**Brute force:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| In-memory Map | Consistente com testes existentes. Reset em restart aceitável. | ✓ |
| Persistido no banco | Colunas pin_attempts/pin_locked_until. Requer migração. | |

**Hash:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| bcrypt | Já é dependência. Cost 10. Padrão para credenciais. | ✓ |
| PBKDF2 / argon2 | Mais moderno, mas dependência extra. Overkill para PIN 4 dígitos. | |

**Notes:** Reconstruir src/lib/families/child-session.ts com o contrato exato dos testes unitários existentes.

---

## Arquitetura de Rotas

**Organização de route groups:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Route groups separados | src/app/(child)/ e src/app/(guardian)/. URLs distintas. | ✓ |
| Mesmo grupo, middleware unificado | Sem separação estrutural. | |

**Middleware:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| Único com branch por prefixo | /child/** → child-session. /guardian/** → next-auth. | ✓ |
| Dois middlewares | Não suportado pelo Next.js. | |

**Cookie:**

| Opção | Descrição | Selecionada |
|-------|-----------|-------------|
| child-session | Consistente com CHILD_SESSION_SECRET dos testes. | ✓ |
| kreds-child-token | Branding explícito. | |

---

## Claude's Discretion

- Layout visual da tela de seleção de perfil (sem protótipo no handoff) — seguir design system da Fase 1
- Expiração do JWT de sessão da criança (valor razoável, ex: 8h)

## Deferred Ideas

- Frame C (Card de Credenciais da criança no painel do responsável) — out-of-scope v2.0
- Frame D (Criar Conta / Onboarding) — passo 2 não prototipado, out-of-scope v2.0
- Brute force persistido (banco) — se escalar para multi-instância
