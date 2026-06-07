---
phase: 02-family-access-tenancy-roles-and-profiles
plan: 2
subsystem: auth
tags: [auth.js, next-auth, zitadel, oidc, env-validation]

# Dependency graph
requires:
  - phase: 02-01
    provides: Wave 0 test scaffolds (RED phase tests for auth, authorization, family constants)
provides:
  - Auth.js v5 ZITADEL provider configuration at repo root
  - App Router auth route handlers (GET/POST) at /api/auth/[...nextauth]
  - Validated ZITADEL env keys: AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER
  - ZITADEL sub preservation in JWT for downstream local identity mapping
  - email_verified gate rejecting unverified sign-ins
affects: [02-03 (tenancy schema), 02-04 (authorization), 02-05 (onboarding)]

# Tech tracking
tech-stack:
  added:
    - next-auth@5.0.0-beta.31 (Auth.js v5 beta for App Router ZITADEL integration)
  patterns:
    - Root-level auth.ts config export following src/lib/env.ts and src/lib/logger.ts style
    - App Router route handler exports (GET/POST from auth.js handlers)
    - Zod-validated env consumed by auth config (not direct process.env reads)

key-files:
  created:
    - auth.ts (Auth.js v5 ZITADEL config with callbacks)
    - src/app/api/auth/[...nextauth]/route.ts (App Router GET/POST handlers)
  modified:
    - package.json (next-auth@5.0.0-beta.31)
    - pnpm-lock.yaml (new lockfile with next-auth)
    - src/lib/env.ts (AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER)
    - .env.example (added auth env var placeholders)

key-decisions:
  - "JWT session strategy (not database adapter) — aligned with ZITADEL Next.js example and avoids @auth/drizzle-adapter dependency"
  - "ZITADEL sub preserved in JWT callback for downstream local identity mapping — stable key, not mutable email"
  - "email_verified gate in signIn callback — rejects explicitly false claims, allows absent/true"
  - "trustHost: true enabled for local/proxy development behind reverse proxies"
  - "offline_access scope included in authorization params for refresh token support"

patterns-established:
  - "Auth config: Root-level auth.ts exports handlers, auth(), signIn(), signOut() — same style as src/lib/env.ts and src/lib/logger.ts"
  - "Auth route: App Router [...nextauth] exports GET/POST from handlers — same pattern as src/app/api/health/route.ts"

requirements-completed: [FAM-01]

# Metrics
duration: 5 min
completed: 2026-06-07
---

# Phase 02 Plan 02: ZITADEL/Auth.js Authentication Foundation Summary

**Auth.js v5 ZITADEL provider configured with JWT session strategy, email_verified gate, sub preservation, and validated env — route compiles and builds cleanly**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-06T23:05:00Z
- **Completed:** 2026-06-07T02:10:19Z
- **Tasks:** 2 completed, 1 auto-approved (checkpoint)
- **Files modified/created:** 6

## Accomplishments

- Installed next-auth@5.0.0-beta.31 (Auth.js v5 beta) — slopcheck-verified package, no unvetted auth dependencies
- Extended `src/lib/env.ts` Zod schema with AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, and AUTH_ZITADEL_ISSUER (defaulting to https://auth.hasslab.pro)
- Created `auth.ts` at repo root: ZITADEL provider with JWT strategy, sub preservation in JWT callback, email_verified gate in signIn callback, trustHost enabled
- Created `src/app/api/auth/[...nextauth]/route.ts`: App Router GET/POST handlers exporting from auth.ts
- Build passes — `ƒ /api/auth/[...nextauth]` route registered as dynamic server-rendered

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Auth.js and validate ZITADEL env** — `b203486` (feat)
2. **Task 2: Add Auth.js ZITADEL route** — `95621f6` (feat)

## Files Created/Modified

- `auth.ts` — Auth.js v5 ZITADEL provider config with JWT callbacks for sub preservation and email_verified gate
- `src/app/api/auth/[...nextauth]/route.ts` — App Router GET/POST handlers exporting from auth.ts
- `package.json` — added next-auth@5.0.0-beta.31 production dependency
- `pnpm-lock.yaml` — lockfile created with next-auth and its dependencies
- `src/lib/env.ts` — added AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET (required) and AUTH_ZITADEL_ISSUER (defaulted to https://auth.hasslab.pro)
- `.env.example` — added placeholder entries for all new auth environment variables

## Decisions Made

- Used JWT session strategy (not database adapter) per ZITADEL Next.js example — avoids `@auth/drizzle-adapter` dependency and keeps sessions lightweight
- Preserved ZITADEL `sub` in JWT token and session callbacks for stable downstream local identity mapping — not mutable email
- Rejected sign-in when `email_verified` is explicitly false — satisfies threat T-02-01 mitigation
- Included `offline_access` scope in authorization params for future refresh token support
- Enabled `trustHost: true` for development behind local proxies and Kubernetes ingress

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created .env.local with placeholder values to unblock build**
- **Found during:** Task 2 (pnpm build verification)
- **Issue:** Build failed at "Collecting page data" because `env.ts` Zod parse threw on missing AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET (DATABASE_URL was also missing)
- **Fix:** Created `.env.local` (gitignored) with placeholder values for all required env vars including DATABASE_URL, so build can complete. Updated `.env.example` with new auth vars for user setup.
- **Files modified:** `.env.example` (committed), `.env.local` (gitignored, not committed)
- **Verification:** `pnpm build` passes — all routes compile, `/api/auth/[...nextauth]` registered as dynamic route
- **Committed in:** `95621f6` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Minimal — `.env.local` is gitignored and provides only build-time placeholders. Real env values must be configured via user_setup before live OIDC login works.

## Issues Encountered

- Build initially failed on relative import path (`../../../../auth` vs `../../../../../auth`) — fixed by counting directory levels from `src/app/api/auth/[...nextauth]/` to repo root
- Integration tests skipped (Docker/Podman incompatibility with Testcontainers) — pre-existing limitation documented in STATE.md

## Authentication Gates

**Task 3 (checkpoint:human-verify):** Auto-approved — `workflow.auto_advance: true` and `human_verify_mode: end-of-phase`. Live OIDC verification was not performed because ZITADEL client credentials are user_setup items requiring manual console configuration.

## User Setup Required

**External services require manual configuration.** The following environment variables must be set before live ZITADEL authentication works:

| Variable | Source | Required |
|----------|--------|----------|
| AUTH_SECRET | Generate with `npx auth secret` or password manager | Yes |
| AUTH_ZITADEL_ID | ZITADEL console application client ID | Yes |
| AUTH_ZITADEL_SECRET | ZITADEL console application client secret | Yes |
| AUTH_ZITADEL_ISSUER | Defaults to `https://auth.hasslab.pro` | No |

**ZITADEL console configuration:**
- Register redirect URI: `/api/auth/callback/zitadel` for the local app URL
- Enable dev mode for local HTTP if testing locally
- Ensure `openid`, `email`, `profile`, `offline_access` scopes are allowed

Place values in `.env.local` (already gitignored).

## Known Stubs

None — all created code is functional configuration. Live OIDC not verified (requires user-provided ZITADEL credentials).

## Next Phase Readiness

- Auth foundation ready for tenancy schema (Plan 02-03) — ZITADEL sub available in session for local identity mapping
- Route handler pattern established for auth-protected API routes
- Env validation pattern extended for future auth-related configuration
- Wave 0 RED-phase test scaffolds for `src/lib/auth/authorization` and `src/lib/families/*` await implementation in Plans 02-03 through 02-07

---
*Phase: 02-family-access-tenancy-roles-and-profiles*
*Completed: 2026-06-07*
