# 01-01 Summary — Base Next.js Scaffold

**Status:** ✅ Complete
**Completed:** 2026-06-06

## Deliverables

- package.json with all dependencies and scripts
- tsconfig.json with ES2022, bundler resolution, strict mode
- next.config.ts with `output: 'standalone'`
- postcss.config.mjs with @tailwindcss/postcss
- .npmrc with pnpm public-hoist-pattern
- .env.example with DATABASE_URL, NODE_ENV, NEXT_PUBLIC_APP_URL, ZITADEL_ISSUER
- .gitignore covering next.js, node_modules, env files, test artifacts
- src/app/layout.tsx — root layout with SerwistProvider, metadata
- src/app/page.tsx — static "Kreds" shell
- src/app/globals.css — Tailwind v4 import
- src/app/api/health/route.ts — GET returning status/version/timestamp
- src/lib/db/schema/index.ts — families pgTable with uuid id, name, timezone, timestamps
- src/lib/env.ts — Zod-validated environment variables
- src/lib/logger.ts — Pino structured logger

## Verification

- [x] Base scaffold files created without dependency execution
- [x] Human package verification checkpoint passed (all [ASSUMED] packages approved)
- [x] `pnpm install` exits 0
- [x] `pnpm exec tsc --noEmit` exits 0
- [x] Dev server starts and `/api/health` returns 200 with `{"status":"ok"}`
- [x] Home page renders "Kreds" in h1

## Issue Notes

- `@serwist/next/clients` import path was incorrect — actual export is `@serwist/next/react`
- `@serwist/next` v9.5.11 exports SerwistProvider from `./react` subpath, not `./clients`
- pino-pretty 14.1.0 does not exist; installed 13.1.3 instead
- @vitejs/plugin-react 4.4.2 does not exist; installed 4.5.0 instead
