# Phase 2: Authentication - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 2 entrega dois fluxos de autenticação completos:
1. **Criança** — tela de seleção de perfil da família → tela de PIN 4 dígitos com animação de portão → sessão JWT em cookie `child-session`
2. **Responsável** — login Zitadel OIDC com e-mail/senha + Google/Apple via federation + Passkey Zitadel nativo → sessão next-auth JWT

Inclui também a arquitetura de route groups `(child)` / `(guardian)` e middleware de proteção de rotas.

</domain>

<decisions>
## Implementation Decisions

### Seleção de Perfil da Criança

- **D-01:** Incluir tela de seleção de perfil nesta Fase 2 (não um stub). Sem ela o fluxo da criança não é navegável no app real.
- **D-02:** URL pública: `/family/[familyId]/select-profile` — sem exigir login de responsável (modo kiosk/dispositivo compartilhado). Família é identificada pelo `familyId` na URL.
- **D-03:** Ao selecionar avatar → navega para `/child/[childId]/login`. Link "Trocar perfil" na tela de PIN → volta para `/family/[familyId]/select-profile`.

### Login Social do Responsável

- **D-04:** Google, Apple e Passkey operam via **Zitadel federation** — não como providers separados no NextAuth. `auth.ts` **não muda** (continua com apenas `Zitadel` provider).
- **D-05:** Botões Google e Apple são **funcionais** usando `identity_provider_hint`: `signIn('zitadel', {}, { identity_provider: 'google' })`. Requer nome exato do IdP configurado no Zitadel.
- **D-06:** Botão Passkey chama `signIn('zitadel')` normalmente — Zitadel oferece passkey como opção interna. Nenhuma integração WebAuthn direta no Next.js.

### Backend de PIN da Criança

- **D-07:** Verificação de PIN implementada como **Server Action** (não rota de API). Localização: `src/lib/families/child-session.ts` + Server Action em `src/app/actions/child-auth.ts`.
- **D-08:** Reconstruir `src/lib/families/child-session.ts` com o contrato exato que os testes unitários esperam: `signChildSession`, `verifyChildSession`, `checkBruteForce`, `recordFailedAttempt`, `resetAttempts`.
- **D-09:** Brute force protection: **in-memory Map** (consistente com os testes existentes). Aceita reset em restart — volume de usuários é baixo, single-instance.
- **D-10:** Hash do PIN: **bcrypt** (já é dependência do projeto). Cost factor 10.
- **D-11:** JWT de sessão da criança assinado com `CHILD_SESSION_SECRET` (env var já referenciada nos testes).

### Arquitetura de Rotas e Middleware

- **D-12:** Route groups do app router: `src/app/(child)/` e `src/app/(guardian)/`. URLs resultantes: `/child/**` para crianças, `/guardian/**` para responsáveis. Rotas públicas (sem grupo): `/login`, `/family/[familyId]/select-profile`, `/child/[childId]/login`.
- **D-13:** **Um único `middleware.ts`** com branch por pathname prefix:
  - `/child/**` → verifica cookie `child-session` (CHILD_SESSION_SECRET). Redirect para `/child/[childId]/login` se ausente/inválido.
  - `/guardian/**` → usa `auth()` do next-auth. Redirect para `/login` se sem sessão.
- **D-14:** Cookie da sessão da criança: nome `child-session`, `httpOnly`, `sameSite: lax`, `secure` em produção.

### Claude's Discretion

- Layout visual da tela de seleção de perfil (lista de avatares) — seguir o mesmo design system da Fase 1 (tokens de cor, tipografia Plus Jakarta Sans). Não há protótipo explícito para esta tela no design handoff.
- Expiração do JWT de sessão da criança — valor razoável (ex: 8h ou fim do dia).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Handoff
- `design_handoff_kreds/README.md` — Especificação completa da UI de autenticação (Frame A: PIN da criança, Frame B: Login do responsável, Frame D: Criar conta, Frame E: Redefinir senha). Incluindo tokens, medidas, animações.
- `design_handoff_kreds/Kreds Login.dc.html` — Protótipo interativo com 5 frames de auth. Abrir no browser para inspecionar comportamento.

### Auth Backend (existente)
- `auth.ts` — Configuração next-auth v5 com Zitadel OIDC, callbacks JWT/session, upsert de `kreds_identities`. **Não modificar** nesta fase.
- `src/lib/db/schema/index.ts` — Schema Drizzle com `childProfiles.pinHash` (campo já existe), `identities`, `familyMembers`.

### Testes Existentes (contrato da implementação)
- `tests/unit/child-auth-endpoint.test.ts` — Contrato de `signChildSession`, `verifyChildSession`, brute force.
- `tests/unit/child-pin-management.test.ts` — Testes de gestão de PIN.
- `tests/unit/child-session-guard.test.ts` — Testes de guard de sessão.

### Requirements
- `REQUIREMENTS.md` §Autenticação Criança (CAUTH-01..05) — Requirements locked para esta fase.
- `REQUIREMENTS.md` §Autenticação Responsável (GAUTH-01..05) — Requirements locked para esta fase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `auth.ts`: `handlers`, `auth`, `signIn`, `signOut` — exports prontos para uso nas páginas do responsável. **Não recriar.**
- `src/lib/db/schema/index.ts`: `childProfiles` com `pinHash` — campo existe, não adicionar migração.
- `src/lib/db/`: conexão Drizzle já configurada — usar `db` existente para buscar child profiles por `familyId`.
- Animações já em globals.css: `kredsBreath`, `kredsShake`, `kredsSprout` — aplicar por classe diretamente nos componentes de PIN.

### Established Patterns
- **Next.js app router** com layouts por route group — padrão que esta fase estabelece para o restante do projeto.
- **Server Actions** (não API routes) como padrão de mutação — D-07 define isso para a fase.
- **next-auth v5** `auth()` para proteção de rotas server-side — já usado no projeto, replicar no middleware.

### Integration Points
- `src/lib/db/schema/index.ts::childProfiles` — leitura de `pinHash`, `displayName`, `avatarInitial` para seleção de perfil e verificação de PIN.
- `src/lib/db/schema/index.ts::families` + `familyMembers` — busca de filhos por `familyId` na tela de seleção.
- `auth.ts` → next-auth handlers precisam continuar em `src/app/api/auth/[...nextauth]/route.ts`.

</code_context>

<specifics>
## Specific Ideas

- Animação de portão (Frame A, PIN correto): `.kreds-gateL` e `.kreds-gateR` com `transition: transform 1s cubic-bezier(.76,0,.24,1)`. Dois painéis escuros `translateX(±101%)`. Emblem desaparece com `opacity 0 + scale .55`. Jardim surge atrás.
- Shake no erro de PIN: container dos dots com `animation: kredsShake 0.5s`. Reset automático após 950ms.
- Dots do PIN preenchidos: cada dot exibe SVG brotinho com `kredsSprout`. Cor preenchida: `#3E6B4F`. Cor de erro: `#D8916B`.
- Teclado numérico: grid 3×4, botões 62px altura, `border-radius: 50%`, shadow `0 3px 0 #E6E1D4`. Backspace `⌫` sem fundo.
- PIN de teste para desenvolvimento: `1234` (conforme protótipo do design).
- Botão Entrar do responsável: spinner CSS branco durante loading, `bg #4F9B57` + banner verde após sucesso Zitadel.

</specifics>

<deferred>
## Deferred Ideas

- **Frame C (Card de Credenciais da Criança)** — visualização e reset de PIN pelo responsável no painel. Já está no out-of-scope do REQUIREMENTS.md para v2.0. Reavaliar em milestone futuro.
- **Frame D (Criar Conta / Onboarding)** — cadastro de nova família. Passo 2 não prototipado no handoff. Out-of-scope v2.0.
- **Brute force persistido** — se o app escalar para multi-instância, migrar de in-memory Map para coluna `pin_locked_until` em `child_profiles`. Não necessário agora.

</deferred>

---

*Phase: 2-Authentication*
*Context gathered: 2026-06-20*
