---
plan: 01-01
phase: 01-foundation
status: complete
completed: 2026-06-20
requirements: [DS-01, DS-02, DS-03, DS-04]
key-files:
  created:
    - src/app/globals.css
    - src/app/sw.ts
---

# Plan 01-01: Design Tokens + SW Stub — Summary

## What Was Built

Created the single source of truth for all Kreds design tokens in `src/app/globals.css` using Tailwind v4's `@theme` directive, and a Serwist service worker stub in `src/app/sw.ts` required by `next.config.ts`.

## Key Decisions

- Used hex literals for color tokens (not oklch) — functionally equivalent, per RESEARCH Pitfall 3
- All 15 `@keyframes` defined **inside** `@theme` block for tree-shaking
- `--font-sans` references `var(--font-plus-jakarta)` injected by `layout.tsx` (Plan 02) — no `<link>` import
- SW stub uses `/// <reference lib="webworker" />` + explicit `declare const self` to satisfy `strict: true` without a separate `.d.ts` file
- Replaced prior placeholder tokens (`:root` with `--color-bg`, `--color-primary`, etc.) with authoritative Kreds tokens

## Artifacts Produced

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/globals.css` | 124 | All DS-01..DS-04 tokens — 17 colors, font-sans, 7 radius, 4 shadows, 15 animations + 15 @keyframes |
| `src/app/sw.ts` | 17 | Serwist stub satisfying `next.config.ts swSrc` requirement |

## Verification

- ✓ `@import "tailwindcss"` present (no `@tailwind` directives)
- ✓ 17 `--color-kreds-*` tokens including `--color-kreds-primary: #3E6B4F`
- ✓ 15 `--animate-kreds-*` tokens + 15 `@keyframes kreds*` blocks inside `@theme`
- ✓ 7 `--radius-*` and 4 `--shadow-*` tokens with literal values
- ✓ `--font-sans: var(--font-plus-jakarta), system-ui, sans-serif`
- ✓ `sw.ts` imports `defaultCache` + `Serwist`, uses `self.__SW_MANIFEST`, calls `addEventListeners()`
- ✓ No `@keyframes` outside `@theme`

## Self-Check: PASSED

## Commits

- `feat(01-01): design tokens via @theme + Serwist SW stub`
- `feat(01-01): Serwist SW stub (task 2)`
