---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
current_phase: 12
current_phase_name: native-guardian-login
status: executing
stopped_at: Phase 12 plans 02 and 03 complete — plan 04 blocked at runtime/E2E checkpoint
last_updated: "2026-07-17T11:30:00.000Z"
last_activity: 2026-07-17
last_activity_desc: "Phase 12 Wave 2 executed: native signup and Kreds-hosted password reset. Plan 04 awaits IAM_LOGIN_CLIENT and safe E2E/production verification."
progress:
  total_phases: 14
  completed_phases: 10
  total_plans: 29
  completed_plans: 32
  percent: 76
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-20)

**Core value:** A criança completa tarefas, vê seu jardim florescer e aprende mordomia — o loop de engajamento gamificado deve funcionar sem fricção.
**Current focus:** Phase 12 — native-guardian-login

## Current Position

Phase: 12 (native-guardian-login) — EXECUTING
Plan: 02 and 03 complete; 04 pending checkpoint
Status: Wave 2 complete — runtime/E2E checkpoint pending
Note: Phase 11 was implemented outside GSD and audited in this session. The global
TypeScript check still has known missing-module failures from older phases; targeted
Phase 11 tests are green.

Progress: [███████░░░] 73%

## Performance Metrics

**Velocity:**

- Total plans completed: 7
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | - | - |
| 02 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 02-authentication P01 | 15min | 3 tasks | 3 files |
| Phase 02-authentication P02 | 15min | - tasks | - files |
| Phase 02-authentication P03 | 3min | 2 tasks | 3 files |
| Phase 02-authentication P04 | 3min | 2 tasks | 6 files |
| Phase 02-authentication P05 | 35min | 3 tasks | 8 files |
| Phase 03-child-garden P01 | 6min | 3 tasks | 15 files |
| Phase 03 P02 | 10min | - tasks | - files |
| Phase 03-child-garden P03 | 15min | 3 tasks | 6 files |
| Phase 04-child-tasks P01 | 15min | 3 tasks | 4 files |
| Phase 04-child-tasks P02 | 10min | 3 tasks | 3 files |
| Phase 04-child-tasks P03 | 2min | 1 task | 1 file |
| Phase 04-child-tasks P04 | 15min | 2 tasks | 2 files |
| Phase 05 P01 | 30min | 4 tasks | 3 files |
| Phase 05 P02 | 25min | 3 tasks | 7 files |
| Phase 05 P03 | 25min | 2 tasks | 6 files |
| Phase 06 P01 | 5min | 3 tasks | 5 files |
| Phase 06 P02 | 15min | 3 tasks | 6 files |
| Phase 06 P03 | 8min | 1 task | 1 file |
| Phase 06-api-integration P04 | 8min | 2 tasks | 5 files |
| Phase 08 P01 | 8min | 3 tasks | 11 files |
| Phase 08 P03 | 20min | 4 tasks | 6 files |
| Phase 08 P04 | 25min | 3 tasks | 9 files |
| Phase 08 P05 | 35min | 3 tasks | 4 files |

## Accumulated Context

### Roadmap Evolution

- Phase 12 added (2026-07-04): Native Guardian Login — replace OIDC hosted-login redirect with native email/password login inside Kreds via Zitadel Session API v2 (Credentials provider). Depends on Phase 2. Feasibility confirmed live (Session API reachable, iam-admin can create sessions). Route: spec → plan → execute.
- Phase 12 scope expanded (2026-07-04): also includes native signup — create new Zitadel user via Management API. Open SPEC questions: email-verification-before-login vs provisional login, and whether signup bootstraps family+membership or routes to a family-creation flow (member-less guardian currently bounces to /login).

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Rebuild total (não migração) — design novo incompatível com estrutura anterior
- Roadmap: CTASK-05 (bottom nav) mantida na Fase 4 com tarefas da criança (evita fase de 1 requisito)
- Roadmap: Fase 5 (painel dos pais) depende de Fase 2 (auth), não de Fase 4 — pode ser executada em paralelo com Fases 3-4
- 02-01: D-09 brute force in-memory Map 5 tentativas por childId (aceita reset em restart)
- 02-01: D-10 bcrypt cost factor 10 para hash de PIN da criança
- 02-01: D-11 JWT da criança assinado com CHILD_SESSION_SECRET via HS256 (jose), expiração 8h
- 02-01: verifyChildSession extrai campos explicitamente para filtrar iat/exp injetados pelo jose
- [Phase ?]: 02-02: /family/access/[familyId] é URL canônica da seleção de perfil — middleware Test 10 é o contrato; D-02 do CONTEXT.md ajustado
- [Phase ?]: 02-02: middleware cookie name dinâmico — HTTP usa authjs.session-token, HTTPS usa __Secure-authjs.session-token (nextAuthCookieName)
- [Phase ?]: 02-03: verifyChildPin usa query única para pinHash + familyId (evita 2 DB roundtrips)
- 03-01: getPlantStage mapping: 0→a, 1→b, 2..n-1→c, n→d (4 tarefas no seed)
- 03-01: getBubbleText prioridade: harvested > titheDone > stage
- 03-01: garden-season.test.ts separado em puro .ts (funções puras verde); SeasonBadge testado em garden-hero.test.tsx no Wave 1
- 03-01: Seed SQL idempotente — DELETE FROM bible_verses antes do INSERT
- 03-01: psql localizado em /opt/homebrew/Cellar/postgresql@16/16.14/bin/psql (não no PATH do agente)
- [Phase ?]: 03-02: DecorativeFlowers retorna null quando !visible — padrão consistente com queryByTestId
- [Phase ?]: 03-02: GardenHero oculta WaterTracker quando canHarvest=true, slot children reservado para HarvestButton do Plano 03
- [Phase ?]: 03-02: droop prop em GardenHero é opcional (default false) para compatibilidade com garden-hero.test.tsx
- 03-03: canHarvest passado ao GardenHero como harvested (não doneCount==total) para WaterTracker ficar visível em 4/4 antes da colheita
- 03-03: aria-label HarvestButton = "Colher Frutos" (compatibilidade com regex /colher frutos/i do teste GARD-08)
- 04-03: React importado explicitamente em bottom-nav.tsx para usar React.ReactElement — namespace JSX não disponível sem import no projeto
- 05-01: D-03 columns category (nullable), days (jsonb nullable), approval (notNull default false) adicionados ao taskTemplates
- 05-01: kreds_value_positive constraint preservado — conflito com reward=0 (Mordomia) adiado para Fase 6
- 05-01: banco kreds_dev criado do zero (role kreds + CREATE DATABASE) — PostgreSQL não estava rodando
- 05-02: CategoryIcon importa CATEGORY_META de @/lib/seed/parent-seed para obter color/softBg — sem duplicação de constantes
- 05-02: ParentTaskCard tem data-testid='parent-task-card' para compatibilidade com PTASK-09 nos testes
- 05-02: Teste RGB — React converte #3E6B4F para rgb(62, 107, 79) no DOM; matcher regex aceita ambos formatos
- 05-03: RecurrencePills usa seleção por índice (0–6) para evitar colisão entre labels repetidas D/S/T/Q/Q/S/S
- 05-03: ApprovalToggle reutiliza TaskToggle de 05-02 com label 'Requer aprovação' — sem wrapper adicional
- 05-03: DeleteButton render condicional {mode === 'edit' && (...)} — PTASK-10 invariante crítico garantido
- 05-04: FilterChips oculto em create/edit para evitar colisão getByText('Ana') com AssigneeSelector (PTASK-09)
- 05-04: ParentTaskCard badges sem 'Mordomia'/'Todos os dias' — usa 'R$ 0'/'7×/sem' para evitar colisão PTASK-07/08
- 05-04: data-testid='parent-sidebar' + data-category no CategoryIcon para testes de integração (PTASK-01/05)
- 05-04: RewardStepper aria-label 'Incrementar recompensa' alinhado com regex do teste PTASK-07
- 05-04: families.name query com fallback 'Família' para breadcrumb (Open Question 1)
- 06-01: calculate.ts e queries.ts omitem import 'server-only' — testes unitários não têm mock; engine.ts mantém pois teste de integração tem vi.mock('server-only', () => ({}))
- 06-01: postNegativeAdjustment verifica saldo disponível antes do insert — rejeita ajuste > saldo com 'Insufficient balance'
- 06-01: getCurrentCycleStart usa UTC (getUTCDay/setUTCDate) para evitar drift de fuso horário
- 06-02: auth.ts está na raiz do projeto (fora de src/), então @/auth falha — usar caminho relativo nas Route Handlers
- 06-02: parent-seed.ts usa import+re-export para ParentTask/Category (não apenas export type) pois o mesmo arquivo ainda referencia esses nomes em CATEGORY_META e MOCK_PARENT_TASKS
- 06-02: Server Actions retornam o row real do DB via .returning() para evitar desync de UUID otimista no ParentPanelView
- 06-03: 23505 caught outside db.transaction() — catching inside the callback silently swallows unique violations after txn abort
- 06-03: session.familyId used for ledger insert (not body.familyId) — signed JWT prevents cross-family forgery (T-06-13)
- 06-03: validateChildSessionScope() also rejects session.role !== 'child' — prevents guardian token type confusion on child routes
- [Phase ?]: 06-04: handleSave (create) usa UUID real do DB (saved.id) — sem crypto.randomUUID() local (Pitfall 6, T-06-19)
- [Phase ?]: 06-04: handleHarvest 409 tratado como sucesso idempotente — overlay aparece para 200 e 409
- [Phase ?]: 06-04: harvest body.familyId = '' — servidor lê familyId do JWT assinado (T-06-13)
- 07-01: vi.hoisted() usado no mock de signOut — vi.mock hoist para topo mas const declarado depois está em TDZ
- 07-01: GuardianProfileDrawer recebe guardianName + guardianEmail via props (não useSession) — padrão SSR→props
- 07-01: signOut({ redirectTo: '/login' }) — parâmetro correto em next-auth v5 (não callbackUrl de v4)
- 07-01: autoFocus no botão Sair para foco acessível ao abrir drawer (Pitfall 5)
- 07-02: token.email explicitamente persistido no jwt callback — remove dependência do comportamento default do next-auth
- 07-02: vi.mock('next-auth') necessário no parent-panel test — NextAuth inicializa e importa next/server (não disponível em jsdom)
- 07-02: PTASK-02 corrigido com getAllByText + within(header) — drawer sempre no DOM causa colisão em getByText('João')
- 07-02: PTASK-09 corrigido com waitFor — createTask é async, atualização de estado ocorre após a promise
- [Phase ?]: 08-01: AES-256-GCM with authTagLength=16 explicit on both cipher/decipher (Node v22+ requirement)
- [Phase ?]: 08-01: pin_encrypted nullable no default — existing child (Ana) has pinHash but no recoverable plaintext for backfill
- [Phase ?]: 08-03: ResetPinActionSchema in PATCH [childId] handler reuses ResetPinSchema.shape.pin (single source of truth, no duplication)
- [Phase ?]: 08-03: integration test replicates Server Action DB writes directly against schema, avoiding auth()/Next runtime deps in Testcontainers tests
- [Phase ?]: 08-03: tests run via local npx vitest run — app container is production runner image with no npm/devDependencies
- [Phase ?]: 08-04: radix-ui installed via pnpm (project packageManager), not npm — docker compose exec app has no npm/devDependencies (production runner image)
- [Phase ?]: 08-04: @hookform/resolvers upgraded 5.0.1 -> 5.4.0 (Rule 3) — installed 5.0.1's zodResolver reads legacy ZodError.errors, but Zod 4.4.3 exposes .issues, silently swallowing validation errors
- [Phase ?]: 08-04: ChildFormPanel test assertions use onSave.mock.calls[0][0] instead of toHaveBeenCalledWith — RHF's handleSubmit(onSave) invokes onSave(data, event) with two args
- [Phase ?]: 08-04: ChildCard renders deactivated children at reduced opacity (0.55) rather than hiding — D-14 requires deactivated children still appear in the list
- [Phase 08]: 08-05: PIN_ENCRYPTION_KEY adicionado ao docker-compose.yml (Rule 3) — precondicao do proprio checkpoint dependia dele
- [Phase 08]: 08-05: checkpoint human-verify (Task 3) verificacao adiada para pos-deploy contra https://kreds.hasslab.pro — nova preferencia do usuario, verificacao local via docker compose nao se comportou como esperado

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 12 plan 04 checkpoint: a dedicated `IAM_LOGIN_CLIENT` JWT-profile key and approved test fixture are required before E2E/production verification. No real secret was created or committed.

- 08-05 Task 3 (checkpoint:human-verify, gate=blocking): implementacao completa e commitada, mas verificacao visual/funcional NAO aprovada. Usuario ira verificar contra https://kreds.hasslab.pro apos deploy via GitOps CI. Nao avancar para Fase 09 ate confirmacao.
- 260703-cq0 Task 2 (checkpoint:human-verify, gate=blocking): root `/` auth redirect implementado e commitado (4cb1f3d), mas verificacao contra https://kreds.hasslab.pro (logout->/login, login->/family/{familyId}/tasks, sem loop) ainda NAO aprovada pelo usuario.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260702-mta | Adicionar indicador visual no card de tarefa mostrando quais criancas estao associadas, sem usar filtros | 2026-07-02 | cc24511 | [260702-mta-adicionar-indicador-visual-no-card-de-ta](./quick/260702-mta-adicionar-indicador-visual-no-card-de-ta/) |
| 260702-pr6 | Fix privilege-escalation gap: child-session cookie coexists with parent's next-auth session, allowing child to navigate to guardian panel | 2026-07-02 | 420052b | [260702-pr6-fix-privilege-escalation-gap-child-sessi](./quick/260702-pr6-fix-privilege-escalation-gap-child-sessi/) |
| 260703-cq0 | Redirect root / based on auth: authenticated guardian goes to family tasks dashboard, unauthenticated goes to /login | 2026-07-03 | 4cb1f3d | [260703-cq0-redirect-root-based-on-auth-authenticate](./quick/260703-cq0-redirect-root-based-on-auth-authenticate/) |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-04T18:38:55.175Z
Stopped at: Phase 12 context gathered
Resume file: .planning/phases/12-native-guardian-login/12-CONTEXT.md
