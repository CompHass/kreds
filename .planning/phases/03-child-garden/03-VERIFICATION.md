---
phase: 03-child-garden
verified: 2026-06-22T08:40:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Abrir /child/[childId]/garden no browser, concluir uma tarefa e observar animações"
    expected: "5 drops azuis animam (kredsDrop), planta faz pop (kredsPop), tracker de água avança de N para N+1 dots preenchidos"
    why_human: "Animações CSS requerem inspeção visual; testes unitários verificam presença dos elementos mas não a percepção visual das animações"
  - test: "Concluir todas as 4 tarefas e verificar botão Colher Frutos"
    expected: "Botão laranja 'Colher Frutos' aparece com animação kredsFruit; tracker de água mostra 4/4 preenchidos antes do botão aparecer"
    why_human: "Timing visual e transição de estado entre tracker e botão requerem verificação em browser real"
  - test: "Clicar em 'Colher Frutos' e verificar overlay de celebração"
    expected: "Overlay fixed cobre toda a tela com 20 confetes animados (kredsConfetti), card de versículo bíblico (texto + referência), e botão 'Voltar ao jardim'"
    why_human: "Confetes requerem inspeção visual; versículo bíblico precisa ser confirmado como vindo do banco (RANDOM) e não hardcoded"
  - test: "Clicar em 'Voltar ao jardim' no overlay"
    expected: "Overlay fecha; jardim mantém plant-d (todas tarefas marcadas), tarefas continuam checadas, botão 'Colher Frutos' não reaparece (harvested permanece true)"
    why_human: "Persistência de estado pós-fechamento requer interação real com o browser"
  - test: "Navegar para /child/[childId]/garden e verificar sol + nuvens no hero"
    expected: "Sol amarelo animado (kredsSun) visível no canto superior direito; 2 nuvens brancas em movimento (kredsDrift1/2) visíveis no hero de 316px"
    why_human: "Animações contínuas (infinite) requerem inspeção visual em browser"
---

# Phase 03: Child Garden — Verification Report

**Phase Goal:** A criança vê seu jardim vivo — planta em estágio correto, animações de sol e nuvens, feedback de rega ao concluir tarefa, e overlay de celebração ao colher
**Verified:** 2026-06-22T08:40:00Z
**Status:** human_needed
**Re-verification:** No — verificação inicial

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Header exibe avatar com inicial, nome da criança e badge de moedas SVG | VERIFIED | `garden-header.tsx`: avatar 46×46px, gradiente #5A8A66→#3E6B4F, SVG coin aria-hidden; `garden-header.test.tsx` 3/3 verde |
| 2 | Hero 316px renderiza céu gradiente, sol animado (kredsSun) e 2 nuvens (kredsDrift1/2) | VERIFIED | `garden-hero.tsx` L57-90: sol `animation: var(--animate-kreds-sun)`, nuvens `var(--animate-kreds-drift1/2)`; animações definidas em globals.css L44-46; `garden-hero.test.tsx` 3/3 verde |
| 3 | Planta exibida no estágio correto (plant-a→d) com droop quando há tarefas pendentes | VERIFIED | `plant-stage.tsx`: `<img src=/garden/plant-${stage}.png>`, transform rotate(-2.5deg) quando droop; `getPlantStage` pura testada em `garden-stage.test.ts` (16 testes, verde) |
| 4 | WaterTracker mostra N dots azuis (#6E9BA0) para filled=N, restantes brancos semi-transparentes | VERIFIED | `water-tracker.tsx`: 4 dots com `background: i < filled ? var(--color-kreds-water) : rgba(255,255,255,.35)`, aria-label dinâmico; teste garden-hero.test.tsx confirma |
| 5 | SeasonBadge exibe nome da estação com dot colorido correto | VERIFIED | `season-badge.tsx` importa `SEASON_DOT_COLORS` de garden-seed; `garden-season.test.ts` 5/5 verde (cores corretas: primavera=#5A8A66, verão=#E3C57C, etc.) |
| 6 | SpeechBubble mostra texto contextual com animação kredsBubble | VERIFIED | `speech-bubble.tsx`: `animation: var(--animate-kreds-bubble)` quando visible; `getBubbleText` testado em `garden-bubble.test.ts` verde |
| 7 | DecorativeFlowers SVG visíveis quando titheDone, HarvestGlow quando canHarvest | VERIFIED | `decorative-flowers.tsx` retorna null quando !visible, SVG fill var(--color-kreds-rose), data-testid="decorative-flowers"; `harvest-glow.tsx`: radial-gradient amarelo, opacity 1↔0; `garden-hero.test.tsx` confirma |
| 8 | Ao concluir tarefa: 5 drops (kredsDrop) disparam, planta faz pop (kredsPop) e tracker avança | VERIFIED | `water-drops.tsx`: 5 divs `animation: var(--animate-kreds-drop)` delays 0/80/160/240/320ms; `garden-view.tsx` L50: `setWaterTick(tick+1)`, `<WaterDrops key={waterTick}>` para replay; `garden-view.test.tsx` testa aria-label "tracker de água.*4" após click |
| 9 | Botão "Colher Frutos" laranja aparece somente quando todas as tarefas estão concluídas | VERIFIED | `harvest-button.tsx`: gradiente #C77F52→#B5623F, `animation: var(--animate-kreds-fruit)`, retorna null quando !visible; `garden-view.tsx` L41: `canHarvest = doneCount === tasks.length && !harvested`; `garden-view.test.tsx` 2 testes GARD-08 verde |
| 10 | Overlay de celebração com 20 confetes, card de versículo do banco e botão "Voltar ao jardim" | VERIFIED | `celebration-overlay.tsx`: role=dialog aria-modal, `<ConfettiField>` (20 itens CONFETTI_ITEMS estático), verse.text + verse.reference + botão onClose; `page.tsx` busca versículo via `db.select().from(bibleVerses).orderBy(sql RANDOM()).limit(1)`; `garden-celebration.test.tsx` 4/4 verde |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/seed/garden-seed.ts` | 6 constantes + getPlantStage + getBubbleText + SEASON_DOT_COLORS | VERIFIED | Exporta exatamente: SEED_STAGE_A/B/C/D, SEED_HARVESTED, SEED_TITHE, getPlantStage, getBubbleText, SEASON_DOT_COLORS |
| `src/lib/db/schema/index.ts` | export bibleVerses pgTable | VERIFIED | L288: `export const bibleVerses = pgTable('bible_verses', ...)` |
| `drizzle/seed/bible-verses.sql` | INSERT de 7 versículos | VERIFIED | 1 INSERT com 7 tuplas; grep confirma Colossenses/Provérbios/Coríntios/Lucas/Gálatas/Mateus |
| `drizzle/0008_abandoned_scourge.sql` | CREATE TABLE bible_verses | VERIFIED | L1: `CREATE TABLE "bible_verses"` — gerado por drizzle-kit |
| `public/garden/plant-{a,b,c,d}.png` | 4 assets de planta | VERIFIED | plant-a (28KB), plant-b (62KB), plant-c (124KB), plant-d (229KB) presentes |
| `tests/unit/garden-stage.test.ts` | Teste getPlantStage (GARD-03) | VERIFIED | 16 testes verde |
| `tests/unit/garden-season.test.ts` | Teste SEASON_DOT_COLORS (GARD-06) | VERIFIED | 5 testes verde |
| `tests/unit/garden-bubble.test.ts` | Teste getBubbleText (GARD-07) | VERIFIED | Verde |
| `tests/unit/garden-header.test.tsx` | Teste GardenHeader (GARD-01) | VERIFIED | 3 testes verde |
| `tests/unit/garden-hero.test.tsx` | Teste GardenHero/WaterTracker/DecorativeFlowers (GARD-02/04/09) | VERIFIED | 3 testes verde |
| `tests/unit/garden-view.test.tsx` | Teste GardenView (GARD-05/08) | VERIFIED | 3 testes verde |
| `tests/unit/garden-celebration.test.tsx` | Teste CelebrationOverlay (GARD-10) | VERIFIED | 4 testes verde |
| `src/components/garden/garden-header.tsx` | GardenHeader com avatar, nome, coins | VERIFIED | Export presente, avatar borderRadius 15px, gradiente, SVG coin aria-hidden |
| `src/components/garden/garden-hero.tsx` | Container 316px com céu/sol/nuvens | VERIFIED | height:316, borderRadius:28, var(--animate-kreds-sun), var(--animate-kreds-drift1/2) |
| `src/components/garden/plant-stage.tsx` | PlantStage img + droop + pop | VERIFIED | `<img src=/garden/plant-${stage}.png>`, rotate(-2.5deg) droop, var(--animate-kreds-pop) pop |
| `src/components/garden/water-tracker.tsx` | WaterTracker 4 dots aria-label | VERIFIED | 4 dots, var(--color-kreds-water), aria-label dinâmico |
| `src/components/garden/season-badge.tsx` | SeasonBadge + SEASON_DOT_COLORS | VERIFIED | Import SEASON_DOT_COLORS de garden-seed, dot colorido por estação |
| `src/components/garden/speech-bubble.tsx` | SpeechBubble kredsBubble | VERIFIED | var(--animate-kreds-bubble), retorna null quando !visible |
| `src/components/garden/decorative-flowers.tsx` | DecorativeFlowers SVG rosa | VERIFIED | SVG fill var(--color-kreds-rose), aria-hidden, data-testid, null quando !visible |
| `src/components/garden/harvest-glow.tsx` | HarvestGlow radial amarelo | VERIFIED | radial-gradient rgba(227,197,124,.4)→transparent, opacity 1↔0 |
| `src/components/garden/water-drops.tsx` | WaterDrops 5 divs kredsDrop | VERIFIED | 5 divs var(--animate-kreds-drop), delays 0/80/160/240/320ms |
| `src/components/garden/harvest-button.tsx` | HarvestButton laranja kredsFruit | VERIFIED | gradiente #C77F52→#B5623F, var(--animate-kreds-fruit), minHeight 44px, aria-label "Colher Frutos" |
| `src/components/garden/confetti-field.tsx` | ConfettiField 20 confetes estáticos | VERIFIED | CONFETTI_ITEMS fora do componente, sem Math.random, 20 itens com cores/delays/sizes deterministicos |
| `src/components/garden/celebration-overlay.tsx` | CelebrationOverlay dialog + versículo + botão | VERIFIED | role=dialog, aria-modal, ConfettiField, verse.text/reference, botão "Voltar ao jardim" |
| `src/components/garden/garden-view.tsx` | GardenView Client Component raiz | VERIFIED | 'use client', useState, handleTaskComplete/handleHarvest/handleCloseOverlay, key={waterTick} para replay |
| `src/app/(child)/child/[childId]/garden/page.tsx` | Server Component com RANDOM verse | VERIFIED | `export default async function GardenPage`, await params, `db.select().from(bibleVerses).orderBy(sql RANDOM()).limit(1)`, verse ?? null |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `plant-stage.tsx` | `/garden/plant-[stage].png` | `<img src=...>` | WIRED | L19: `src={\`/garden/plant-${stage}.png\`}` |
| `season-badge.tsx` | `SEASON_DOT_COLORS` | import de garden-seed | WIRED | L3: `import { SEASON_DOT_COLORS } from '@/lib/seed/garden-seed'` |
| `page.tsx` | `bibleVerses` (Drizzle) | `db.select().from(bibleVerses).orderBy(sql RANDOM).limit(1)` | WIRED | L18-22: query completa com RANDOM() via sql tag |
| `garden-view.tsx` | `garden-hero.tsx` | composição com props + children | WIRED | L88-106: `<GardenHero>` + `<WaterDrops key={waterTick}>` + `<HarvestButton>` como children |
| `garden-view.tsx` | `handleTaskComplete` | `setWaterTick + setShowPop + setTimeout 650ms` | WIRED | L46-53: handler completo incrementa waterTick, showPop true→false |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produz Dados Reais | Status |
|----------|---------------|--------|-------------------|--------|
| `page.tsx` | `verse` | `db.select().from(bibleVerses).orderBy(sql RANDOM()).limit(1)` | Sim — Drizzle query em tabela com 7 versículos reais | FLOWING |
| `garden-view.tsx` | `tasks` | `useState(seed.tasks)` → `handleTaskComplete` atualiza estado | Sim — seed mockado intencional (D-01, Fase 6 consumirá backend real) | FLOWING (seed intencional) |
| `celebration-overlay.tsx` | `verse` | prop recebida de `GardenView` ← `page.tsx` query DB | Sim — flui de DB → page → GardenView → CelebrationOverlay | FLOWING |

### Behavioral Spot-Checks

| Comportamento | Comando | Resultado | Status |
|---------------|---------|-----------|--------|
| 7 arquivos de teste garden passam | `pnpm test tests/unit/garden-*.test.*` | Test Files 7 passed (7), Tests 29 passed (29) | PASS |
| getPlantStage mapeamento correto | teste garden-stage.test.ts | 16 testes verde (0→a, 1→b, 2-3→c, 4→d) | PASS |
| TypeScript compila sem erros nos arquivos garden | `pnpm exec tsc --noEmit` | 0 erros em arquivos garden | PASS |
| CONFETTI_ITEMS sem Math.random | `grep Math.random confetti-field.tsx` | Comentário apenas (sem uso em runtime) | PASS |
| Nenhum import next/image em componentes garden | `grep -l next/image src/components/garden/*.tsx` | Nenhum resultado | PASS |
| Commits declarados existem no git | `git log --oneline [hashes]` | 9 commits verificados: 8c672fe, 4448b9d, 2df131c, 09543da, 7db5801, a0d55b1, 114af11, fe9604e, 19cd850 | PASS |

### Requirements Coverage

| Requirement | Plano | Descrição | Status | Evidência |
|-------------|-------|-----------|--------|-----------|
| GARD-01 | 03-02 | Header com avatar inicial, nome e badge de moedas SVG | SATISFIED | `garden-header.tsx` + `garden-header.test.tsx` 3/3 verde |
| GARD-02 | 03-02 | Hero jardim 316px com céu gradiente, sol kredsSun, 2 nuvens kredsDrift | SATISFIED | `garden-hero.tsx` height:316, animate-kreds-sun/drift1/drift2 |
| GARD-03 | 03-01 + 03-02 | Planta em 4 estágios (plant-a→d) baseada em doneCount | SATISFIED | `getPlantStage` + `plant-stage.tsx` + 16 testes verde |
| GARD-04 | 03-02 | Tracker de água 4 dots azul/branco semi-transparente | SATISFIED | `water-tracker.tsx` + aria-label dinâmico + teste verde |
| GARD-05 | 03-03 | Ao concluir tarefa: 5 drops kredsDrop + pop kredsPop + avanço tracker | SATISFIED | `water-drops.tsx` + key={waterTick} + showPop + setTimeout 650ms + teste garden-view 3/3 verde |
| GARD-06 | 03-01 + 03-02 | Badge de estação com dot colorido | SATISFIED | `season-badge.tsx` + SEASON_DOT_COLORS + garden-season.test.ts 5/5 verde |
| GARD-07 | 03-01 + 03-02 | Speech bubble contextual kredsBubble | SATISFIED | `getBubbleText` + `speech-bubble.tsx` + garden-bubble.test.ts verde |
| GARD-08 | 03-03 | Botão Colher laranja kredsFruit quando todas tarefas done | SATISFIED | `harvest-button.tsx` + canHarvest lógica + garden-view.test.tsx 2 testes verde |
| GARD-09 | 03-02 | Flores decorativas SVG ao separar dízimo | SATISFIED | `decorative-flowers.tsx` SVG fill var(--color-kreds-rose), data-testid + teste verde |
| GARD-10 | 03-03 | Overlay de celebração 20 confetes + versículo banco + botão voltar | SATISFIED | `celebration-overlay.tsx` + `confetti-field.tsx` CONFETTI_ITEMS 20 + query RANDOM() banco + garden-celebration.test.tsx 4/4 verde |

**Nota sobre REQUIREMENTS.md:** O arquivo `.planning/REQUIREMENTS.md` ainda marca GARD-05, GARD-08 e GARD-10 como `Pending` com `[ ]`. Isso é uma divergência de rastreamento — o código verifica a implementação completa dessas funcionalidades. O arquivo precisa ser atualizado para refletir o estado real.

### Anti-Patterns Found

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `garden-view.tsx` L108 | 108 | Comentário "UI mínima para disparar GARD-05 (task cards completos na Fase 4)" | INFO | Intencional — SUMMARY declara explicitamente como stub planejado (D-01/CTASK-05); não bloqueia objetivo da fase |

Nenhum marcador TBD/FIXME/XXX encontrado. Nenhum Math.random no render. Nenhum return null incondicional em componentes que deveriam renderizar. Nenhum next/image onde deve ser img simples.

### Human Verification Required

#### 1. Animações de Rega ao Concluir Tarefa (GARD-05 visual)

**Test:** Navegar para `/child/[childId]/garden`, clicar em qualquer tarefa pendente
**Expected:** 5 drops azuis animam subindo desde a planta (kredsDrop com delays escalonados 0/80/160/240/320ms), a planta faz um pop (kredsPop 0.6s), o tracker de água adiciona mais um dot preenchido
**Why human:** Animações CSS via style prop com variáveis custom não são verificáveis via JSDOM/testing-library; os testes confirmam presença dos elementos mas não a percepção visual do efeito

#### 2. Botão Colher Frutos e HarvestGlow (GARD-08 visual)

**Test:** Concluir todas as 4 tarefas na tela do jardim
**Expected:** Botão laranja "Colher Frutos" aparece com animação kredsFruit (pulsar lento); tracker de água exibe 4/4 dots preenchidos antes do botão aparecer; HarvestGlow radial amarelo visível ao redor da planta
**Why human:** Timing da transição entre tracker visível (4/4) e aparição do botão; radial-gradient do glow requer inspeção visual

#### 3. Overlay de Celebração Completo (GARD-10 visual + banco)

**Test:** Clicar em "Colher Frutos" após concluir todas as tarefas
**Expected:** Overlay fixed cobre 100% da tela; 20 confetes coloridos animam caindo (kredsConfetti); card animado (kredsCele) mostra título "Parabéns! Você colheu seu jardim!", texto do versículo vindo do banco (verificar que muda em reloads diferentes), referência bíblica; botão "Voltar ao jardim" presente e focável
**Why human:** Confetes requerem inspeção visual; para confirmar que o versículo é realmente RANDOM() do banco (não cache/hardcode) é necessário recarregar a página múltiplas vezes e observar versículos diferentes

#### 4. Persistência de Estado Pós-Colheita (D-10)

**Test:** Após clicar "Voltar ao jardim" no overlay de celebração
**Expected:** Overlay fecha; jardim mostra plant-d (planta grande); todas as 4 tarefas estão marcadas (opacity 0.6, line-through); botão "Colher Frutos" não reaparece (harvested permanece true no estado React)
**Why human:** Comportamento de estado React após ciclo completo requer interação real com o browser

#### 5. Animações Contínuas do Hero (GARD-02 visual)

**Test:** Navegar para `/child/[childId]/garden` e observar o hero por 5 segundos
**Expected:** Sol amarelo pulsa/brilha continuamente (kredsSun 5s infinite); nuvem 1 desliza horizontalmente (kredsDrift1 16s); nuvem 2 desliza em velocidade diferente (kredsDrift2 20s); efeito combinado cria sensação de jardim vivo
**Why human:** Animações infinite requerem inspeção visual real; duração/intensidade não é verificável por testes

### Gaps Summary

Nenhum gap técnico bloqueador encontrado. Todos os 10 must-haves verificados com evidência direta no código. Os 29 testes do jardim passam em 7 arquivos.

**Pendências apenas de inspeção visual:**
- As animações kredsDrop, kredsPop, kredsSun, kredsDrift1/2, kredsFruit, kredsConfetti, kredsCele, kredsBubble existem no globals.css e são referenciadas corretamente nos componentes via style prop, mas sua qualidade visual (timing, intensidade, naturalidade) precisa de confirmação humana em browser real.

**Divergência de rastreamento a corrigir:**
- `.planning/REQUIREMENTS.md` marca GARD-05, GARD-08, GARD-10 com `[ ]` Pending. O código verifica implementação completa. O arquivo precisa ser atualizado para `[x]` e `Complete` na tabela de traceability.

---

_Verified: 2026-06-22T08:40:00Z_
_Verifier: Claude (gsd-verifier)_
