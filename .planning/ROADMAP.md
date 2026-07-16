# Roadmap: Kreds — v2.0 Redesign Jardim Kreds

## Overview

Rebuild completo do frontend com fidelidade total ao design handoff. Parte do design system e tokens (Fase 1), sobe para autenticação de criança e responsável (Fase 2), constrói o jardim gamificado (Fase 3), completa a área da criança com tarefas e navegação (Fase 4), entrega o painel desktop dos pais (Fase 5) e finaliza conectando toda a UI aos endpoints reais do backend com os ajustes de API necessários (Fase 6).

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Design system tokens, tipografia, animações e scaffolding do app Next.js (completed 2026-06-20)
- [x] **Phase 2: Authentication** - PIN screen da criança com animação portão e login OIDC do responsável (completed 2026-06-21)
- [x] **Phase 3: Child Garden** - Jardim interativo com estágios de planta, animações e overlay de celebração *(complete 2026-06-22)*
- [x] **Phase 4: Child Tasks** - Lista de tarefas, cards especiais (dízimo/cofrinho), bottom nav e gamificação (completed 2026-06-22)
- [x] **Phase 5: Parent Panel** - Layout desktop dos pais com CRUD completo de tarefas
- [x] **Phase 6: API Integration** - Conectar toda a UI aos endpoints reais com os ajustes de campo necessários (completed 2026-06-27)

## Phase Details

### Phase 1: Foundation

**Goal**: O app tem estrutura Next.js funcional com design system completo — tokens, tipografia e animações prontos para todas as fases seguintes
**Depends on**: Nothing (first phase)
**Requirements**: DS-01, DS-02, DS-03, DS-04
**Success Criteria** (what must be TRUE):

  1. Tokens de cor (verde `#3E6B4F`, fundos, bordas, estados) estão disponíveis como variáveis CSS e classes Tailwind em todo o app
  2. Plus Jakarta Sans (pesos 400–800) é a fonte renderizada em todos os textos do app
  3. Todas as animações nomeadas do design handoff (kredsBreath, kredsPop, kredsNew, kredsDrift, kredsSun, etc.) existem como keyframes CSS e podem ser aplicadas por classe
  4. Border-radius, sombras e espaçamentos do design handoff existem como tokens reutilizáveis no Tailwind config

**Plans**: 2 plansPlans:
**Wave 1**

- [x] 01-01-PLAN.md — Design tokens em globals.css (@theme: cores, tipografia, radius, shadow, 15 animações + keyframes) e stub Serwist sw.ts

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — RootLayout com Plus Jakarta Sans, página placeholder e build de produção verde (checkpoint visual)

**UI hint**: yes

### Phase 2: Authentication

**Goal**: Criança consegue entrar com PIN de 4 dígitos com animação completa; responsável consegue fazer login via Zitadel OIDC e redefinir senha
**Depends on**: Phase 1
**Requirements**: CAUTH-01, CAUTH-02, CAUTH-03, CAUTH-04, CAUTH-05, GAUTH-01, GAUTH-02, GAUTH-03, GAUTH-04, GAUTH-05
**Success Criteria** (what must be TRUE):

  1. Criança vê tela de PIN com 4 dots, teclado numérico e plant hero animada; cada dot preenchido mostra SVG de brotinho com animação kredsSprout
  2. PIN errado dispara shake nos dots e reseta automaticamente após 950ms
  3. PIN correto abre animação de portão (dois painéis, cubic-bezier 1s) que revela o jardim
  4. Link "Trocar perfil" reseta a tela de PIN completamente
  5. Responsável consegue fazer login com e-mail/senha (Zitadel OIDC), com opções Google/Apple/Passkey, checkbox "Lembrar-me" funcional e spinner durante loading; consegue redefinir senha e ver confirmação com e-mail mascarado

**Plans**: 5 plans

**Wave 1**

- [x] 02-01-PLAN.md — Módulos backend: child-pin (bcrypt), child-session (jose JWT + brute force) e child-guard (22 testes unitários)
- [x] 02-02-PLAN.md — Middleware único (proteção /child/* e /family/*+/guardian/*) e route handler next-auth (16 testes)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-03-PLAN.md — Server Action verifyChildPin + tela de seleção de perfil /family/access/[familyId] (SSR) *(depends_on 02-01)*
- [x] 02-05-PLAN.md — Fluxo do responsável: login (/login) + reset (/login/reset) com componentes e Zitadel federation (GAUTH-01..05) *(depends_on 02-02)*

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-04-PLAN.md — Tela de PIN da criança: dots+brotinho, teclado 3×4, portão, orquestrador PinScreen (CAUTH-01..05) *(depends_on 02-03)*

**Decisão de URL canônica**: A tela de seleção de perfil fica em `/family/access/[familyId]` (alinhado com os 16 testes do middleware), ajustando D-02 que originalmente propunha `/family/[familyId]/select-profile`.

**UI hint**: yes

### Phase 3: Child Garden

**Goal**: A criança vê seu jardim vivo — planta em estágio correto, animações de sol e nuvens, feedback de rega ao concluir tarefa, e overlay de celebração ao colher
**Depends on**: Phase 2
**Requirements**: GARD-01, GARD-02, GARD-03, GARD-04, GARD-05, GARD-06, GARD-07, GARD-08, GARD-09, GARD-10
**Success Criteria** (what must be TRUE):

  1. Header exibe avatar com inicial, nome da criança, saudação e badge de moedas (SVG coin)
  2. Hero 316px mostra céu gradiente com sol animado (kredsSun) e duas nuvens (kredsDrift1/2); planta exibida no estágio correto (plant-a→d) baseado em tarefas concluídas; badge de estação visível com dot colorido
  3. Ao concluir tarefa, 5 drops animados (kredsDrop) disparam, planta faz kredsPop e o tracker de água avança (dot azul `#6E9BA0`)
  4. Speech bubble contextual aparece com animação kredsBubble conforme estado do jardim
  5. Botão "Colher" laranja com animação kredsFruit aparece apenas quando todas as tarefas estão concluídas; ao colher, overlay exibe 20 confetes, versículo bíblico e botão voltar; flores SVG decorativas aparecem ao separar dízimo

**Plans**: 3 plans completed (03-01, 03-02, 03-03)
**Status**: COMPLETE — 2026-06-22
**UI hint**: yes

### Phase 4: Child Tasks

**Goal**: A criança consegue ver, marcar e interagir com todas as tarefas — incluindo card de dízimo, card de cofrinho e bottom nav funcional
**Depends on**: Phase 3
**Requirements**: CTASK-01, CTASK-02, CTASK-03, CTASK-04, CTASK-05
**Success Criteria** (what must be TRUE):

  1. Lista de task cards distingue visualmente tarefas pendentes (fundo branco) de concluídas (verde suave `#EEF3EA`)
  2. Botão check 38×38px alterna entre desmarcado (borda `#D7DBCC`) e marcado (bg `#3E6B4F` + check branco)
  3. Card de dízimo exibe ícone de flor, botão "Plantar" gradiente rosa, e muda para estado "Feito ✓" após clique
  4. Card de cofrinho exibe meta, valor salvo e progress bar animada (`.6s cubic-bezier`)
  5. Bottom nav fixo 80px com 4 ícones (Jardim, Tarefas, Cofrinho, Doar) navega entre seções; ícone ativo aparece em verde `#3E6B4F`

**Plans**: 4 plans

**Wave 1**

- [x] 04-01-PLAN.md — Fundação: estende GardenSeed com savings/goal (D-15), mock IntersectionObserver, testes RED de CTASK-01..05

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — TaskCard (CTASK-01/02), TitheCard (CTASK-03), SavingsCard (CTASK-04) *(depends_on 04-01)*
- [x] 04-03-PLAN.md — BottomNav fixo com IntersectionObserver e scroll anchor (CTASK-05) *(depends_on 04-01)*

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-04-PLAN.md — Integração no GardenView: titheDone interativo, lista de TaskCard, cards, BottomNav, anchors + checkpoint visual *(depends_on 04-02, 04-03)*

**UI hint**: yes

### Phase 5: Parent Panel

**Goal**: O responsável consegue criar, editar, ativar/desativar e excluir tarefas pelo painel desktop com todas as opções de configuração
**Depends on**: Phase 2
**Requirements**: PTASK-01, PTASK-02, PTASK-03, PTASK-04, PTASK-05, PTASK-06, PTASK-07, PTASK-08, PTASK-09, PTASK-10
**Success Criteria** (what must be TRUE):

  1. Layout 1180px renderiza sidebar 80px + área principal + painel direito fixo 336px; topbar 64px exibe breadcrumb com família em verde e badge do usuário logado
  2. Filter chips mostram "Todas" e um chip por criança com mini avatar; chip selecionado aparece em verde
  3. Task cards exibem ícone de categoria (5 categorias com cores distintas), toggle ativo/inativo 42×24px e botão lápis para editar
  4. Painel direito permite criar/editar tarefa com título, categoria chips, stepper de recompensa (±), pills de recorrência D/S/T/Q/Q/S/S, atribuição, e campo de aprovação
  5. Após salvar ou criar tarefa, o card recém-adicionado exibe flash kredsNew (glow ring verde 1.2s); botão excluir aparece somente em modo edição de tarefa existente

**Plans**: 4 plans

**Wave 1**

- [x] 05-01-PLAN.md — Fundação: schema (category/days/approval) + [BLOCKING] drizzle-kit push + seed mock parent-seed.ts + testes RED PTASK-01..10

**Wave 2** *(blocked on Wave 1 — consome o contrato ParentTask)*

- [x] 05-02-PLAN.md — Shell + lista: ParentSidebar, ParentTopbar, FilterChips, CategoryIcon, TaskToggle, ParentTaskCard (PTASK-01..05, PTASK-09) *(depends_on 05-01)*

**Wave 3** *(blocked on Wave 2 — reutiliza TaskToggle)*

- [x] 05-03-PLAN.md — Painel direito (form): TaskFormPanel idle/create/edit + CategoryChips, RewardStepper, RecurrencePills, AssigneeSelector, DeleteButton (PTASK-06..08, PTASK-10) *(depends_on 05-01, 05-02)*

**Wave 4** *(blocked on Wave 3 — integração + checkpoint)*

- [ ] 05-04-PLAN.md — Integração: ParentPanelView (CRUD otimista, D-09/D-10) + rota SSR /family/[familyId]/tasks + suite GREEN + checkpoint visual *(depends_on 05-01, 05-02, 05-03)*

**UI hint**: yes

### Phase 6: API Integration

**Goal**: Toda a UI está conectada ao backend real — campo `approval` persiste, tasks retornam `category` e `days`, e o endpoint de colheita registra o evento no ledger
**Depends on**: Phase 4, Phase 5
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):

  1. Ao criar ou editar tarefa com campo aprovação marcado/desmarcado, o valor `approval` é persistido no banco e retornado nas respostas GET/PATCH de tasks
  2. A lista de tarefas da criança e o painel dos pais recebem `category` e `days` (array de recorrência) no payload — filtros e pills de recorrência refletem os dados reais
  3. Ao clicar "Colher" e confirmar, `POST /api/child/[childId]/harvest` é chamado e o evento de colheita aparece no histórico do ledger da criança

**Plans**: 4 plans

**Wave 1** *(unblocks failing tests — ledger domain modules)*

- [x] 06-01-PLAN.md — Ledger domain modules (calculate.ts, engine.ts, queries.ts) + current-cycle.ts — 17 tests GREEN (completed 2026-06-26)

**Wave 2** *(parallel — both blocked on Wave 1)*

- [x] 06-02-PLAN.md — Task Route Handlers GET/POST/PATCH/DELETE + Server Actions (createTask, updateTask, toggleTaskActive, deactivateTask) + ParentTask type extraction (completed 2026-06-26)
- [x] 06-03-PLAN.md — Harvest Route Handler POST /api/child/[childId]/harvest with idempotency (commandId 23505 → 409) and child session auth (completed 2026-06-26)

**Wave 3** *(blocked on Wave 2 — route handlers and actions must exist before UI wiring)*

- [x] 06-04-PLAN.md — Connect UI to real API: replace MOCK_PARENT_TASKS and SEED_STAGE_C with DB queries; wire Server Actions in ParentPanelView; wire harvest fetch in GardenView + checkpoint visual

### Phase 7: Guardian Profile

**Goal:** Guardian consegue ver e editar seu perfil, e fazer logout
**Depends on:** Phase 2
**Success Criteria:**

  1. Botão "P" (sidebar inferior) e avatar (canto superior direito) abrem página/modal de perfil
  2. Perfil exibe nome, email do guardian
  3. Botão de logout encerra sessão e redireciona para /login

**Plans:** 2 plans

**Wave 1**

- [x] 07-01-PLAN.md — GuardianProfileDrawer (drawer slide read-only: nome+email, logout signOut) + suite RED (completed 2026-07-01)

**Wave 2** *(blocked on Wave 1 — consome o componente do drawer)*

- [x] 07-02-PLAN.md — Integração: guardianEmail SSR + profileOpen state + acionadores sidebar/topbar + testes (13 passing) *(depends_on 07-01)* (completed 2026-07-01, verificado em código 2026-07-16)

**UI hint**: yes

### Phase 8: Child Management

**Goal:** Guardian consegue cadastrar filhos, definir PIN e gerenciar perfis
**Depends on:** Phase 2, Phase 7
**Success Criteria:**

  1. Ícone pessoa na sidebar abre lista de filhos da família
  2. Formulário para adicionar novo filho (nome, avatar/cor)
  3. Definir e trocar PIN de 4 dígitos por filho
  4. Desativar/reativar filho

**Plans:** 4/5 plans executed

**Wave 1**

- [x] 08-01-PLAN.md — Fundação: coluna pin_encrypted + [BLOCKING] migration 0009, cipher AES-256-GCM (pin-cipher.ts) + env PIN_ENCRYPTION_KEY, child-profiles domain lib (satisfaz scaffold RED)

**Wave 2** *(02 e 03 em paralelo — sem overlap de arquivos)*

- [x] 08-02-PLAN.md — Refactor de layout: layout.tsx compartilhado (auth gate) + ParentSidebar route-aware (D-05) + /tasks sem regressão
- [x] 08-03-PLAN.md — Backend: types/child.ts + Server Actions (createChild/resetChildPin/revealChildPin/toggleChildActive) + Route Handlers children *(depends_on 08-01)*

**Wave 3** *(blocked on Wave 2)*

- [x] 08-04-PLAN.md — Componentes UI: ConfirmDeactivateDialog (1º Radix AlertDialog) + ChildFormPanel (RHF+Zod) + ChildCard (Frame C) + ChildPinResetPanel (keypad) *(depends_on 08-03)*

**Wave 4** *(blocked on Wave 3 — integração + checkpoint)*

- [x] 08-05-PLAN.md — Integração: ChildrenPanelView + rota SSR /children + suite verde + checkpoint visual *(depends_on 08-02, 08-03, 08-04)* (completed 2026-07-02, verificado em produção 2026-07-16)

**UI hint**: yes

### Phase 9: Reports

**Goal:** Guardian consegue ver relatórios semanais de Kreds por filho
**Depends on:** Phase 6, Phase 8
**Status:** COMPLETE — 2026-07-16 (implementado fora do fluxo GSD, direto na conversa)
**Success Criteria:**

  1. [x] Ícone gráfico de barras abre página de relatórios
  2. [x] Resumo semanal por filho: tarefas concluídas, Kreds ganhos, dízimo separado, poupança
  3. [x] Histórico de ciclos anteriores navegável

**Plans:** sem plans formais (GSD não usado nesta fase) — commits `399453f` (rota + agregação), `bc86273` (fix build: server-only guard indevido em client component), `39dcf70` (fix gap: persistir task completion em `taskCompletions` via `POST /api/child/[childId]/tasks/[taskId]/complete`)

**Verificado em produção 2026-07-16**: card "Ay" mostrou 2/3 tarefas, 7 Kreds ganhos, 1 dízimo — confirmado também via query direta em `task_completions` no Postgres do cluster.

### Phase 10: Settings

**Goal:** Guardian consegue configurar preferências da família
**Depends on:** Phase 7
**Success Criteria:**

  1. Engrenagem abre página de configurações
  2. Editar nome da família
  3. Configurar dia de início do ciclo semanal
  4. Gerenciar notificações

### Phase 11: Goals & Savings

**Goal:** Filho consegue definir e acompanhar metas de poupança
**Depends on:** Phase 6, Phase 8
**Success Criteria:**

  1. Ícone pin na sidebar abre módulo de metas
  2. Guardian cria meta com nome, valor e prazo
  3. Filho vê progresso visual da meta no jardim
  4. Kreds alocados para poupança contam para a meta

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete    | 2026-06-20 |
| 2. Authentication | 5/5 | Complete    | 2026-06-21 |
| 3. Child Garden | 3/3 | Complete    | 2026-06-22 |
| 4. Child Tasks | 4/4 | Complete   | 2026-06-22 |
| 5. Parent Panel | 4/4 | Complete   | 2026-06-30 |
| 6. API Integration | 4/4 | Complete   | 2026-06-27 |
| 7. Guardian Profile | 2/2 | Complete    | 2026-07-01 |
| 8. Child Management | 5/5 | Complete    | 2026-07-02 |
| 9. Reports | sem GSD | Complete    | 2026-07-16 |
| 10. Settings | 0/TBD | Not started | - |
| 11. Goals & Savings | 0/TBD | Not started | - |
| 12. Native Guardian Login | 0/TBD | Not started | - |
| 13. Child Secure Login Links | 0/TBD | Not started | - |
| 14. Avatar Customization | 0/TBD | Not started | - |

### Phase 12: Native Guardian Login

**Goal:** Replace the OIDC hosted-login redirect with native email/password auth inside Kreds — both **login** (Zitadel Session API v2: create session + password check via a next-auth Credentials provider) and **signup** (create a new Zitadel human user via the Management API) — so guardians authenticate and register entirely within the Kreds UI and never see the Zitadel hosted login/registration screens.
**Requirements**: TBD (define in SPEC)
**Depends on:** Phase 2 (Authentication)
**UI hint:** yes
**Plans:** 0 plans

**Scope notes / known constraints (from live feasibility check 2026-07-04):**
- Zitadel Session API v2 confirmed reachable at `https://auth.hasslab.pro`; the `iam-admin` service account can create sessions (test account returned HTTP 201 + sessionId/sessionToken). The password-check PATCH step is documented but was not exercised live.
- **Roles:** the OIDC `urn:zitadel:iam:org:project:roles` claim is no longer available on the Session-API path — `session.user.systemRoles` must be repopulated by fetching user grants via the Management API. This is the trickiest part to preserve.
- **Account states** the org may enforce must be handled explicitly (the hosted UI did these for free): email-not-verified (already loop-fixed separately in the OIDC path, must be surfaced here too), password-change-required, account lockout, and MFA if enabled. Determine which the org actually enforces during SPEC.
- **Security:** the guardian's plaintext password now transits the Kreds backend (TLS only, never logged). A new `IAM_LOGIN_CLIENT` service-account secret becomes a runtime dependency of the app (previously ops-only) — needs a k8s Secret. Warrants a security review.
- **Wiring:** `src/components/auth/guardian-login-form.tsx` already collects email/password but `src/app/actions/guardian-auth.ts` currently discards them and does `signIn('zitadel')` (OIDC redirect). This phase makes those credentials actually authenticate. The form's "Criar conta" link currently points to a dead `#` — this phase gives it a real signup page.

**Signup scope (added 2026-07-04) — open questions for SPEC:**
- Create the Zitadel human user via the Management API (the `iam-admin` service account can create users; needs the same runtime service-account secret as login).
- New users start with `email_verified=false`, which hits the exact block that caused the earlier login loop → SPEC must decide: require email verification (Zitadel sends the verification email) before first login, or allow provisional login. Duplicate-email handling and Zitadel password-policy error surfacing also needed.
- A brand-new guardian has **no family** — the root/family redirects currently bounce a member-less user back to `/login`. SPEC must decide whether signup also bootstraps `families` + `familyMemberships` (guardian role) inline, or routes the new user into a dedicated family-creation flow. Signup touches `kreds_identities` + `families` + `family_memberships`.

Plans:

- [ ] TBD (run /gsd-spec-phase 12, then /gsd-plan-phase 12 to break down)

### Phase 13: Child Secure Login Links

**Goal:** Guardian consegue gerar, por filho, um link direto e seguro que abre já no perfil daquela criança (sem seletor de perfis, sem botão "Acessar Painel do Responsável"), exigindo apenas o PIN da criança para entrar.
**Depends on:** Phase 2 (Authentication), Phase 8 (Child Management)
**UI hint:** yes
**Plans:** 0 plans

**Contexto:** Hoje o login da criança passa pela tela de seleção `/family/access/[familyId]` (Phase 2), que lista todos os filhos da família e também expõe o botão de acesso ao painel do responsável — indesejado quando o link é compartilhado diretamente com a criança (ex.: via WhatsApp).

**Success Criteria:**

  1. Painel do responsável tem ação "Compartilhar" por filho que gera/copia um link único (token opaco, não sequencial, não expõe `child_id`)
  2. Acessar o link abre direto no perfil daquele filho — sem lista de outros filhos e sem botão "Acessar Painel do Responsável" (bloqueio de UI e de rota/servidor, não só visual)
  3. PIN da criança continua obrigatório — o token identifica o perfil, não autentica sozinho
  4. Tentativas de PIN nessa rota têm rate-limit/lockout (reaproveitar child-guard da Phase 2)
  5. Responsável consegue revogar/regenerar o link de um filho a qualquer momento, invalidando o token anterior
  6. Token e resolução de `child_id` respeitam isolamento por `family_id` (RLS) antes de qualquer query

**Fora de escopo nesta fase:** expiração automática por tempo, vínculo do token a dispositivo/cookie.

Plans:

- [ ] TBD

### Phase 14: Avatar Customization

**Goal:** Criança consegue escolher um avatar ilustrado (personagens tema jardim) para o seu perfil, substituindo o avatar atual de inicial + cor; responsável também consegue definir/trocar o avatar do filho no painel.
**Depends on:** Phase 3 (Child Garden — header/perfil da criança), Phase 8 (Child Management — ChildFormPanel)
**UI hint:** yes
**Plans:** 0 plans

**Contexto:** Hoje o avatar é sempre a inicial do `displayName` sobre gradiente verde, com `accent_color` escolhido no cadastro (Phase 8, D-06/D-07/D-08 — "avatar customization is not a form field"). A coluna `child_profiles.avatar_preset` já existe desde a Phase 8, mas é fixada em `'initial'` server-side. Esta fase **revoga D-06/D-07/D-08**: `avatar_preset` passa a ser selecionável.

**Success Criteria:**

  1. Set de 5 avatares ilustrados tema jardim — folhinha, brotinho, sementinha, bolota e cogumelo — disponível como assets estáticos otimizados em `/public/avatars/`; `avatar_preset` armazena o preset escolhido (`'initial' | 'leaf' | 'sprout' | 'seed' | 'acorn' | 'mushroom'`)
  2. Criança abre um seletor de avatar a partir do header do jardim, escolhe um dos 5 personagens e a troca persiste e reflete imediatamente no header (autenticada pela child session da Phase 2 — criança só altera o próprio avatar)
  3. Responsável escolhe/troca o avatar do filho no ChildFormPanel (criar e editar filho), via grid de presets ao lado do campo de cor existente
  4. Avatar escolhido substitui a inicial em todos os pontos que hoje renderizam inicial+cor: ProfileCard (`/family/access/[familyId]`), GardenHeader, ChildCard (`/children`), FilterChips, AssigneeSelector e mini-avatares do painel dos pais
  5. Perfis sem escolha continuam no fallback inicial+cor (`avatar_preset = 'initial'`) — sem migração de dados destrutiva; `accent_color` continua como cor de anel/fundo e destaque
  6. Validação server-side aceita apenas presets permitidos (Zod enum); toda mutação respeita isolamento por `family_id` (guardian só altera filhos da própria família)

**Scope notes:**

- Assets: as 5 imagens de referência (estilo 3D fofo) serão fornecidas pelo usuário como arquivos finais; otimizar (webp, ~256×256) antes de commitar.
- Comentários "D-08: fixed value, NOT user-selectable" precisam ser atualizados em `src/types/child.ts`, `src/app/actions/children.ts`, `src/lib/families/child-profiles.ts` e `src/app/api/family/[familyId]/children/route.ts`.
- `CreateChildSchema` ganha campo `avatarPreset` (enum, default `'initial'`).

**Fora de escopo nesta fase:** upload de foto própria, geração de avatar por IA em runtime, desbloqueio gamificado de avatares por Kreds (candidato a fase futura).

Plans:

- [ ] TBD (run /gsd-spec-phase 14, then /gsd-plan-phase 14 to break down)
