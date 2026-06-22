---
phase: 3
slug: child-garden
status: approved
reviewed_at: 2026-06-21
shadcn_initialized: false
preset: none
created: 2026-06-21
---

# Phase 3 — UI Design Contract: Child Garden

> Contrato visual e de interação para a tela principal da criança (`/child/[childId]/garden`).
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — Tailwind v4 com tokens CSS customizados (`@theme` em `globals.css`) |
| Preset | not applicable |
| Component library | none (componentes React próprios sem biblioteca base) |
| Icon library | SVG inline (padrão do projeto) — `lucide-react` disponível como fallback |
| Font | Plus Jakarta Sans — pesos 400/500/600/700/800 (já configurada na Fase 1) |

> **Fonte:** `components.json` ausente (shadcn não inicializado). Tokens detectados em `src/app/globals.css` via `@theme`. Padrão estabelecido nas Fases 1 e 2.

---

## Spacing Scale

Escala baseada em múltiplos de 4, alinhada com os valores do design handoff:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gaps entre ícones inline, padding interno de badges |
| sm | 8px | Gaps entre elementos dentro de cards, padding de chips |
| md | 16px | Padding padrão de cards, espaço entre seções do header |
| lg | 24px | Padding do hero, separação entre hero e conteúdo |
| xl | 32px | Margem entre grupos de conteúdo |
| 2xl | 48px | Padding superior da página |
| 3xl | 64px | Reservado — não usado nesta fase |

Exceções:
- **Hero garden container:** altura fixa 316px (valor do design handoff — não múltiplo de 4, mantido por fidelidade)
- **Botão check de tarefa:** 38×38px (valor do design handoff — mantido por fidelidade)
- **Avatar no header:** 46×46px com `border-radius: 15px` (valor do design handoff)
- **Touch targets mínimos:** 44px de área clicável para todos os botões (WCAG 2.5.5)
- **Bottom nav:** altura 80px (valor do design handoff — Fase 4; declarado aqui para não colisão de layout)

> **Fonte:** `design_handoff_kreds/README.md` §Hero e §Header; REQUIREMENTS.md GARD-01, GARD-02, GARD-04.

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 24px | 700 | 1.2 | Nome da criança no header, título do overlay de celebração |
| Heading | 18px | 700 | 1.25 | Label do badge de moedas, título do card de versículo |
| Body | 14px | 500 | 1.5 | Texto do speech bubble, labels de tracker de água, copy da celebração |
| Label | 12px | 700 | 1.4 | Badge de estação, subtexto de header, link "Trocar perfil" (herdado), referência bíblica no overlay |

Pesos em uso: **500** (Body) e **700** (Display, Heading, Label, CTAs). Peso `600` não utilizado nesta fase.

Letter-spacing para Display e Heading: `-0.01em` (padrão do design handoff).

> **Fonte:** `design_handoff_kreds/README.md` §Tipografia; padrão detectado em `src/components/auth/pin-screen.tsx` (fontSize 24/12px, fontWeight 700/500).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F2F0E7` / `var(--color-kreds-bg)` | Fundo da página, fundo do overlay de celebração (`rgba(244,241,232,.98)`) |
| Secondary (30%) | `#FBFAF5` / `var(--color-kreds-card)` | Hero container, speech bubble, tracker pill, badges |
| Accent (10%) | `#3E6B4F` / `var(--color-kreds-primary)` | Reservado para: dots de água preenchidos via `#6E9BA0`, estado ativo da planta (nenhum elemento direto nesta fase usa verde para CTA — o acento é aplicado como glow/highlight) |
| Harvest CTA | `#B5623F` / `var(--color-kreds-orange)` | Botão "Colher Frutos" (gradiente `#C77F52→#B5623F`) — único CTA destrutivo/de ação forte nesta fase |
| Destructive | `#B14A2E` / `var(--color-kreds-error)` | Não usado nesta fase (sem ações destrutivas) |

### Paleta específica do jardim

| Token | Hex | Elemento |
|-------|-----|---------|
| Céu gradient top | `#CFE0D8` | Hero — topo do gradiente de céu |
| Céu gradient mid | `#DCE6CC` | Hero — meio do gradiente |
| Céu gradient bot | `#CCD8AF` | Hero — base do gradiente |
| Morros | `#BBCB9E` / `#A9BA8B` | Dois círculos de colina no hero |
| Chão gradient | `#AFC289 → #96AB71` | Faixa de terra 52px, border-radius elíptico superior |
| Água (tracker ativo) | `#6E9BA0` / `var(--color-kreds-water)` | Dots preenchidos no tracker de água |
| Água (tracker vazio) | `rgba(255,255,255,.35)` | Dots não preenchidos no tracker |
| Coin badge | `#E3C57C` / `var(--color-kreds-coin)` | SVG do ícone de moeda |
| Coin text | `#9A7320` / `var(--color-kreds-gold)` | Valor em R$ no badge de moedas |
| Texto principal | `#27372C` / `var(--color-kreds-text)` | Todos os títulos e body |
| Texto muted | `#7C8676` / `var(--color-kreds-muted)` | Subtítulo do header |
| Rosa dízimo | `#C98AA0` / `var(--color-kreds-rose)` | Flores decorativas (GARD-09) |

**Acento reservado para:**
- Dot de água preenchido (`#6E9BA0`)
- Glow de colheita (circle radial amarelo ao redor da planta quando `canHarvest = true`)
- Animação `kredsNew` (ring verde 1.2s — não usada nesta fase, mas disponível)

> **Fonte:** `design_handoff_kreds/README.md` §Hero §Design Tokens; `src/app/globals.css` variáveis `@theme`; REQUIREMENTS.md GARD-02, GARD-04.

---

## Component Inventory

### Componentes novos desta fase

| Componente | Path | Props-chave |
|------------|------|-------------|
| `GardenPage` | `src/app/(child)/child/[childId]/garden/page.tsx` | Server Component; injeta seed data |
| `GardenHeader` | `src/components/garden/garden-header.tsx` | `name`, `initial`, `coins` |
| `GardenHero` | `src/components/garden/garden-hero.tsx` | `stage`, `season`, `waterCount`, `titheDone`, `canHarvest`, `showBubble`, `bubbleText` |
| `PlantStage` | `src/components/garden/plant-stage.tsx` | `stage: 'a' | 'b' | 'c' | 'd'`, `droop`, `pop` |
| `WaterTracker` | `src/components/garden/water-tracker.tsx` | `filled: number` (0–4) |
| `SeasonBadge` | `src/components/garden/season-badge.tsx` | `season`, `dotColor` |
| `SpeechBubble` | `src/components/garden/speech-bubble.tsx` | `text`, `visible` |
| `HarvestButton` | `src/components/garden/harvest-button.tsx` | `visible`, `onHarvest` |
| `HarvestGlow` | `src/components/garden/harvest-glow.tsx` | `visible` — radial amarelo absoluto |
| `WaterDrops` | `src/components/garden/water-drops.tsx` | `trigger: number` — remonta ao mudar (GARD-05) |
| `DecorativeFlowers` | `src/components/garden/decorative-flowers.tsx` | `visible` — SVG inline flores (GARD-09) |
| `CelebrationOverlay` | `src/components/garden/celebration-overlay.tsx` | `visible`, `verse`, `onClose` |
| `ConfettiField` | `src/components/garden/confetti-field.tsx` | Interno — 20 divs com delays escalonados |

### Componentes reutilizados (Fase 2)

| Componente | Path | Uso nesta fase |
|------------|------|----------------|
| Tokens CSS | `src/app/globals.css` | Todas as animações já implementadas como `--animate-kreds-*` |

> **Fonte:** `03-CONTEXT.md` §code_context; REQUIREMENTS.md GARD-01..10; padrão de organização detectado em `src/components/auth/`.

---

## Animation Contract

Todas as animações já existem em `src/app/globals.css`. Aplicar via variável CSS no `style` prop ou classe utilitária.

| Animação | Variável CSS | Elemento | Gatilho |
|----------|-------------|----------|---------|
| `kredsSun` | `--animate-kreds-sun` | Círculo do sol no hero | Sempre (infinite) |
| `kredsDrift1` | `--animate-kreds-drift1` | Nuvem esquerda | Sempre (infinite) |
| `kredsDrift2` | `--animate-kreds-drift2` | Nuvem direita | Sempre (infinite) |
| `kredsPop` | `--animate-kreds-pop` | PlantStage | Ao completar tarefa (GARD-05) |
| `kredsDrop` | `--animate-kreds-drop` | 5× WaterDrop divs | Ao completar tarefa (GARD-05) |
| `kredsBubble` | `--animate-kreds-bubble` | SpeechBubble | Ao montar / mudar estado |
| `kredsFruit` | `--animate-kreds-fruit` | HarvestButton | Quando `canHarvest = true` (infinite) |
| `kredsConfetti` | `--animate-kreds-confetti` | 20× confetes | Ao abrir overlay (GARD-10) |
| `kredsCele` | `--animate-kreds-cele` | Card do versículo | Entrada do overlay |

**WaterDrop — delays escalonados:**
```
drop 0: delay 0ms
drop 1: delay 80ms
drop 2: delay 160ms
drop 3: delay 240ms
drop 4: delay 320ms
```

**Confetes — array estático de 20 posições (não usar `Math.random()` em render):**
- Gerar array de 20 objetos `{ left, delay, color }` como constante fora do componente
- `delay` distribuído de 0ms a 2000ms em incrementos de ~100ms
- Cores: `#3E6B4F`, `#E3C57C`, `#C98AA0`, `#6E9BA0`, `#B5623F`

> **Fonte:** `03-CONTEXT.md` §specifics; `design_handoff_kreds/README.md` §Animações; `src/app/globals.css`.

---

## Layout & Interaction Contract

### Página `/child/[childId]/garden`

- **Container:** `min-h-screen`, fundo `var(--color-kreds-bg)` (`#F2F0E7`), `max-width: 392px`, centralizado horizontalmente
- **Scroll:** vertical, sem scroll horizontal
- **Bottom nav placeholder:** `padding-bottom: 80px` reservado (nav implementada na Fase 4)

### Header (GARD-01)

```
[ Avatar 46×46px ] [ Nome Display/24/700  ] [ Coin badge ]
                   [ Subtítulo Label/12    ]
```

- **Avatar:** gradiente `#5A8A66 → #3E6B4F`, `border-radius: 15px`, inicial da criança em branco 700
- **Coin badge:** pill `#FBFAF5` com borda `#ECE7DB`; ícone SVG coin `#E3C57C` + valor `#9A7320` Heading/18/700

### Hero Garden (GARD-02, GARD-03, GARD-04, GARD-06, GARD-07, GARD-08, GARD-09)

- **Container:** `height: 316px`, `border-radius: 28px`, `overflow: hidden`, céu gradiente
- **Sol:** círculo 58px, posição `top: 16px right: 24px`, `animation: var(--animate-kreds-sun)`
- **Nuvens:** 2 pills brancas, `animation: var(--animate-kreds-drift1)` e `drift2`
- **Morros:** 2 círculos `width: 260px height: 260px` posicionados `absolute` nos cantos inferiores
- **Chão:** `height: 52px`, gradiente `#AFC289 → #96AB71`, `border-radius: 999px 999px 0 0` (elíptico no topo)
- **Badge estação:** `position: absolute top-3 left-3`, pill `bg #FBFAF5`
- **Tracker de água:** `position: absolute top-3 right-3`, pill com 4 dots de 8px
- **Speech bubble:** `position: absolute`, centralizado horizontalmente, `bottom: 60px`, visível via `kredsBubble`
- **Planta:** `position: absolute bottom: 30px`, centralizada, `<img>` de `garden/plant-[a-d].png`, `drop-shadow(0 4px 8px rgba(0,0,0,.15))`, `rotate: -2.5deg` quando `hasPending = true` (tarefas pendentes), `transform-origin: 50% 94%`
- **Drops de água:** 5 divs `position: absolute`, espalhados horizontalmente sobre a planta
- **Flores dízimo:** SVG inline, `position: absolute`, visível quando `titheDone = true`
- **Glow colheita:** div circle `position: absolute`, radial-gradient amarelo, `opacity: 0` → `1` quando `canHarvest = true`
- **Botão "Colher Frutos":** `position: absolute top-3 right-3` (quando visível, substitui tracker ou posição alternada — verificar no protótipo), gradiente `#C77F52 → #B5623F`, `border-radius: 999px`, `animation: var(--animate-kreds-fruit)`, somente quando `canHarvest = true`

> **Nota de posicionamento:** Verificar no `design_handoff_kreds/Kreds Kids Garden.dc.html` se o botão "Colher Frutos" substitui o tracker de água ou aparece em posição diferente quando `canHarvest = true`.

### Estágios da Planta (GARD-03)

Mapeamento `doneCount → stage` (Claude's Discretion — proporcional ao seed de 4 tarefas):

| doneCount | stage | Arquivo |
|-----------|-------|---------|
| 0 | a | `garden/plant-a.png` |
| 1 | b | `garden/plant-b.png` |
| 2–3 | c | `garden/plant-c.png` |
| 4 (todas) | d | `garden/plant-d.png` |

### Speech Bubble — Textos Contextuais (GARD-07)

Tom: cristão/encorajador, em português brasileiro.

| Estado | Texto |
|--------|-------|
| `stage = 'a'` (sem tarefas) | "Seu jardim está esperando por você! Complete uma tarefa para começar." |
| `stage = 'b'` (1 tarefa feita) | "Que começo incrível! Continue regando seu jardim." |
| `stage = 'c'` (2–3 tarefas feitas) | "Sua dedicação está fazendo o jardim florescer!" |
| `stage = 'd'` (todas feitas, não colhido) | "Uau! Seu jardim está completo. Hora de colher os frutos!" |
| `titheDone = true` | "Separando para Deus primeiro — que generosidade!" |
| `harvested = true` | "Você colheu seu jardim! Novo ciclo começa em breve." |

Bubble visível em todos os estados exceto `harvested = true` (quando o overlay substitui).

> **Fonte:** Claude's Discretion — `03-CONTEXT.md`; tom cristão conforme `REQUIREMENTS.md` core value e `design_handoff_kreds/README.md`.

### Overlay de Celebração (GARD-10)

- **Fundo:** `position: fixed inset-0 z-50`, `background: rgba(244,241,232,.98)`
- **Entrada:** card do versículo com `animation: var(--animate-kreds-cele)`
- **Confetes:** 20 divs `position: absolute`, array estático de posições/delays/cores
- **Card de versículo:** `bg #FBFAF5`, `border-radius: 20px`, `box-shadow: var(--shadow-card)`, padding 24px
  - Texto do versículo: Body/14/500, `color: var(--color-kreds-text)`
  - Referência: Label/12/700, `color: var(--color-kreds-muted)`
- **Botão "Voltar ao jardim":** 52px altura, `border-radius: 13px`, `bg var(--color-kreds-primary)`, texto branco 700, `box-shadow: var(--shadow-cta)`

---

## Seed Data Contract (D-01, D-02)

Constantes cobrindo todos os estados testáveis. Definir em `src/lib/seed/garden-seed.ts`:

```ts
// Exportar pelo menos estas constantes para teste visual:
export const SEED_STAGE_A  // 0 tarefas concluídas
export const SEED_STAGE_B  // 1 tarefa concluída
export const SEED_STAGE_C  // 3 tarefas concluídas
export const SEED_STAGE_D  // todas concluídas, sem colheita
export const SEED_HARVESTED // todas concluídas, colhida
export const SEED_TITHE    // dízimo marcado
```

Cada constante é um objeto com: `{ childName, coins, tasks[], titheDone, harvested, season }`.

### Bible Verses — Seed (D-07, D-08)

Migração Drizzle cria tabela `bible_verses`. Seed inicial com 7 versículos:

| # | Referência | Texto |
|---|-----------|-------|
| 1 | Colossenses 3:23 | "Tudo o que fizerem, façam de todo o coração, como para o Senhor." |
| 2 | Provérbios 3:9 | "Honra ao Senhor com os teus bens e com as primícias de todos os teus frutos." |
| 3 | 2 Coríntios 9:7 | "Cada um dê conforme determinou em seu coração, pois Deus ama quem dá com alegria." |
| 4 | Lucas 6:38 | "Dai, e ser-vos-á dado." |
| 5 | Provérbios 11:24 | "Há quem dê generosamente e fique mais rico; há quem retenha o que é seu e fique mais pobre." |
| 6 | Gálatas 6:9 | "Não nos cansemos de fazer o bem, pois a seu tempo colheremos, se não desanimarmos." |
| 7 | Mateus 6:20 | "Acumulem para si tesouros no céu, onde a traça e a ferrugem não destroem." |

Seleção: `ORDER BY RANDOM() LIMIT 1` via Drizzle query simples.

> **Fonte:** Claude's Discretion — `03-CONTEXT.md` D-06, D-07, D-08; tom cristão/mordomia/colheita.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Colher Frutos" (botão de colheita — único CTA de ação principal nesta fase) |
| Empty state heading | "Seu jardim está esperando por você!" |
| Empty state body | "Complete uma tarefa para começar a regar sua planta." |
| Post-harvest state | "Você colheu seu jardim! Novo ciclo começa em breve." |
| Celebration overlay title | "Parabéns! Você colheu seu jardim!" |
| Celebration back button | "Voltar ao jardim" |
| Error state | Não aplicável nesta fase (sem formulários, dados são seed mockado) |
| Destructive confirmation | Não aplicável nesta fase (GARD-08: colheita sem POST real — D-09) |
| Season labels | "Primavera" / "Verão" / "Outono" / "Inverno" (com dot colorido por estação) |

### Season Dot Colors

| Estação | Dot Color |
|---------|-----------|
| Primavera | `#5A8A66` (verde) |
| Verão | `#E3C57C` (amarelo) |
| Outono | `#B5623F` (laranja) |
| Inverno | `#6E9BA0` (azul água) |

> **Fonte:** REQUIREMENTS.md GARD-06, GARD-08, GARD-10; `03-CONTEXT.md` D-09, D-10; design handoff §Celebração.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — shadcn não inicializado |
| third-party | none | not applicable |

Todos os componentes são implementações próprias. `lucide-react` (já no `package.json`) pode ser usado para ícones utilitários internos (ex: ícone de gota no tracker), mas o padrão do projeto é SVG inline para elementos visuais do design handoff.

---

## Accessibility Notes

- Planta (`<img>`): `alt="Planta no estágio [X] — [descrição do estágio]"`
- Botão "Colher Frutos": `aria-label="Colher os frutos do jardim"` quando visível
- Overlay de celebração: `role="dialog"`, `aria-modal="true"`, foco capturado no botão "Voltar ao jardim"
- Tracker de água: `aria-label="Tracker de água: X de 4 tarefas concluídas"`
- Confetes: `aria-hidden="true"`
- Sol e nuvens: `aria-hidden="true"`

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
