# Phase 12: Native Guardian Login - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 12 substitui o redirect OIDC hospedado do Zitadel pelo fluxo nativo de e-mail/senha (login + signup) dentro do próprio Kreds, via Zitadel Session API v2 (login) e Management API (signup, roles, reset de senha, criação de usuário). Google/Apple/Passkey continuam via `signIn('zitadel')` (fora de escopo — ver SPEC.md).

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**12 requirements are locked.** See `12-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `12-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Native email/password login via Zitadel Session API v2 (Credentials provider), replacing the OIDC redirect for this one flow
- Native signup via Zitadel Management API (human user creation) + Postgres family/membership bootstrap
- Generic (non-enumerating) error messaging for invalid login, duplicate signup, and password reset
- Role repopulation (`systemRoles`) via Management API grants fetch on the Credentials path
- Password-reset backend wiring for the existing `/login/reset` UI
- New `IAM_LOGIN_CLIENT` k8s Secret and its server-only usage
- Pending-invite-aware family attach on signup (attach instead of creating a duplicate family)

**Out of scope (from SPEC.md):**
- Google/Apple social login migration to native — federation always redirects to the provider's own consent screen regardless of Zitadel hosted vs. native
- Passkey/WebAuthn native ceremony — separate, large scope; stays on OIDC redirect this phase
- MFA enforcement UI (OTP/U2F) — org login policy does not force MFA today (confirmed live)
- Account lockout / forced password-change UI — org lockout and password-age policies are both default/disabled today (confirmed live)
- Client-side password complexity reimplementation — Zitadel's own policy-violation error is passed through instead
- Deleting/rolling back the Zitadel user if the Postgres family-bootstrap transaction fails — handled instead via self-healing retry on next login

</spec_lock>

<decisions>
## Implementation Decisions

### Secret / service account shape

- **D-01:** Novo service account Zitadel dedicado para `IAM_LOGIN_CLIENT` — NÃO reusa as credenciais de `iam-admin`. Escopo mínimo: criar usuário (signup), criar sessão + password-check (login), ler grants (roles), disparar reset de senha. Menor blast radius que reusar um service account de IAM admin completo.
- **D-02:** Autenticação do service account via JWT-profile key (mesmo mecanismo já validado ao vivo nesta sessão para `iam-admin`) — não client_secret tradicional, pois é assim que service accounts Zitadel funcionam.
- **D-03:** A chave JSON inteira vira o valor de uma única env var `IAM_LOGIN_CLIENT` (JSON string), parseada/validada em `src/lib/env.ts` com zod — mesmo padrão já usado para `PIN_ENCRYPTION_KEY`/`CHILD_SESSION_SECRET`. Falha de parse já quebra o boot (zod `.parse()` lança), cumprindo o fail-closed do requisito 10 do SPEC sem código extra.
- **D-04:** Módulo que lê `IAM_LOGIN_CLIENT` e faz as chamadas Session API/Management API é `server-only` (mesmo padrão de `src/lib/auth/child-guard.ts`, `src/lib/crypto/pin-cipher.ts`) — nunca importado por Client Component.

### Integração do Credentials provider em auth.ts

- **D-05:** Adicionar um segundo provider `Credentials` no array `providers` de `auth.ts`, ao lado do `Zitadel` (OIDC) existente — não substituir, não criar instância NextAuth separada.
- **D-06:** `authorize()` do Credentials provider chama Session API v2 (create session + password check) e, em caso de sucesso, busca o perfil do usuário (email, email_verified, name) via Management API get-user — retorna um objeto `user` no formato que os callbacks `jwt`/`session` já esperam (mesmos campos usados hoje: `sub`/`email`/`email_verified`/`name`).
- **D-07:** O callback `jwt` existente (hoje só trata `profile?.sub` do fluxo OIDC) ganha um branch paralelo para o fluco Credentials, usando `account?.provider === 'credentials'` para diferenciar. A lógica de upsert de `kreds_identities` (hoje só dentro do branch OIDC) é extraída para uma função auxiliar compartilhada entre os dois branches — evita duplicar a lógica de sync.
- **D-08:** Fetch de `systemRoles` via Management API grants roda dentro do branch Credentials do `jwt` callback, dentro de um try/catch não-bloqueante (mesmo padrão do upsert de identities) — falha nunca bloqueia o login (requisito 3 do SPEC).
- **D-09:** Mensagem genérica de erro (requisito 2 do SPEC) é implementada lançando um erro customizado dentro de `authorize()` com uma mensagem fixa ("E-mail ou senha inválidos") para AMBOS os casos (email não encontrado, senha errada) — next-auth propaga essa mensagem pro client via o retorno de `signIn()`.

### Fluxo de signup

- **D-10:** Nova rota `/signup` (mesmo nível de `/login`, `/login/reset`) — Server Component page + Client Component de formulário, mesmo padrão SSR-page/client-view usado em `/family/[familyId]/tasks` e `/children`.
- **D-11:** Campos do form: e-mail, senha, confirmar senha (validação de "iguais" client-side apenas — Zitadel não recebe confirmação, só a senha final). SEM campo de nome da família no form inicial — nome da família recebe fallback `'Família'` (mesmo padrão de fallback já usado em 05-04 pro breadcrumb).
- **D-12:** Novo Server Action `src/app/actions/guardian-signup.ts` (nome espelhando `guardian-auth.ts`) contendo a lógica completa: 1) criar usuário Zitadel via Management API, 2) checar convite pendente por e-mail (`family_memberships.invitedByIdentityId`/`unique_pending_invite`), 3a) se há convite: anexar a family convidada; 3b) se não há: transação Postgres única criando `kreds_identities` + `families` (nome `'Família'`) + `family_memberships` (`role='guardian'`), 4) chamar `signIn('credentials', ...)` internamente para logar o usuário imediatamente.
- **D-13:** Auto-cura (requisito 7 do SPEC) vive DENTRO do mesmo helper compartilhado do D-07 — toda vez que o `jwt` callback roda (login Credentials OU OIDC), ele verifica se a identity tem pelo menos uma `family_memberships` ativa; se não tiver, tenta criar (mesma lógica de bootstrap do D-12, idempotente). Sem job/cron separado — roda inline no próximo login bem-sucedido, mesmo espírito do upsert de identities já existente.
- **D-14:** Link "Criar conta" em `guardian-login-form.tsx` (hoje `href="#"`) passa a apontar para `/signup`.

### Reset de senha

- **D-15:** `/login/reset` (UI já existe) chama um novo Server Action que dispara a Management API do Zitadel para enviar o e-mail de reset (`SetPasswordNotification`/fluxo equivalente) — Kreds nunca gera nem vê o link/token de reset, só aciona o envio. Nenhum redirect pro Zitadel hospedado.
- **D-16:** Resposta é sempre a mesma tela de sucesso (e-mail mascarado + estado "reenviar"), independente de o e-mail existir no Zitadel ou não — mesmo princípio anti-enumeração das demais mensagens genéricas.

### Claude's Discretion

- Textos exatos de erro/copy do form de signup (placeholder, labels).
- Estrutura exata do payload de erro do `authorize()` (mensagem única vs. código de erro + mensagem).
- Nome/formato exato dos campos no schema Zod de validação do signup.
- Nome exato do service account novo no Zitadel Console e suas roles/permissões granulares específicas (a implementação deve escolher o menor conjunto de roles do Zitadel que cobre os 4 usos: create-user, create-session, read-grants, send-password-reset).
- Onde exatamente o helper compartilhado (D-07/D-13) mora no código (ex: `src/lib/auth/guardian-sync.ts` vs inline em `auth.ts`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec

- `.planning/phases/12-native-guardian-login/12-SPEC.md` — Locked requirements — MUST read before planning.

### Autenticação existente

- `auth.ts` (root) — NextAuth v5 instance, provider `Zitadel` (OIDC), callbacks `signIn`/`jwt`/`session`. Ponto de extensão pro novo Credentials provider (D-05 a D-09).
- `src/app/actions/guardian-auth.ts` — `loginWithCredentials` (hoje discarta email/senha e chama `signIn('zitadel')`), `loginWithProvider`, `loginWithPasskey` (ambos NÃO mudam, requisito 11 do SPEC).
- `src/components/auth/guardian-login-form.tsx` — form de login já coleta email/senha; link "Criar conta" (linha ~260) hoje `href="#"` (D-14).
- `src/lib/env.ts` — schema zod de env vars, padrão fail-closed a seguir para `IAM_LOGIN_CLIENT` (D-03).

### Schema de dados

- `src/lib/db/schema/index.ts` — `identities` (`kreds_identities`, linhas 30-38), `families` (linhas 41-51), `familyMemberships` (linhas 80-100, incluindo `invitedByIdentityId` e `unique_pending_invite` — usado pelo D-12 pra detectar convite pendente).

### Live Zitadel config (verificado nesta sessão, 2026-07-04)

- Org: `https://auth.hasslab.pro` — password complexity: min 8 + upper + lower + number + symbol; lockout policy default (desabilitado); password age policy default (sem expiração forçada); login policy sem `forceMFA` (OTP/U2F opcionais).
- Service account `iam-admin` (namespace `zitadel`) usa autenticação JWT-profile key — padrão de referência pro novo service account (D-01/D-02), mas NÃO deve ser reusado diretamente (D-01).

### Requirements & Roadmap

- `.planning/ROADMAP.md` §Phase 12: Native Guardian Login.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/env.ts` — schema zod já valida env vars obrigatórias com fail-closed no boot; `IAM_LOGIN_CLIENT` segue o mesmo padrão.
- `auth.ts`'s upsert de `kreds_identities` no callback `jwt` (try/catch não-bloqueante) — padrão exato a reaproveitar/extrair pro helper compartilhado (D-07).
- SSR-page + client-view pattern (`/family/[familyId]/tasks`, `/children`) — mesmo molde pra nova rota `/signup`.
- Fallback `'Família'` para nome de family já usado no breadcrumb (05-04) — reaproveitado como nome default no signup (D-11).

### Established Patterns

- Server Actions para mutations (`src/app/actions/*.ts`) — `guardian-signup.ts` segue o mesmo padrão de `children.ts`/`tasks.ts`.
- `server-only` import em módulos sensíveis (`child-guard.ts`, `pin-cipher.ts`) — mesmo padrão obrigatório pro módulo que lê `IAM_LOGIN_CLIENT`.
- Try/catch não-bloqueante em volta de side-effects não-críticos no `jwt` callback — padrão a replicar pro fetch de roles (D-08) e auto-cura de family (D-13).

### Integration Points

- `auth.ts` — novo provider `Credentials`, branch novo nos callbacks `jwt`/`session` por `account.provider`.
- `src/app/actions/guardian-auth.ts` — `loginWithCredentials` passa a de fato usar o novo provider Credentials (hoje só chama `signIn('zitadel')`).
- Novo: `src/app/actions/guardian-signup.ts`, `src/app/signup/page.tsx` + client form, `src/app/actions/guardian-reset.ts` (ou extensão de `guardian-auth.ts`).
- Novo módulo server-only pra chamadas Zitadel (Session API v2 + Management API) — local exato fica a critério do plan-phase/executor.

</code_context>

<specifics>
## Specific Ideas

- Usuário pediu para decidir tudo com julgamento técnico ("pode decidir tudo como achar melhor e qualquer coisa eu abro bug para ajustar") — decisões acima são recomendações de engenharia, não confirmadas item a item pelo usuário. Espera-se ajuste via bug/quick-task se algo não bater com a expectativa depois de implementado.

</specifics>

<deferred>
## Deferred Ideas

- **Passkey/WebAuthn nativo** — grande escopo próprio (ceremônia WebAuthn no browser), citado durante o SPEC como possível item futuro de roadmap.
- **Migração de Google/Apple pro fluxo nativo** — não traz benefício real (federation sempre redireciona pro provedor), permanece OIDC.
- **MFA/lockout/forced password-change UI** — org não aplica hoje; revisitar apenas se a policy do Zitadel mudar.

### Reviewed Todos (not folded)

None — no pending todos matched this phase (`todo_count: 0`).

</deferred>

---

*Phase: 12-native-guardian-login*
*Context gathered: 2026-07-04*
