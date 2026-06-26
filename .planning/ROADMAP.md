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
- [ ] **Phase 5: Parent Panel** - Layout desktop dos pais com CRUD completo de tarefas
- [ ] **Phase 6: API Integration** - Conectar toda a UI aos endpoints reais com os ajustes de campo necessários

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

- [ ] 06-04-PLAN.md — Connect UI to real API: replace MOCK_PARENT_TASKS and SEED_STAGE_C with DB queries; wire Server Actions in ParentPanelView; wire harvest fetch in GardenView + checkpoint visual

### Phase 12: Módulo de FX

**Goal:** Guardian consegue analisar o impacto cambial de Purchase Orders em USD e EUR — comparando a taxa contratada (DI) com a cotação atual ou simulada — para decidir se vale pagar a PO agora ou aguardar uma taxa mais favorável antes do vencimento
**Depends on:** Phase 2
**Requirements**: FX-01, FX-02, FX-03, FX-04, FX-05, FX-06
**Success Criteria** (what must be TRUE):

  1. Página `/family/fx` carrega lista de POs com colunas: PO List, Due Date, Foreign Currency Amount, DI, BRL Amount, Current Tax, Current Value (BRL), Result, (%)
  2. Campos USD e EUR são preenchidos automaticamente ao carregar a página via API de câmbio (open.er-api.com)
  3. Toggle "Simulation Off/On" — quando ON: campos USD/EUR ficam editáveis, banner de aviso aparece, colunas Current Tax/Value/Result/% ficam destacadas em ciano
  4. Cálculos corretos: BRL Amount = Foreign Amount × DI; Current Value = Foreign Amount × Current Tax; Result = BRL Amount − Current Value; (%) = Result / BRL Amount
  5. Result positivo exibido em verde, negativo em vermelho; linha de totais no rodapé da tabela
  6. Novo item de menu na área Guardian leva ao módulo FX

**Plans**: 5 plans

**Wave 1** *(paralelos — sem dependências)*

- [ ] 12-01-PLAN.md — TDD: módulo de cálculos FX (toNumber, getBrlAmount, getCurrentValue, getResult, getResultPct, calculateTotals) com testes unitários completos
- [ ] 12-02-PLAN.md — Fundação backend: schema Drizzle fx_purchase_orders, helper resolveGuardianFamilyId, Zod schema, queries server-only

**Wave 2** *(blocked on Wave 1 — schema deve existir antes do push)*

- [ ] 12-03-PLAN.md — [BLOCKING] drizzle-kit push + seed de 3 POs (PO-001/002/003) para verificação visual

**Wave 3** *(blocked on Wave 2 — banco deve ter a tabela antes dos Route Handlers)*

- [ ] 12-04-PLAN.md — Route Handlers: GET /api/fx/rates (proxy cambial) + GET/POST /api/fx/purchase-orders

**Wave 4** *(blocked on Wave 1+3 — cálculos e API prontos antes da UI)*

- [ ] 12-05-PLAN.md — SSR page /family/fx + FxAnalysisClient (tabela, toggle simulação, totais, link Guardian FX-06) + checkpoint visual

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

Note: Phase 5 depends on Phase 2 (auth), not Phase 4. Phases 3 and 4 (child garden/tasks) and Phase 5 (parent panel) can be built in parallel once Phase 2 is complete, but are sequenced here for single-developer execution.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete    | 2026-06-20 |
| 2. Authentication | 5/5 | Complete    | 2026-06-21 |
| 3. Child Garden | 3/3 | Complete    | 2026-06-22 |
| 4. Child Tasks | 4/4 | Complete   | 2026-06-22 |
| 5. Parent Panel | 2/4 | In Progress|  |
| 6. API Integration | 3/4 | In Progress | - |
| 12. Módulo de FX | 0/TBD | Not started | - |
