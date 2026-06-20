---
phase: 1
slug: foundation
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-20
---

# Phase 1 — UI Design Contract: Foundation

> Contrato de tokens visuais e interação para o design system base. Gerado pelo gsd-ui-researcher. Esta fase não produz telas de usuário — ela define os tokens que TODAS as fases seguintes devem seguir.

**Fonte autoritativa:** `design_handoff_kreds/README.md` (fidelidade pixel a pixel obrigatória)
**Tech stack:** Next.js 16.2.7 + Tailwind CSS 4.3.0 (diretiva `@theme`) + `next/font/google`

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (CSS puro via `@theme` do Tailwind v4) |
| Preset | not applicable |
| Component library | none (fase de tokens — sem componentes React nesta fase) |
| Icon library | SVGs inline (nenhuma biblioteca externa — todos os ícones são SVG embutidos no markup) |
| Font | Plus Jakarta Sans (Google Fonts via `next/font/google`) |

**Nota:** shadcn não se aplica nesta fase. O design system é implementado inteiramente como CSS custom properties no bloco `@theme` do Tailwind v4. Fases 2–6 podem introduzir componentes shadcn se necessário — esta fase apenas fornece os tokens base.

---

## Spacing Scale

Valores declarados (múltiplos de 4). Implementados como `--spacing-*` no `@theme` do Tailwind v4:

| Token | Value | Classe Tailwind | Usage |
|-------|-------|-----------------|-------|
| xs | 4px | `p-1`, `gap-1` | Gaps de ícones, padding inline mínimo |
| sm | 8px | `p-2`, `gap-2` | Espaçamento compacto entre elementos |
| md | 16px | `p-4`, `gap-4` | Espaçamento padrão entre elementos |
| lg | 24px | `p-6`, `gap-6` | Padding de seções |
| xl | 32px | `p-8`, `gap-8` | Gaps de layout |
| 2xl | 48px | `p-12`, `gap-12` | Quebras de seção maiores |
| 3xl | 64px | `p-16`, `gap-16` | Espaçamento no nível de página |

**Exceções declaradas do design handoff:**
- Touch target mínimo para botão check da tarefa: **38×38px** (não múltiplo de 4 — fixado pelo handoff)
- Touch target para tecla do teclado PIN: **62px altura** (fixado pelo handoff)
- Bottom nav fixo: **80px altura** (fixado pelo handoff)
- Topbar do painel dos pais: **64px altura** (fixado pelo handoff)
- Sidebar do painel dos pais: **80px largura** (fixado pelo handoff)
- Painel direito do painel dos pais: **336px largura** (fixado pelo handoff)
- Hero jardim: **316px altura** (fixado pelo handoff)

---

## Typography

**Família:** Plus Jakarta Sans
**Fallback:** `system-ui, sans-serif`
**Importação:** `next/font/google` — `Plus_Jakarta_Sans` com `weight: ['400','500','600','700','800']`, `variable: '--font-plus-jakarta'`, `display: 'swap'`
**Mapeamento Tailwind:** `--font-sans: var(--font-plus-jakarta), system-ui, sans-serif` no `@theme`

| Role | Size | Weight | Line Height | Letter Spacing | Uso no Handoff |
|------|------|--------|-------------|----------------|----------------|
| Display | 24–26px | 800 | 1.2 | -0.01em | Títulos principais de tela (jardim, painel) |
| Heading | 18–20px | 700–800 | 1.2 | -0.01em | Títulos de seção, cabeçalhos de card |
| Body | 14–15.5px | 500–700 | 1.5 | 0 | Conteúdo de card, labels de tarefa |
| Caption | 11–13px | 600–700 | 1.4 | 0 | Labels, captions, badges de moeda |

**Regra de peso:** Apenas os pesos 400, 500, 600, 700 e 800 estão disponíveis. Não usar `font-weight: 300` ou `900`.

**Pesos por peso de uso:**
- 400 (regular): texto de suporte, placeholder de input
- 500 (medium): body padrão, subtítulos de card
- 600 (semibold): labels, captions, badges
- 700 (bold): títulos de seção, nomes de itens
- 800 (extrabold): títulos principais de tela, wordmark "kreds"

---

## Color

### Paleta de Tokens (DS-01)

Todos implementados como `--color-kreds-*` no `@theme` do Tailwind v4. Geram classes `bg-kreds-*`, `text-kreds-*`, `border-kreds-*` automaticamente.

| Token CSS | Hex | Classe Tailwind | Role (60/30/10) | Uso Específico |
|-----------|-----|-----------------|-----------------|----------------|
| `--color-kreds-bg` | `#F2F0E7` | `bg-kreds-bg` | Dominante (60%) | Background principal do app; `<body>` |
| `--color-kreds-card` | `#FBFAF5` | `bg-kreds-card` | Dominante (60%) | Fundo de cards, inputs, sidebar |
| `--color-kreds-border` | `#ECE7DB` | `border-kreds-border` | Dominante (60%) | Bordas padrão de cards e topbar |
| `--color-kreds-border-alt` | `#E2DECF` | `border-kreds-border-alt` | Dominante (60%) | Bordas de inputs e chips inativos |
| `--color-kreds-soft` | `#E7EFE8` | `bg-kreds-soft` | Secundária (30%) | Cards selecionados, fundo de estado ativo |
| `--color-kreds-hover` | `#EEF3EA` | `bg-kreds-hover` | Secundária (30%) | Hover em elementos verdes, tarefas concluídas |
| `--color-kreds-text` | `#27372C` | `text-kreds-text` | Secundária (30%) | Cor de texto principal (títulos) |
| `--color-kreds-muted` | `#7C8676` | `text-kreds-muted` | Secundária (30%) | Texto secundário (subtítulos de card) |
| `--color-kreds-hint` | `#9AA092` | `text-kreds-hint` | Secundária (30%) | Labels, placeholders, texto muted |
| `--color-kreds-primary` | `#3E6B4F` | `bg-kreds-primary`, `text-kreds-primary` | Acento (10%) | CTAs, ativo, selecionado, foco |
| `--color-kreds-primary-lt` | `#5A8A66` | `bg-kreds-primary-lt` | Acento (10%) | Gradientes, avatares, logo |
| `--color-kreds-orange` | `#B5623F` | `bg-kreds-orange`, `text-kreds-orange` | Acento (10%) | Botão Colher, categoria Estudos, erro |
| `--color-kreds-coin` | `#E3C57C` | `text-kreds-coin` | Acento (10%) | Ícone SVG de moeda |
| `--color-kreds-gold` | `#9A7320` | `text-kreds-gold` | Acento (10%) | Label de valor de recompensa em R$ |
| `--color-kreds-error` | `#B14A2E` | `text-kreds-error`, `bg-kreds-error` | Destrutivo | Botão excluir, erro de PIN, cor de erro |
| `--color-kreds-rose` | `#C98AA0` | `bg-kreds-rose`, `text-kreds-rose` | Acento (10%) | Card de dízimo, elemento de generosidade |
| `--color-kreds-water` | `#6E9BA0` | `bg-kreds-water` | Acento (10%) | Tracker de água (dots de rega concluída) |

### Distribuição 60/30/10

| Camada | Tokens | % Área Visual |
|--------|--------|---------------|
| Dominante (superfícies e bordas) | `kreds-bg`, `kreds-card`, `kreds-border`, `kreds-border-alt` | 60% |
| Secundária (texto e estados) | `kreds-soft`, `kreds-hover`, `kreds-text`, `kreds-muted`, `kreds-hint` | 30% |
| Acento (ação e identidade) | `kreds-primary`, `kreds-primary-lt`, `kreds-orange`, `kreds-coin`, `kreds-gold`, `kreds-rose`, `kreds-water` | 10% |
| Destrutivo (ação irreversível) | `kreds-error` | reservado |

### Acento Reservado Para

O acento verde (`kreds-primary` / `#3E6B4F`) é **exclusivamente** reservado para:
1. Botões CTA primários (Entrar, Adicionar tarefa, Salvar alterações)
2. Estado ativo/selecionado (filter chip ativo, pill de recorrência selecionado, criança selecionada)
3. Botão check marcado (fundo do checkmark)
4. Toggle switch no estado ON
5. Ícone da categoria "Espiritual"
6. Texto de breadcrumb de família no painel dos pais
7. Ícone do nav ativo no bottom nav e sidebar
8. Focus ring de input (`box-shadow: 0 0 0 3px rgba(62,107,79,.13)`)
9. Sombra CTA (`kreds-cta`)

**Nunca usar `kreds-primary` como cor de fundo de superfície ou texto decorativo.**

### Gradientes Especiais (não são tokens — são valores fixos no CSS)

| Elemento | Gradiente |
|----------|-----------|
| Fundo de página (radial) | `radial-gradient(120% 100% at 50% 0%, #ECE7DB 0%, #E0DACB 100%)` |
| Céu do jardim | `linear-gradient(180deg, #CFE0D8 0%, #DCE6CC 50%, #CCD8AF 100%)` |
| Morros do jardim | Círculos `#BBCB9E` e `#A9BA8B` |
| Chão do jardim | `linear-gradient(180deg, #AFC289 0%, #96AB71 100%)` |
| Avatar/logo | `linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)` |
| Botão Colher | `linear-gradient(135deg, #C77F52 0%, #B5623F 100%)` |
| Botão dízimo "Plantar" | `linear-gradient(135deg, #C98AA0 0%, #A55E76 100%)` |
| Progress bar cofrinho | `linear-gradient(90deg, #5A8A66 0%, #3E6B4F 100%)` |

---

## Border-Radius Tokens (DS-04)

Implementados como `--radius-*` no `@theme`. Geram classes `rounded-*` no Tailwind v4.

| Token CSS | Value | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--radius-app` | `26px` | `rounded-app` | Container principal do app (painel desktop 1180px) |
| `--radius-card-lg` | `20px` | `rounded-card-lg` | Hero do jardim, painel direito de edição |
| `--radius-card-md` | `18px` | `rounded-card-md` | Cards de tarefa (área da criança) |
| `--radius-card-sm` | `16px` | `rounded-card-sm` | Cards de tarefa (painel dos pais) |
| `--radius-input` | `13px` | `rounded-input` | Inputs de formulário, botões de ação primária |
| `--radius-chip` | `10px` | `rounded-chip` | Chips de categoria, chips de filtro, botão lápis |
| `--radius-pill` | `999px` | `rounded-pill` | Pills de recorrência, badges, toggles, tracker de água |

**Casos especiais (valores fixos, não tokens):**
- Tecla do teclado PIN: `border-radius: 50%` (círculo perfeito)
- Avatar da criança (área do jardim): `border-radius: 15px`
- Logo sidebar: `border-radius: 12px`
- Botão excluir (painel): `border-radius: 44px` (pill alto)
- Device bezel externo: `52px`, interno: `42px` (apenas no protótipo)

---

## Shadow Tokens (DS-04)

Implementados como `--shadow-*` no `@theme`. Geram classes `shadow-*` no Tailwind v4.

| Token CSS | Value | Classe Tailwind | Uso |
|-----------|-------|-----------------|-----|
| `--shadow-app` | `0 40px 90px -36px rgba(40,55,45,.55)` | `shadow-app` | Container principal do app (painel desktop) |
| `--shadow-card` | `0 16px 36px -26px rgba(40,55,45,.5)` | `shadow-card` | Painel direito de edição, cards com elevação |
| `--shadow-cta` | `0 12px 24px -12px rgba(62,107,79,.6)` | `shadow-cta` | Botão CTA primário verde |
| `--shadow-device` | `0 34px 70px -22px rgba(40,55,45,.5)` | `shadow-device` | Device frame (bezel do protótipo mobile) |

---

## Animation Contract (DS-03)

Todos os 15 keyframes implementados dentro do bloco `@theme` do Tailwind v4 (tree-shaking automático). Cada animação gera uma classe `animate-kreds-*` disponível em qualquer componente.

### Mapeamento `--animate-*` → Keyframe

| Classe Tailwind | Token CSS | Timing | Easing | Modo | Uso |
|----------------|-----------|--------|--------|------|-----|
| `animate-kreds-breath` | `--animate-kreds-breath` | 5s | ease-in-out | infinite | Plant hero do login (translateY 0→-5px) |
| `animate-kreds-pop` | `--animate-kreds-pop` | 0.6s | ease | once | Planta ao ser regada (scale 1→1.09→0.98→1) |
| `animate-kreds-sun` | `--animate-kreds-sun` | 5s | ease-in-out | infinite | Sol do jardim (scale 1→1.05) |
| `animate-kreds-drift1` | `--animate-kreds-drift1` | 16s | ease-in-out alternate | infinite | Nuvem 1 (translateX 0→34px) |
| `animate-kreds-drift2` | `--animate-kreds-drift2` | 20s | ease-in-out alternate | infinite | Nuvem 2 (translateX 0→-26px) |
| `animate-kreds-flutter` | `--animate-kreds-flutter` | 3s | ease-in-out | infinite | Borboleta decorativa (translateY + rotate) |
| `animate-kreds-fruit` | `--animate-kreds-fruit` | 1.4s | ease-in-out | infinite | Botão Colher pulsando (scale 1→1.06) |
| `animate-kreds-drop` | `--animate-kreds-drop` | 0.72s | ease-in | forwards | Gota de água ao regar (Y -12px→78px, opacity 0→1→0) |
| `animate-kreds-confetti` | `--animate-kreds-confetti` | 2.4s | linear | infinite | Confetes na celebração (Y -30px→540px, rotate 560deg) |
| `animate-kreds-cele` | `--animate-kreds-cele` | 0.5s | cubic-bezier(.2,.85,.3,1.3) | once | Entrada do overlay de celebração (scale 0.85→1) |
| `animate-kreds-bubble` | `--animate-kreds-bubble` | 0.4s | ease | once | Speech bubble (translateY 6px→0, opacity 0→1) |
| `animate-kreds-sprout` | `--animate-kreds-sprout` | 0.45s | cubic-bezier(.2,.85,.3,1.3) | once | Brotinho no dot do PIN (scale 0→1) |
| `animate-kreds-shake` | `--animate-kreds-shake` | 0.5s | cubic-bezier(.36,.07,.19,.97) | once | Shake ao errar PIN (translateX zig-zag) |
| `animate-kreds-new` | `--animate-kreds-new` | 1.2s | ease | once | Flash no card adicionado/salvo (box-shadow glow verde) |
| `animate-kreds-spin` | `--animate-kreds-spin` | 0.7s | linear | infinite | Spinner de loading (rotate 360deg) |

### Keyframes Definidos

Todos os keyframes a seguir devem ser definidos **dentro** do bloco `@theme` em `src/app/globals.css` (garante tree-shaking):

```
kredsBreath: 0%,100% translateY(0) → 50% translateY(-5px)
kredsPop:    0% scale(1) → 28% scale(1.09) translateY(-5px) → 60% scale(.98) → 100% scale(1)
kredsSun:    0%,100% scale(1) → 50% scale(1.05)
kredsDrift1: 0% translateX(0) → 100% translateX(34px)
kredsDrift2: 0% translateX(0) → 100% translateX(-26px)
kredsFlutter: 0%,100% translateY(0) rotate(0) → 50% translateY(-7px) rotate(4deg)
kredsFruit:  0%,100% scale(1) → 50% scale(1.06)
kredsDrop:   0% translateY(-12px) scale(.8) opacity(0) → 25% opacity(1) → 100% translateY(78px) scale(.55) opacity(0)
kredsConfetti: 0% translateY(-30px) rotate(0) opacity(0) → 12% opacity(1) → 100% translateY(540px) rotate(560deg) opacity(0)
kredsCele:   0% scale(.85) opacity(0) → 100% scale(1) opacity(1)
kredsBubble: 0% translateY(6px) scale(.9) opacity(0) → 100% translateY(0) scale(1) opacity(1)
kredsSprout: 0% scale(0) translateY(4px) opacity(0) → 100% scale(1) translateY(0) opacity(1)
kredsShake:  10%,90% translateX(-2px) → 20%,80% translateX(4px) → 30%,50%,70% translateX(-7px) → 40%,60% translateX(7px)
kredsNew:    0% box-shadow(0 0 0 3px rgba(62,107,79,.35)) → 100% box-shadow(0 0 0 0 rgba(62,107,79,0))
kredsSpin:   to rotate(360deg)
```

### Animações Não-CSS (implementadas via lógica de componente)

| Comportamento | Mecanismo | Timing |
|---------------|-----------|--------|
| Portão de login (correto) | CSS transition (`transform: translateX(±101%)`) | `1s cubic-bezier(.76,0,.24,1)` |
| Shake de PIN + reset | Classe `animate-kreds-shake` + `setTimeout` para reset | 950ms após erro |
| Confetes (20 divs) | Múltiplas instâncias de `animate-kreds-confetti` com delays escalonados | delays de 0–2s |
| Progress bar cofrinho | CSS transition na `width` | `0.6s cubic-bezier(.2,.8,.3,1)` |
| Toggle switch knob | CSS transition na `left` | `0.2s ease` |

---

## Interaction States

Contratos de estado para elementos interativos que as fases seguintes devem implementar:

### Input de texto (login responsável)
- **Default:** `border: 1.5px solid #E2DECF`, `bg #FBFAF5`
- **Focus:** `border-color #3E6B4F`, `bg #FFFFFF`, `box-shadow: 0 0 0 3px rgba(62,107,79,.13)`
- **Erro:** `border-color #B14A2E`

### Botão CTA primário (verde)
- **Default:** `bg #3E6B4F`, `shadow-cta`, `color #FFFFFF`
- **Loading:** spinner branco `animate-kreds-spin 0.7s linear infinite`
- **Sucesso (Zitadel):** `bg #4F9B57`
- **Desabilitado:** `bg #C2C9BC`, `cursor: not-allowed`

### Botão check da tarefa (circular 38×38px)
- **Desmarcado:** `border: 2px solid #D7DBCC`, `bg #FFFFFF`
- **Marcado:** `bg #3E6B4F`, checkmark SVG branco, `border-color #3E6B4F`
- **Transição:** `background .3s ease, border-color .3s ease`

### Task card (painel dos pais)
- **Default:** `border: 1.5px solid #ECE7DB`, `bg #FFFFFF`
- **Em edição:** `bg #F4F8F2`, `border-color #3E6B4F`
- **Inativa:** `opacity: 0.5`
- **Recém-adicionado/salvo:** `animate-kreds-new 1.2s ease` (glow ring verde)

### Toggle switch (ativo/inativo) — 42×24px
- **Ativo (ON):** `bg #3E6B4F`, knob `left: calc(100% - 20px)`
- **Inativo (OFF):** `bg #D7DBCC`, knob `left: 2px`
- **Transição knob:** `left .2s ease`

### Dot de PIN
- **Vazio:** `border: 2px solid #C3C9B7`, `bg transparent`
- **Preenchido:** `bg #3E6B4F`, `border-color #3E6B4F`, brotinho SVG com `animate-kreds-sprout`
- **Erro:** `bg #D8916B`, `border-color #C06B4A`
- **Shake container:** `animate-kreds-shake 0.5s cubic-bezier(.36,.07,.19,.97)`

### Filter chip / pill de recorrência
- **Selecionado:** `bg #3E6B4F`, `color #FFFFFF`, `border-color #3E6B4F`
- **Normal:** `bg #FBFAF5`, `color #27372C`, `border: 1px solid #E2DECF`

---

## Copywriting Contract

> Esta é uma fase de infraestrutura — não há telas de usuário nesta fase. O contrato de copy abaixo documenta os textos que serão necessários nas fases 2–6 para referência do design system.

| Elemento | Copy (PT-BR) | Fase |
|----------|-------------|------|
| Placeholder de verificação do design system | `"Kreds v2.0"` | 1 (página raiz) |
| Título da app (metadata) | `"Kreds"` | 1 (layout.tsx) |
| Descrição da app (metadata) | `"Educação financeira para famílias"` | 1 (layout.tsx) |
| lang do `<html>` | `"pt-BR"` | 1 (layout.tsx) |

**Nota de fase:** Copy de estado vazio, erros e CTAs está documentado em cada fase específica (2–6). Esta fase não renderiza conteúdo de usuário.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (não inicializado nesta fase) | not applicable |
| third-party | none | not applicable |

**Nenhum pacote novo é instalado nesta fase.** Todas as dependências (`next`, `tailwindcss`, `@tailwindcss/postcss`, `@serwist/next`) já estão em `node_modules` — verificadas e aprovadas no RESEARCH.md.

---

## File Contract

O executor deve criar exatamente estes arquivos nesta fase:

| Arquivo | Descrição | Obrigatório |
|---------|-----------|-------------|
| `src/app/globals.css` | `@import "tailwindcss"` + `@theme` com todos os tokens + `@keyframes` | Sim — fonte única de verdade |
| `src/app/layout.tsx` | RootLayout com `Plus_Jakarta_Sans`, `metadata`, `<html lang="pt-BR">` | Sim |
| `src/app/page.tsx` | Página raiz placeholder (verificação visual do design system) | Sim |
| `src/app/sw.ts` | Stub mínimo do Serwist (evita falha de build) | Sim — requerido pelo `next.config.ts` |

**Anti-patterns que o executor deve evitar:**
- Não criar `tailwind.config.ts` (Tailwind v4 usa CSS-first)
- Não usar `@tailwind base/components/utilities` (substituídos por `@import "tailwindcss"`)
- Não importar fonte via `<link>` no `<head>` (usar `next/font/google`)
- Não definir `@keyframes` fora do `@theme` (perde tree-shaking)
- Não omitir o `sw.ts` (build quebra)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
