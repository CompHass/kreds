# Phase 1: Foundation - Research

**Researched:** 2026-06-20
**Domain:** Next.js 16 App Router + Tailwind CSS v4 — Design System Bootstrap
**Confidence:** HIGH

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-01 | Tokens de cor implementados como variáveis CSS/Tailwind (verde primário `#3E6B4F`, fundos, bordas, estados) | Tailwind v4 `@theme` directive: define `--color-*` vars → gera classes `bg-*`, `text-*`, `border-*` automaticamente |
| DS-02 | Tipografia Plus Jakarta Sans importada e configurada com pesos 400/500/600/700/800 | `next/font/google` → `Plus_Jakarta_Sans` com `weight: ['400','500','600','700','800']`, `variable: '--font-sans'`; Tailwind v4 mapeia via `--font-sans` no `@theme` |
| DS-03 | Animações CSS nomeadas implementadas (kredsBreath, kredsPop, kredsNew, kredsDrift, kredsSun, etc.) | Tailwind v4 suporta `--animate-*` + `@keyframes` dentro do bloco `@theme`; keyframes completos extraídos dos `.dc.html` |
| DS-04 | Border-radius, sombras e espaçamentos como tokens reutilizáveis no Tailwind config | `@theme` → `--radius-*`, `--shadow-*`, `--spacing-*` — sem `tailwind.config.ts` necessário em v4 |

</phase_requirements>

---

## Summary

Esta fase constrói a base de CSS e estrutura de arquivos sobre a qual todas as fases seguintes dependem. O projeto usa **Next.js 16.2.7** (App Router) com **Tailwind CSS 4.3.0** — uma combinação que altera radicalmente como tokens são definidos em relação ao Tailwind v3. Não existe `tailwind.config.ts`; tudo é configurado via diretiva `@theme` no CSS global. O `postcss.config.mjs` com `@tailwindcss/postcss` já existe no projeto.

O `src/` foi deletado — esta fase cria `src/app/layout.tsx`, `src/app/page.tsx` e `src/app/globals.css` do zero. O `next.config.ts` já existe e referencia `src/app/sw.ts` (Serwist PWA) — o scaffold de `sw.ts` deve ser incluído mesmo que vazio para não quebrar o build. O `auth.ts` na raiz importa `@/lib/env` e `@/lib/db` — estes módulos **não** são parte desta fase (ficam para quando as rotas de API forem reconstruídas), mas o import path `@/*` já está mapeado para `./src/*` no `tsconfig.json`.

A estratégia para DS-01 a DS-04 é um único arquivo `src/app/globals.css` com: `@import "tailwindcss"`, bloco `@theme` com todos os tokens de cor/tipografia/espaçamento, e os `@keyframes` das animações Kreds definidos dentro do mesmo bloco `@theme` usando a convenção `--animate-kreds-breath: kredsBreath 5s ease-in-out infinite`.

**Primary recommendation:** Criar `src/app/globals.css` como fonte única de verdade para todos os tokens do design system, usando `@theme` do Tailwind v4 — sem arquivos de configuração JS adicionais.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tokens de cor e design | Browser / Client | — | CSS custom properties geradas pelo Tailwind v4 são consumidas pelo browser diretamente |
| Tipografia (next/font) | Frontend Server (SSR) | Browser / Client | `next/font/google` roda no servidor e injeta o `className` no `<html>`; o CSS gerado é servido como recurso estático |
| Animações CSS | Browser / Client | — | `@keyframes` vivem no CSS estático — sem JS necessário |
| Estrutura App Router | Frontend Server (SSR) | — | `layout.tsx` e `page.tsx` são React Server Components por default |
| Service Worker (Serwist) | Browser / Client | CDN / Static | `sw.ts` é compilado pelo `@serwist/next` no build e servido como `public/sw.js` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.7 | App Router, SSR, build | Já instalado — versão verificada em `node_modules` |
| tailwindcss | 4.3.0 | Utility CSS + sistema de tokens | Já instalado — v4 usa CSS-first, sem config JS |
| @tailwindcss/postcss | 4.3.0 | Plugin PostCSS para v4 | Já configurado em `postcss.config.mjs` |
| next/font/google | (built-in next 16) | Plus Jakarta Sans auto-hosted | Elimina request externo ao Google Fonts em produção |
| @serwist/next | 9.5.11 | PWA service worker | Já configurado em `next.config.ts` — requer `src/app/sw.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | 6.0.3 | Type safety | Todos os arquivos `.tsx`/`.ts` |
| react | 19.2.7 | Componentes | Já instalado |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/font/google` + CSS var | `<link>` direto ao Google Fonts | A alternativa gera request externo, sem otimização de `font-display`; `next/font` é mais seguro para privacidade e performance |
| `@theme` com `--animate-*` | CSS puro fora do Tailwind | Classes Tailwind (`animate-kreds-breath`) ficam disponíveis automaticamente; CSS puro requer `@layer utilities` manual |

**Verificação de versões instaladas:**

```bash
# Executado na sessão — confirmado em node_modules:
next:                16.2.7   [VERIFIED: node_modules]
tailwindcss:         4.3.0    [VERIFIED: node_modules]
@tailwindcss/postcss: 4.3.0  [VERIFIED: node_modules]
@serwist/next:       9.5.11  [VERIFIED: node_modules]
```

---

## Package Legitimacy Audit

Nenhum pacote novo é instalado nesta fase — todos já existem em `node_modules`. Não é necessário rodar o gate de legitimidade.

| Package | Registry | Disposition |
|---------|----------|-------------|
| next 16.2.7 | npm | Já instalado — aprovado |
| tailwindcss 4.3.0 | npm | Já instalado — aprovado |
| @tailwindcss/postcss 4.3.0 | npm | Já instalado — aprovado |
| @serwist/next 9.5.11 | npm | Já instalado — aprovado |

**Pacotes removidos (SLOP):** nenhum
**Pacotes suspeitos (SUS):** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
globals.css
  └── @import "tailwindcss"
  └── @theme { --color-*, --font-*, --radius-*, --shadow-*, --animate-* + @keyframes }
        │
        ▼
  Tailwind v4 Build (via @tailwindcss/postcss)
        │
        ▼
  CSS gerado → classes bg-kreds-primary, text-kreds-text, animate-kreds-breath etc.
        │
        ▼
  layout.tsx
  ├── next/font/google (Plus_Jakarta_Sans) → injeta --font-sans no <html>
  ├── <html className={font.variable}> → ativa --font-sans no CSS
  └── <body> → globals.css aplicado

src/app/sw.ts   → compilado por @serwist/next → public/sw.js
```

### Recommended Project Structure

```
src/
├── app/
│   ├── globals.css        # Tokens @theme + @import tailwindcss + @keyframes
│   ├── layout.tsx         # RootLayout: next/font, metadata, html+body
│   ├── page.tsx           # Página raiz (placeholder nesta fase)
│   └── sw.ts              # Service worker stub (Serwist PWA — requerido pelo next.config.ts)
└── (módulos de lib serão adicionados em fases futuras)
```

### Pattern 1: Tokens via @theme (Tailwind v4)

**O que é:** Em Tailwind v4, o arquivo `tailwind.config.ts` não existe. Tokens são definidos como custom properties CSS dentro do bloco `@theme` no CSS global. O Tailwind gera automaticamente classes utilitárias a partir deles.

**Quando usar:** Sempre que um valor do design handoff precisar ser acessível como classe Tailwind (`bg-`, `text-`, `border-`, etc.).

**Exemplo:**

```css
/* Source: https://tailwindcss.com/docs/theme — @theme directive (v4) */
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Cores (DS-01) */
  --color-kreds-primary:    #3E6B4F;
  --color-kreds-primary-lt: #5A8A66;
  --color-kreds-soft:       #E7EFE8;
  --color-kreds-hover:      #EEF3EA;
  --color-kreds-bg:         #F2F0E7;
  --color-kreds-card:       #FBFAF5;
  --color-kreds-border:     #ECE7DB;
  --color-kreds-border-alt: #E2DECF;
  --color-kreds-orange:     #B5623F;
  --color-kreds-coin:       #E3C57C;
  --color-kreds-gold:       #9A7320;
  --color-kreds-text:       #27372C;
  --color-kreds-muted:      #7C8676;
  --color-kreds-hint:       #9AA092;
  --color-kreds-error:      #B14A2E;
  --color-kreds-rose:       #C98AA0;
  --color-kreds-water:      #6E9BA0;

  /* Tipografia (DS-02) */
  --font-sans: var(--font-plus-jakarta), system-ui, sans-serif;

  /* Border-radius (DS-04) */
  --radius-app:    26px;   /* container principal desktop */
  --radius-card-lg: 20px;
  --radius-card-md: 18px;
  --radius-card-sm: 16px;
  --radius-input:  13px;
  --radius-chip:   10px;
  --radius-pill:   999px;

  /* Sombras (DS-04) */
  --shadow-app:    0 40px 90px -36px rgba(40,55,45,.55);
  --shadow-card:   0 16px 36px -26px rgba(40,55,45,.5);
  --shadow-cta:    0 12px 24px -12px rgba(62,107,79,.6);

  /* Animações (DS-03) */
  --animate-kreds-breath:   kredsBreath 5s ease-in-out infinite;
  --animate-kreds-pop:      kredsPop 0.6s ease;
  --animate-kreds-sun:      kredsSun 5s ease-in-out infinite;
  --animate-kreds-drift1:   kredsDrift1 16s ease-in-out alternate infinite;
  --animate-kreds-drift2:   kredsDrift2 20s ease-in-out alternate infinite;
  --animate-kreds-flutter:  kredsFlutter 3s ease-in-out infinite;
  --animate-kreds-fruit:    kredsFruit 1.4s ease-in-out infinite;
  --animate-kreds-drop:     kredsDrop 0.72s ease-in forwards;
  --animate-kreds-confetti: kredsConfetti 2.4s linear infinite;
  --animate-kreds-cele:     kredsCele 0.5s cubic-bezier(.2,.85,.3,1.3);
  --animate-kreds-bubble:   kredsBubble 0.4s ease;
  --animate-kreds-sprout:   kredsSprout 0.45s cubic-bezier(.2,.85,.3,1.3);
  --animate-kreds-shake:    kredsShake 0.5s cubic-bezier(.36,.07,.19,.97);
  --animate-kreds-new:      kredsNew 1.2s ease;
  --animate-kreds-spin:     kredsSpin 0.7s linear infinite;

  /* Keyframes das animações (DS-03) */
  @keyframes kredsBreath {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes kredsPop {
    0%   { transform: scale(1); }
    28%  { transform: scale(1.09) translateY(-5px); }
    60%  { transform: scale(.98); }
    100% { transform: scale(1); }
  }
  @keyframes kredsSun {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.05); }
  }
  @keyframes kredsDrift1 {
    0%   { transform: translateX(0); }
    100% { transform: translateX(34px); }
  }
  @keyframes kredsDrift2 {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-26px); }
  }
  @keyframes kredsFlutter {
    0%, 100% { transform: translateY(0) rotate(0); }
    50%      { transform: translateY(-7px) rotate(4deg); }
  }
  @keyframes kredsFruit {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  @keyframes kredsDrop {
    0%   { transform: translateY(-12px) scale(.8); opacity: 0; }
    25%  { opacity: 1; }
    100% { transform: translateY(78px) scale(.55); opacity: 0; }
  }
  @keyframes kredsConfetti {
    0%   { transform: translateY(-30px) rotate(0); opacity: 0; }
    12%  { opacity: 1; }
    100% { transform: translateY(540px) rotate(560deg); opacity: 0; }
  }
  @keyframes kredsCele {
    0%   { transform: scale(.85); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes kredsBubble {
    0%   { transform: translateY(6px) scale(.9); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes kredsSprout {
    0%   { transform: scale(0) translateY(4px); opacity: 0; }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes kredsShake {
    10%, 90% { transform: translateX(-2px); }
    20%, 80% { transform: translateX(4px); }
    30%, 50%, 70% { transform: translateX(-7px); }
    40%, 60% { transform: translateX(7px); }
  }
  @keyframes kredsNew {
    0%   { box-shadow: 0 0 0 3px rgba(62,107,79,.35); }
    100% { box-shadow: 0 0 0 0 rgba(62,107,79,0); }
  }
  @keyframes kredsSpin {
    to { transform: rotate(360deg); }
  }
}
```

Classes geradas automaticamente: `animate-kreds-breath`, `animate-kreds-pop`, `bg-kreds-primary`, `text-kreds-text`, `shadow-card`, `rounded-card-md`, etc.

### Pattern 2: Plus Jakarta Sans via next/font com CSS variable

**O que é:** `next/font/google` baixa a fonte em build time e injeta o CSS localmente, sem request ao Google em runtime. O `variable` option cria uma CSS custom property que pode ser referenciada no `@theme`.

**Quando usar:** Única estratégia correta para tipografia em Next.js — elimina FOIT, melhora privacidade.

```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/font — CSS variable pattern
// src/app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={font.variable}>
      <body>{children}</body>
    </html>
  )
}
```

Em `globals.css`, o `@theme` mapeia:

```css
@theme {
  --font-sans: var(--font-plus-jakarta), system-ui, sans-serif;
}
```

Isso faz com que `font-sans` (classe Tailwind padrão) use Plus Jakarta Sans.

### Pattern 3: Service Worker stub para Serwist

**O que é:** O `next.config.ts` já está configurado com `swSrc: 'src/app/sw.ts'`. Se este arquivo não existir, o build falha. Nesta fase criamos um stub mínimo.

```typescript
// src/app/sw.ts — stub mínimo para Serwist
import { defaultCache } from '@serwist/next/worker'
import { Serwist } from 'serwist'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

**Nota:** Se o Serwist não for ativado em desenvolvimento (sem HTTPS), o arquivo ainda precisa existir. O build vai compilar `sw.ts` → `public/sw.js` mesmo que não seja registrado.

### Anti-Patterns to Avoid

- **Não criar `tailwind.config.ts`:** Em Tailwind v4, isso não é suportado na mesma forma que v3. Toda customização vai em `@theme` no CSS.
- **Não usar `@tailwind base/components/utilities`:** Substituídos por `@import "tailwindcss"` em v4.
- **Não importar fonte via `<link>` no `<head>`:** Usar `next/font/google` — o `<link>` direto ignora otimizações do Next.js.
- **Não definir `@keyframes` fora do `@theme`:** Se definidos fora, os keyframes **sempre** são incluídos no CSS final mesmo que a classe não seja usada. Dentro do `@theme`, são tree-shaken.
- **Não esquecer o `sw.ts`:** O `next.config.ts` referencia `src/app/sw.ts` — sem o arquivo o build quebra com erro de módulo não encontrado.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading com peso correto | Import manual via URL | `next/font/google` com `weight` array | Evita CLS, FOIT e request externo |
| CSS variables para tokens | Classe CSS manual em `:root` | `@theme` directive do Tailwind v4 | Tailwind gera classes utilitárias automaticamente |
| Prefixo de animação | Classe CSS custom com `animation:` inline | `--animate-*` no `@theme` | Vira `animate-kreds-*` — usável em qualquer componente via classe Tailwind |
| PostCSS para v4 | Configuração manual de PostCSS | `@tailwindcss/postcss` (já configurado) | Plugin oficial já instalado e funcional |

**Key insight:** Em Tailwind v4, o sistema de tokens é inteiramente CSS — não JavaScript. O `@theme` é a API pública. Qualquer coisa definida nele automaticamente gera utilitários e CSS variables acessíveis em todo o app.

---

## Common Pitfalls

### Pitfall 1: Plus Jakarta Sans não é fonte variável completa no next/font

**O que vai errado:** Ao importar com `weight: '400'` (string única), apenas aquele peso é baixado. Componentes que usam `font-weight: 700` recebem fallback do browser.

**Por que acontece:** Fontes não-variáveis requerem um `@font-face` separado por peso. O `next/font` baixa apenas os pesos especificados.

**Como evitar:** Sempre passar array de pesos: `weight: ['400', '500', '600', '700', '800']`. Verificar se a fonte suporta range variável (`200..800`) — Plus Jakarta Sans suporta, mas o `next/font` precisa do array explícito.

**Warning signs:** Textos em `font-bold` aparecem em peso errado ou fallback monospace.

### Pitfall 2: Serwist falha se src/app/sw.ts não existe

**O que vai errado:** `next build` falha com erro de arquivo não encontrado: `Cannot find module 'src/app/sw.ts'`.

**Por que acontece:** O `next.config.ts` tem `swSrc: 'src/app/sw.ts'` — o Serwist resolve esse path no build.

**Como evitar:** Criar o arquivo `src/app/sw.ts` como parte desta fase (stub mínimo suficiente).

**Warning signs:** Erro de build na fase de compilação do service worker.

### Pitfall 3: Conflito entre `--color-*` do Tailwind v4 e hex direto

**O que vai errado:** Tailwind v4 usa `oklch` por padrão para suas cores internas. Cores hex definidas em `@theme` funcionam, mas o VS Code / IntelliSense pode não mostrar o preview de cor corretamente.

**Por que acontece:** O tema padrão usa `oklch`; hex é aceito mas não é o formato nativo.

**Como evitar:** Usar hex diretamente — funciona em produção. Para melhor experiência no editor, converter para `oklch` é opcional (não obrigatório).

**Warning signs:** Apenas cosmético — sem impacto em produção.

### Pitfall 4: `@keyframes` com nome conflitando com Tailwind padrão

**O que vai errado:** Tailwind v4 tem keyframes internos (ex: `spin`, `ping`, `bounce`). Nomes curtos podem colidir.

**Por que acontece:** Namespace compartilhado de keyframes CSS.

**Como evitar:** Usar o prefixo `kreds` em todos os keyframes (ex: `kredsBreath`, `kredsSpin`). Já seguido pelo design handoff.

---

## Code Examples

Verified patterns from official sources:

### globals.css — estrutura mínima funcional

```css
/* Source: https://tailwindcss.com/docs/installation/framework-guides/nextjs */
@import "tailwindcss";

@theme {
  /* ... tokens aqui ... */
}
```

### layout.tsx — RootLayout mínimo

```tsx
/* Source: https://nextjs.org/docs/app/api-reference/components/font */
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kreds',
  description: 'Educação financeira para famílias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={font.variable}>
      <body className="bg-kreds-bg font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

### page.tsx — placeholder

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-kreds-primary font-bold text-2xl">Kreds v2.0</p>
    </main>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.ts` com `theme.extend` | `@theme` no CSS | Tailwind v4 (2025) | Sem arquivo JS de config — tokens vivem no CSS |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Uma linha substitui três diretivas |
| `next/font` com `className` direto | `next/font` com `variable` + `@theme` | Next.js 13+ com Tailwind v4 | Integração CSS variable permite uso em qualquer contexto CSS |
| Keyframes em arquivo CSS separado | `@keyframes` dentro de `@theme` | Tailwind v4 | Tree-shaking automático de animações não usadas |

**Deprecated/outdated:**

- `tailwind.config.ts`: não é mais o ponto central em v4 — pode existir para compatibilidade mas não é necessário para este projeto
- `@tailwind` directives: substituídas por `@import "tailwindcss"`
- `postcss-import` + `autoprefixer`: não necessários com `@tailwindcss/postcss` v4

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Plus Jakarta Sans é carregada corretamente com `weight: ['400','500','600','700','800']` via `next/font/google` sem ser variável | Standard Stack / Pattern 2 | Se a fonte só suportar pesos discretos (não range), a API do next/font pode ter comportamento diferente — baixo risco, confirmado pela resposta do Google Fonts API no script de verificação |
| A2 | O stub mínimo de `sw.ts` (importando `@serwist/next/worker`) é suficiente para o build não falhar | Common Pitfalls | Se o Serwist exigir configuração adicional, o build pode falhar — verificar na Wave 1 |

---

## Open Questions

1. **Serwist em desenvolvimento local**
   - O que sabemos: `@serwist/next` está configurado em `next.config.ts`
   - O que está incerto: Service workers requerem HTTPS (exceto `localhost`) — o dev server do Next.js serve em HTTP. O Serwist pode ou não registrar o SW em dev.
   - Recomendação: O stub de `sw.ts` só precisa existir para o build. Não é necessário testar o PWA nesta fase — isso pertence a uma fase de QA específica.

2. **Modo `@theme inline` vs `@theme`**
   - O que sabemos: O Tailwind v4 suporta `@theme inline { ... }` para remover a geração de CSS vars globais (evita duplicação quando já há CSS vars do `next/font`)
   - O que está incerto: Se usar `--font-plus-jakarta` do `next/font` + `--font-sans` no `@theme`, pode haver conflito entre as two fontes de CSS vars
   - Recomendação: Usar `@theme` (sem `inline`) para `--font-sans` que referencia `var(--font-plus-jakarta)` — o next/font injetará `--font-plus-jakarta` no `<html>` e o `@theme` de Tailwind expõe `font-sans` como classe utilitária

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build | ✓ | (inferido — pnpm funcional) | — |
| pnpm | package manager | ✓ | 10.34.1 (package.json) | — |
| next 16.2.7 | App Router | ✓ | 16.2.7 | — |
| tailwindcss 4.3.0 | Design tokens | ✓ | 4.3.0 | — |
| @tailwindcss/postcss 4.3.0 | Tailwind build | ✓ | 4.3.0 | — |
| Plus Jakarta Sans (Google Fonts) | DS-02 | ✓ | v12 (confirmado via API) | — |
| @serwist/next 9.5.11 | PWA/sw.ts | ✓ | 9.5.11 | — |

**Missing dependencies with no fallback:** nenhum

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` (existe) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |
| E2E framework | Playwright 1.60.0 (`playwright.config.ts`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DS-01 | Tokens de cor existem como CSS vars e classes Tailwind | Visual/build | `pnpm build` sem erros + inspeção manual do CSS gerado | ❌ Wave 0 |
| DS-02 | Plus Jakarta Sans renderiza em todos os textos | Visual/manual | Inspeção no browser: `document.fonts.check('700 16px "Plus Jakarta Sans"')` | ❌ Manual |
| DS-03 | Classes `animate-kreds-*` existem no CSS gerado | build smoke | `pnpm build` + grep no `.next/static/css/*.css` | ❌ Wave 0 |
| DS-04 | Classes de radius/shadow/spacing existem | build smoke | `pnpm build` + grep no output CSS | ❌ Wave 0 |

**Nota:** DS-01 a DS-04 são majoritariamente tokens CSS — a validação primária é visual (browser DevTools) e de build (CSS gerado contém as classes). Testes unitários de Vitest não se aplicam diretamente a CSS. O planner deve incluir uma task de verificação manual com checklist de DevTools.

### Wave 0 Gaps

- [ ] Nenhum teste unitário necessário para esta fase — tokens CSS são validados via build + inspeção manual
- [ ] Comando de smoke: `pnpm build` deve completar sem erros

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não | — (fase é CSS/tokens apenas) |
| V3 Session Management | não | — |
| V4 Access Control | não | — |
| V5 Input Validation | não | — (sem forms nesta fase) |
| V6 Cryptography | não | — |

Esta fase é puramente frontend/CSS — sem superfície de ataque relevante. Auth (Zitadel/next-auth) e forms ficam para as fases 2+.

---

## Sources

### Primary (HIGH confidence)

- `/tailwindlabs/tailwindcss.com` (Context7) — `@theme` directive, `--animate-*`, `--color-*`, `@keyframes` dentro de `@theme`, `@import "tailwindcss"`, PostCSS config
- `/vercel/next.js` (Context7) — `next/font/google`, `Plus_Jakarta_Sans`, `variable` CSS property pattern, RootLayout com `<html className>`
- `node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts` — confirmação que `Plus_Jakarta_Sans` existe como export [VERIFIED: node_modules]
- `design_handoff_kreds/Kreds Kids Garden.dc.html` — keyframes extraídos diretamente dos protótipos [VERIFIED: codebase grep]
- `design_handoff_kreds/Kreds Login.dc.html` — keyframes `kredsBreath`, `kredsSprout`, `kredsShake`, `kredsSpin` [VERIFIED: codebase grep]
- `design_handoff_kreds/Kreds Tarefas (Pais).dc.html` — keyframe `kredsNew` [VERIFIED: codebase grep]
- `design_handoff_kreds/README.md` — tokens de cor, tipografia, radii, sombras [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- Google Fonts CSS API (`fonts.googleapis.com/css2?family=Plus+Jakarta+Sans`) — confirmação de pesos disponíveis (400, 500, 600, 700, 800) [CITED: Google Fonts API]
- `package.json` + `node_modules` — versões exatas de todos os pacotes [VERIFIED: node_modules]
- `postcss.config.mjs` — confirma que `@tailwindcss/postcss` já está configurado [VERIFIED: codebase]
- `next.config.ts` — confirma `swSrc: 'src/app/sw.ts'` e necessidade do stub [VERIFIED: codebase]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versões verificadas em node_modules
- Architecture: HIGH — patterns confirmados via Context7 (docs oficiais Tailwind v4 e Next.js)
- Keyframes: HIGH — extraídos diretamente dos arquivos `.dc.html` do design handoff
- Tokens: HIGH — documentados em `design_handoff_kreds/README.md` com valores exatos

**Research date:** 2026-06-20
**Valid until:** 2026-07-20 (Tailwind v4 e Next.js 16 em desenvolvimento ativo — confirmar antes de fases futuras)
