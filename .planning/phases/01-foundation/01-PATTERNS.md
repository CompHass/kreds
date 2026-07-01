# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-06-20
**Files analyzed:** 4
**Analogs found:** 4 / 4

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/app/globals.css` | config | transform | `postcss.config.mjs` (estrutura de config CSS) | partial — mesmo ecossistema Tailwind |
| `src/app/layout.tsx` | provider | request-response (SSR) | `auth.ts` (padrão de import `@/` + TypeScript config) | partial — mesmo estilo TypeScript |
| `src/app/page.tsx` | component | request-response (RSC) | `auth.ts` (export default pattern) | partial — mesmo estilo TypeScript |
| `src/app/sw.ts` | config | event-driven | `next.config.ts` (consumidor Serwist + import de `@serwist/next`) | exact — mesmo módulo Serwist |

---

## Pattern Assignments

### `src/app/globals.css` (config, transform)

**Analog:** `postcss.config.mjs` (confirma `@tailwindcss/postcss` ativo) + RESEARCH.md Pattern 1

**PostCSS config pattern** (`postcss.config.mjs` linhas 1-5):
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```
Confirma que o pipeline Tailwind v4 está ativo — `@import "tailwindcss"` no CSS será processado por este plugin.

**Estrutura obrigatória do arquivo** (fonte: RESEARCH.md Pattern 1 + UI-SPEC.md File Contract):
```css
@import "tailwindcss";

@theme {
  /* Cores */
  --color-kreds-primary:     #3E6B4F;
  --color-kreds-primary-lt:  #5A8A66;
  --color-kreds-soft:        #E7EFE8;
  --color-kreds-hover:       #EEF3EA;
  --color-kreds-bg:          #F2F0E7;
  --color-kreds-card:        #FBFAF5;
  --color-kreds-border:      #ECE7DB;
  --color-kreds-border-alt:  #E2DECF;
  --color-kreds-orange:      #B5623F;
  --color-kreds-coin:        #E3C57C;
  --color-kreds-gold:        #9A7320;
  --color-kreds-text:        #27372C;
  --color-kreds-muted:       #7C8676;
  --color-kreds-hint:        #9AA092;
  --color-kreds-error:       #B14A2E;
  --color-kreds-rose:        #C98AA0;
  --color-kreds-water:       #6E9BA0;

  /* Tipografia */
  --font-sans: var(--font-plus-jakarta), system-ui, sans-serif;

  /* Border-radius */
  --radius-app:      26px;
  --radius-card-lg:  20px;
  --radius-card-md:  18px;
  --radius-card-sm:  16px;
  --radius-input:    13px;
  --radius-chip:     10px;
  --radius-pill:     999px;

  /* Sombras */
  --shadow-app:    0 40px 90px -36px rgba(40,55,45,.55);
  --shadow-card:   0 16px 36px -26px rgba(40,55,45,.5);
  --shadow-cta:    0 12px 24px -12px rgba(62,107,79,.6);
  --shadow-device: 0 34px 70px -22px rgba(40,55,45,.5);

  /* Animações — token referencia o keyframe nomeado */
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

  /* Keyframes — DENTRO do @theme para tree-shaking automático */
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

**Anti-patterns (extraídos de RESEARCH.md):**
- Não usar `@tailwind base/components/utilities` — substituído por `@import "tailwindcss"`
- Não criar `tailwind.config.ts` — v4 é CSS-first
- Não definir `@keyframes` fora do `@theme` — perde tree-shaking

---

### `src/app/layout.tsx` (provider, request-response SSR)

**Analog:** `auth.ts` (padrão de import TypeScript + `drizzle.config.ts` estilo de export default)

**Import pattern** (`auth.ts` linhas 1-6 — confirma estilo de imports do projeto):
```typescript
import NextAuth from 'next-auth'
import Zitadel from 'next-auth/providers/zitadel'
import { env } from '@/lib/env'
import { db } from '@/lib/db'
```
Confirma: imports relativos usam `@/` alias (mapeado para `./src/*` em `tsconfig.json` linha 26-28).

**TypeScript config style** (`tsconfig.json` linhas 1-41):
- `"strict": true` — todo arquivo deve ter tipagem explícita
- `"moduleResolution": "bundler"` — imports sem extensão `.js` são válidos
- `"jsx": "react-jsx"` — sem necessidade de `import React` em arquivos TSX
- `"target": "ES2022"` — sintaxe moderna suportada

**Padrão do RootLayout** (fonte: RESEARCH.md Pattern 2 + UI-SPEC.md Copywriting Contract):
```tsx
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

**Pontos críticos:**
- `variable: '--font-plus-jakarta'` — nome exato que `globals.css` referencia em `var(--font-plus-jakarta)`
- `className={font.variable}` no `<html>` — injeta a CSS var no escopo global
- `weight: ['400', '500', '600', '700', '800']` — array, nunca string única (ver Pitfall 1 no RESEARCH.md)
- `lang="pt-BR"` — contratos de copy da UI-SPEC.md

---

### `src/app/page.tsx` (component, request-response RSC)

**Analog:** `auth.ts` (padrão de export default nomeado) + RESEARCH.md Code Examples

**Export default pattern** (`auth.ts` linha 8 — confirma estilo de export):
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({ ... })
```
O projeto usa named exports ou export default — ambos são válidos. Para RSC de página, usar export default function nomeada.

**Padrão do placeholder** (fonte: RESEARCH.md + UI-SPEC.md — texto "Kreds v2.0" + cores `kreds-primary`):
```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-kreds-bg">
      <p className="text-kreds-primary font-bold text-2xl">Kreds v2.0</p>
    </main>
  )
}
```

**Propósito:** verificação visual de que `bg-kreds-bg`, `text-kreds-primary` e `font-bold` (Plus Jakarta Sans 700) estão funcionando após o build.

---

### `src/app/sw.ts` (config, event-driven)

**Analog:** `next.config.ts` (linhas 1-11 — consumidor de `@serwist/next`, mesmo módulo)

**Import pattern do Serwist** (`next.config.ts` linhas 1-11):
```typescript
import withSerwist from '@serwist/next'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default withSerwist({
  swSrc: 'src/app/sw.ts',   // ← este arquivo
  swDest: 'public/sw.js',
})(nextConfig)
```
Confirma: `next.config.ts` aponta para `src/app/sw.ts` como `swSrc`. O arquivo deve existir ou o build falha (Pitfall 2 no RESEARCH.md).

**Stub mínimo** (fonte: RESEARCH.md Pattern 3):
```typescript
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

**Nota de ambiente:** `self.__SW_MANIFEST` é injetado pelo compilador Serwist no build — não existe em TypeScript puro. O compilador `@serwist/next` trata esse global corretamente ao processar `swSrc`.

---

## Shared Patterns

### Path Alias `@/*`
**Fonte:** `tsconfig.json` linhas 25-29
**Aplica a:** qualquer arquivo futuro em `src/` que importe outros módulos do projeto
```json
"paths": {
  "@/*": ["./src/*"]
}
```
Fases 2+ que criarem `src/lib/env.ts`, `src/lib/db/index.ts` etc. serão importados como `@/lib/env`, `@/lib/db` — exatamente como `auth.ts` já faz.

### TypeScript Config Compartilhado
**Fonte:** `tsconfig.json`
**Aplica a:** todos os arquivos `.ts` e `.tsx`
- `strict: true` — tipagem explícita em todos os arquivos
- `moduleResolution: "bundler"` — imports sem extensão `.js`
- `jsx: "react-jsx"` — sem `import React` necessário em arquivos TSX

### Estilo de Export de Configs
**Fonte:** `drizzle.config.ts` linhas 1-10, `next.config.ts` linhas 1-11
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({ ... })

// next.config.ts
import withSerwist from '@serwist/next'
export default withSerwist({ ... })(nextConfig)
```
Padrão: `import` no topo, `export default` no final. Sem barrel exports em arquivos de config. Aplicar ao `sw.ts`.

---

## No Analog Found

Nenhum arquivo desta fase ficou sem analog. Os 4 arquivos têm correspondências suficientes no codebase existente para orientar o planner:

| Arquivo | Por que tem analog suficiente |
|---------|------------------------------|
| `globals.css` | `postcss.config.mjs` confirma o pipeline Tailwind v4 ativo; tokens completos estão no RESEARCH.md |
| `layout.tsx` | `auth.ts` confirma estilo de imports `@/` e TypeScript strict; pattern completo no RESEARCH.md |
| `page.tsx` | `auth.ts` confirma export default + TypeScript strict; pattern completo no RESEARCH.md |
| `sw.ts` | `next.config.ts` confirma módulo `@serwist/next` e o path exato `src/app/sw.ts`; pattern completo no RESEARCH.md |

---

## Metadata

**Analog search scope:** `/Users/hass/repos/github/comphass/kreds` (raiz do projeto)
**Files scanned:** `next.config.ts`, `drizzle.config.ts`, `auth.ts`, `postcss.config.mjs`, `tsconfig.json`
**Pattern extraction date:** 2026-06-20
