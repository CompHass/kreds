---
phase: 04-child-tasks
verified: 2026-06-22T17:00:00Z
status: passed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Verificar o fluxo de colheita visual no hero do jardim"
    expected: "Ao marcar todas as tarefas, o HarvestGlow no GardenHero deve aparecer (estado pronto para colher). Atualmente canHarvest={harvested} em vez de canHarvest={canHarvest} — o glow só aparece APÓS a colheita, não antes."
    why_human: "Bug identificado (CR-01 do REVIEW): o HarvestButton funciona corretamente via variável canHarvest, mas GardenHero.canHarvest recebe a prop errada (harvested). O impacto visual não é testável automaticamente. GARD-08 está marcado como Pending/Fase 3, então o bug pode não bloquear a Fase 4, mas requer decisão humana sobre aceitabilidade."
  - test: "Confirmar fluxo completo: Plantar dízimo → flores aparecem no hero"
    expected: "Clicar 'Plantar' no TitheCard → botão muda para 'Feito ✓' (aria-disabled) → DecorativeFlowers aparecem no GardenHero. O fluxo de titheDone state está implementado corretamente mas necessita verificação visual."
    why_human: "A conexão titheDone state → GardenHero → DecorativeFlowers foi verificada no código, mas a verificação visual do checkpoint humano do Plano 04-04 foi registrada no SUMMARY como aprovada — isso é uma afirmação de SUMMARY, não evidência codebase verificável automaticamente."
  - test: "Confirmar animação de progress bar do SavingsCard (0% → 25%)"
    expected: "Ao abrir /child/[childId]/garden e scrollar até o SavingsCard, a barra deve animar de 0% até 25% visivelmente."
    why_human: "A correção setTimeout(0) foi aplicada (documentada em 04-04 SUMMARY) mas a animação CSS no mount não é verificável automaticamente em jsdom — requestAnimationFrame e setTimeout são mocked no ambiente de teste."
  - test: "Confirmar BottomNav scroll anchor e active state por scroll"
    expected: "Scrollar a página deve mudar o item ativo (Jardim → Tarefas → Cofrinho) via IntersectionObserver. Clicar em ícone deve fazer scroll suave. 'Doar' não deve responder."
    why_human: "IntersectionObserver está mockado nos testes; o comportamento real de scroll e active state por IntersectionObserver só é verificável no browser."
---

# Phase 04: Child Tasks — Verification Report

**Phase Goal:** A criança consegue ver, marcar e interagir com todas as tarefas — incluindo card de dízimo, card de cofrinho e bottom nav funcional
**Verified:** 2026-06-22T17:00:00Z
**Status:** human_needed
**Re-verification:** No — verificação inicial

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Interface GardenSeed expõe os campos `savings` e `goal` | VERIFIED | `src/lib/seed/garden-seed.ts` linhas 19-20: `savings: number` e `goal: number` na interface |
| 2 | Todas as 6 constantes de seed têm `savings: 25` e `goal: 100` | VERIFIED | `grep -c 'savings: 25'` = 6; `grep -c 'goal: 100'` = 6 |
| 3 | TaskCard pendente: bg branco; concluída: bg `#EEF3EA` (CTASK-01) | VERIFIED | `task-card.tsx` linha 35: `background: task.done ? '#EEF3EA' : '#ffffff'` |
| 4 | Clicar no check de tarefa pendente chama `onComplete(task.id)`; tarefa concluída não dispara (CTASK-02) | VERIFIED | `task-card.tsx` linha 17: `onClick={() => !task.done && onComplete(task.id)}`; `disabled={task.done}` |
| 5 | TitheCard exibe "Dízimo", botão "Plantar" → "Feito ✓" desabilitado (CTASK-03) | VERIFIED | `tithe-card.tsx` linha 77: `{done ? 'Feito ✓' : 'Plantar'}`; `disabled={done}` |
| 6 | SavingsCard exibe "Cofrinho", "R$ 25", "R$ 100", com `role="progressbar"` / `aria-valuenow` / `aria-valuemax` (CTASK-04) | VERIFIED | `savings-card.tsx` linhas 55, 77, 64, 83-87 |
| 7 | BottomNav renderiza 4 itens (Jardim, Tarefas, Cofrinho, Doar); "Jardim" ativo por padrão; "Doar" aria-disabled (CTASK-05) | VERIFIED | `bottom-nav.tsx` linhas 15-19 (NAV_ITEMS); linha 72: `useState<Section>('garden')`; linha 135: `aria-disabled="true"` |
| 8 | GardenView integra todos os 4 componentes com titheDone como useState interativo | VERIFIED | `garden-view.tsx` linha 42: `useState(seed.titheDone)`; imports linhas 16-19; usos linhas 135, 141, 145, 149 |
| 9 | Anchors de seção `#section-garden`, `#section-tasks`, `#section-savings` presentes no GardenView | VERIFIED | `garden-view.tsx` linhas 99, 122, 144 |
| 10 | Suíte de testes GREEN: 18 testes child-tasks + bottom-nav; 3 testes garden-view (sem regressão) | VERIFIED | `npm run test -- tests/unit/child-tasks.test.tsx tests/unit/bottom-nav.test.tsx` → 18 passed; `tests/unit/garden-view.test.tsx` → 3 passed |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Esperado | Status | Detalhes |
|----------|----------|--------|----------|
| `src/lib/seed/garden-seed.ts` | Interface GardenSeed com savings/goal; 6 constantes com savings:25/goal:100 | VERIFIED | Existe, substantivo, campos presentes; consumido por GardenView |
| `tests/setup.ts` | Mock global de IntersectionObserver (observe, unobserve, disconnect) | VERIFIED | Existe; classe mock com 3 métodos vi.fn(); `globalThis.IntersectionObserver` atribuído |
| `tests/unit/child-tasks.test.tsx` | Testes RED→GREEN para TaskCard, TitheCard, SavingsCard | VERIFIED | Existe, 111 linhas, 14 testes — todos passam GREEN |
| `tests/unit/bottom-nav.test.tsx` | Testes RED→GREEN para BottomNav | VERIFIED | Existe, 33 linhas, 4 testes — todos passam GREEN |
| `src/components/tasks/task-card.tsx` | Componente TaskCard (CTASK-01, CTASK-02) | VERIFIED | 91 linhas; `export function TaskCard`; check 38×38px; cores corretas; aria-pressed |
| `src/components/tasks/tithe-card.tsx` | Componente TitheCard (CTASK-03) | VERIFIED | 83 linhas; `export function TitheCard`; gradiente rosa; "Feito ✓"; aria-disabled |
| `src/components/tasks/savings-card.tsx` | Componente SavingsCard (CTASK-04) | VERIFIED | 110 linhas; `export function SavingsCard`; progressbar; setTimeout(0) para animação |
| `src/components/tasks/bottom-nav.tsx` | Componente BottomNav (CTASK-05) | VERIFIED | 200 linhas; `export function BottomNav`; fixed 80px; 4 ícones SVG; IntersectionObserver |
| `src/components/garden/garden-view.tsx` | GardenView integrado com todos os 4 componentes | VERIFIED | 160 linhas; imports; titheDone useState; anchors; paddingBottom:80; stub removido |

### Key Link Verification

| From | To | Via | Status | Detalhes |
|------|----|----|--------|----------|
| `tests/unit/child-tasks.test.tsx` | `src/components/tasks/task-card.tsx` | named import | WIRED | `import { TaskCard } from '../../src/components/tasks/task-card'` (linha 8) |
| `tests/unit/child-tasks.test.tsx` | `src/components/tasks/tithe-card.tsx` | named import | WIRED | `import { TitheCard }` (linha 9) |
| `tests/unit/child-tasks.test.tsx` | `src/components/tasks/savings-card.tsx` | named import | WIRED | `import { SavingsCard }` (linha 10) |
| `tests/unit/bottom-nav.test.tsx` | `src/components/tasks/bottom-nav.tsx` | named import | WIRED | `import { BottomNav }` (linha 5) |
| `src/components/garden/garden-view.tsx` | `src/components/tasks/task-card.tsx` | import + `tasks.map(TaskCard)` | WIRED | Import linha 16; uso linha 135 |
| `src/components/garden/garden-view.tsx` | `src/components/tasks/tithe-card.tsx` | import + `<TitheCard done={titheDone}>` | WIRED | Import linha 17; uso linha 141 |
| `src/components/garden/garden-view.tsx` | `src/components/tasks/savings-card.tsx` | import + `<SavingsCard savings={seed.savings}>` | WIRED | Import linha 18; uso linha 145 |
| `src/components/garden/garden-view.tsx` | `src/components/tasks/bottom-nav.tsx` | import + `<BottomNav />` | WIRED | Import linha 19; uso linha 149 |
| `src/components/tasks/task-card.tsx` | `GardenView.handleTaskComplete` | prop `onComplete(task.id)` | WIRED | `task-card.tsx` linha 17: `onComplete(task.id)`; `garden-view.tsx` linha 135: `onComplete={handleTaskComplete}` |
| `src/components/garden/garden-view.tsx` | `GardenHero (titheDone state)` | `titheDone={titheDone}` (state, não seed) | WIRED | Linha 104: `titheDone={titheDone}` — state corretamente passado (Pitfall 1 resolvido) |
| `src/components/tasks/bottom-nav.tsx` | DOM `#section-garden/#section-tasks/#section-savings` | IntersectionObserver + getElementById | WIRED | `bottom-nav.tsx` linhas 75-77; anchors confirmados em `garden-view.tsx` |

### Data-Flow Trace (Level 4)

| Artifact | Variável de Dado | Fonte | Dados Reais | Status |
|----------|-----------------|-------|-------------|--------|
| `SavingsCard` | `savings`, `goal` (props) | `garden-view.tsx` linha 145: `seed.savings`, `seed.goal` | Sim — vêm de `GardenSeed` seed passado à página | FLOWING |
| `TaskCard` | `task` (prop do array `tasks`) | `garden-view.tsx` useState inicializado de `seed.tasks` | Sim — array real de GardenTask com id/title/emoji/done | FLOWING |
| `TitheCard` | `done` (prop) | `garden-view.tsx` useState `titheDone` inicializado de `seed.titheDone` | Sim — state interativo, mutável via handleTithe | FLOWING |
| `BottomNav` | `active` (state interno) | useState('garden') + IntersectionObserver | Sim — IntersectionObserver observa seções DOM reais | FLOWING |

**Nota:** `seed.savings = 25` e `seed.goal = 100` são valores mock documentados (D-15). A conexão com dados reais do backend é escopo da Fase 6 (API Integration), explicitamente declarado em `04-04-SUMMARY.md`.

### Behavioral Spot-Checks

| Comportamento | Comando | Resultado | Status |
|--------------|---------|-----------|--------|
| 18 testes child-tasks + bottom-nav passam | `npm run test -- tests/unit/child-tasks.test.tsx tests/unit/bottom-nav.test.tsx` | 2 arquivos, 18 testes — PASS | PASS |
| Testes de garden-view não regridem | `npm run test -- tests/unit/garden-view.test.tsx` | 1 arquivo, 3 testes — PASS | PASS |
| GardenSeed tem 6 ocorrências de savings:25 | `grep -c 'savings: 25' src/lib/seed/garden-seed.ts` | 6 | PASS |
| titheDone usa state (não seed.titheDone) em GardenHero | `grep -c 'titheDone={titheDone}' src/components/garden/garden-view.tsx` | 1 | PASS |
| Stub antigo (line-through) removido | `grep -c 'line-through' src/components/garden/garden-view.tsx` | 0 | PASS |
| Arquivos Fase 4 sem debt markers (TBD/FIXME/XXX) | `grep -rn 'TBD\|FIXME\|XXX' src/components/tasks/ src/components/garden/garden-view.tsx` | sem output | PASS |

### Probe Execution

Step 7c: SKIPPED — não há probes declaradas no PLAN desta fase.

### Requirements Coverage

| Requirement | Plano de Origem | Descrição | Status | Evidência |
|-------------|----------------|-----------|--------|-----------|
| CTASK-01 | 04-01, 04-02, 04-04 | Lista de task cards: pendente (branco) / concluído (verde suave #EEF3EA) | SATISFIED | `task-card.tsx` linha 35; 4 testes passam em `child-tasks.test.tsx` |
| CTASK-02 | 04-01, 04-02, 04-04 | Botão check circular 38×38px — desmarcado / marcado (#3E6B4F + check branco) | SATISFIED | `task-card.tsx` linhas 40-71; `aria-pressed`; `disabled={task.done}` |
| CTASK-03 | 04-01, 04-02, 04-04 | Card de dízimo com botão "Plantar" gradiente rosa → "Feito ✓" | SATISFIED | `tithe-card.tsx` completo; `titheDone` state no GardenView |
| CTASK-04 | 04-01, 04-02, 04-04 | Card de cofrinho com meta, valor e progress bar animada (.6s cubic-bezier) | SATISFIED | `savings-card.tsx`; `role="progressbar"`; animação via setTimeout(0) |
| CTASK-05 | 04-01, 04-03, 04-04 | Bottom nav fixo 80px com 4 ícones; ativo verde #3E6B4F | SATISFIED | `bottom-nav.tsx`; `position: fixed`; `height: 80`; IntersectionObserver; 4 testes passam |

**Todos os 5 requirements declarados (CTASK-01..05) estão satisfeitos.**

### Anti-Patterns Found

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `garden-view.tsx` | 105 | `canHarvest={harvested}` em vez de `canHarvest={canHarvest}` | WARNING | HarvestGlow no GardenHero invertido: aparece após colheita em vez de antes. HarvestButton (linha 115) usa a variável correta `canHarvest`. GARD-08 é Phase 3 Pending — não está no escopo da Fase 4. |
| `task-card.tsx` | 15 | `role="checkbox"` em elemento `<button>` com `aria-pressed` | WARNING | Semântica ARIA inconsistente: `role="checkbox"` exige `aria-checked`, não `aria-pressed`. O comportamento funcional está correto e os testes passam via `getByRole('checkbox')` — o contrato de teste e a implementação estão sincronizados, mas a ARIA spec está violada para leitores de tela reais. |
| `savings-card.tsx` | 14 | `(savings / goal) * 100` sem guard para `goal === 0` | WARNING | Divisão por zero produziria `Infinity` em `aria-valuemax`. Não afeta os seeds atuais (goal: 100 sempre), mas é risco para dados reais do backend (Fase 6). |
| `garden-seed.ts` | 35 | `SEED_STAGE_A.tasks = BASE_TASKS` (referência direta) | INFO | Todos os outros seeds usam `.map()`. Risco de contaminação entre testes se um mutasse o array. Não afeta a Fase 4 dado que `GardenView` usa `useState(seed.tasks)` e não muta o array original. |

**Nenhum debt marker (TBD/FIXME/XXX) encontrado nos arquivos da Fase 4.**

### Human Verification Required

#### 1. Fluxo visual de colheita (impacto de CR-01)

**Test:** Marcar todas as 4 tarefas em `/child/[childId]/garden` (usando SEED_STAGE_A ou SEED_STAGE_B). Observar o GardenHero antes de clicar "Colher Frutos".
**Expected:** O HarvestGlow (animação de glow no hero) deve aparecer quando o jardim está pronto para colher (todas as tarefas concluídas). Atualmente o código passa `canHarvest={harvested}` em vez de `canHarvest={canHarvest}`, invertendo o estado visual.
**Why human:** Bug CR-01 identificado na revisão de código (`garden-view.tsx` linha 105). GARD-08 é Fase 3 Pending — mas o GardenHero.canHarvest prop afeta o layout também (`{!canHarvest && (...)}` controla visibilidade de elementos). Requer decisão: corrigir agora ou deferir para Fase 3 bug fix.

#### 2. Fluxo Plantar dízimo → flores no hero (Pitfall 1 — pré-condição CTASK-03)

**Test:** Abrir `/child/[childId]/garden`, clicar no botão "Plantar" no TitheCard. Observar o GardenHero.
**Expected:** Botão muda para "Feito ✓" (desabilitado, cor #B07E91) E as `DecorativeFlowers` aparecem no hero do jardim visualmente.
**Why human:** O wiring `titheDone state → GardenHero titheDone → DecorativeFlowers.visible` está verificado no código (linhas 42, 69, 104, 141 do garden-view.tsx). O SUMMARY declara aprovação no checkpoint visual, mas isso é afirmação de SUMMARY — não evidência codebase verificável. `DecorativeFlowers` usa animações CSS que não são testáveis em jsdom.

#### 3. Animação da progress bar do SavingsCard (0% → target%)

**Test:** Carregar `/child/[childId]/garden` e scrollar até o SavingsCard.
**Expected:** A progress bar anima visivelmente de 0% até ~25% (savings/goal * 100) ao entrar na viewport.
**Why human:** A correção `setTimeout(0)` foi aplicada em `savings-card.tsx` (commit 7bce2b8) mas `setTimeout` é mockado no ambiente jsdom dos testes. A animação CSS depende do pipeline de paint do browser real.

#### 4. BottomNav: active state por scroll e scroll anchor

**Test:** Abrir a página de jardim e scrollar verticalmente. Observar os 4 ícones do BottomNav.
**Expected:** Ícone "Jardim" ativo por padrão (verde #3E6B4F). Ao scrollar para baixo, ícone muda para "Tarefas" quando #section-tasks está visível, depois "Cofrinho" quando #section-savings está visível. Clicar em cada ícone faz scroll suave até a seção correspondente. "Doar" não responde ao clique.
**Why human:** IntersectionObserver está mockado nos testes unitários (`tests/setup.ts`). O comportamento de scroll e mudança de active state via IntersectionObserver real só é verificável no browser.

---

## Gaps Summary

Não há gaps que bloqueiem o objetivo da fase. Todos os 10 must-haves foram verificados como PASSED no codebase real. Os 4 itens de verificação humana são comportamentos visuais/runtime que os testes automatizados não cobrem (animações, IntersectionObserver real, fluxos de browser).

O CR-01 (`canHarvest={harvested}`) é um bug de wiring no GardenHero mas: (1) HarvestButton usa a variável correta e os testes passam; (2) GARD-08 está marcado como Phase 3 Pending; (3) o objetivo da Fase 4 não inclui o HarvestGlow visual. Requer decisão humana sobre quando corrigir.

---

_Verified: 2026-06-22T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
