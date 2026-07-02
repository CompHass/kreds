---
status: resolved
trigger: "esta com erro: esse corepack demora para baixar / Corepack is about to download pnpm 11.9.0 / EACCES permission denied, open '/app/_tmp_18_...' / pnpm.mjs install exit code 243"
created: 2026-07-02
updated: 2026-07-02
---

## Symptoms

- Expected: migration container starts and runs `pnpm db:migrate`.
- Actual: corepack tries to download pnpm 11.9.0 from registry, then fails with `EACCES: permission denied, open '/app/_tmp_18_...'` running `pnpm install`.
- Timeline: started right after the Dockerfile `migration` stage was changed (this session, commit 7c37981) — never happened before.
- Reproduction: build/run the `migration` target image (`docker build --target migration` or the `kreds-db-push` deploy job).

## Current Focus

hypothesis: migration stage no longer COPYs package.json, so corepack has no `packageManager` field to pin pnpm@10.34.1 — falls back to fetching latest pnpm (11.9.0) from the registry, then tries to run its own `pnpm install` bootstrap, which fails because the runtime filesystem/user isn't writable there.
status: CONFIRMED

## Evidence

- timestamp: 2026-07-02
  check: Dockerfile migration stage (lines 25-31) copies only `drizzle.config.ts` and `drizzle/`, not `package.json`.
  result: confirmed — no package.json in /app for that stage.
- timestamp: 2026-07-02
  check: package.json packageManager field
  result: `"packageManager": "pnpm@10.34.1"` — this is what corepack reads to avoid hitting the registry for a version.

## Resolution

root_cause: The `migration` Dockerfile stage was trimmed (this session, to stop copying the whole app) but `package.json` was dropped along with it. Without `package.json`, corepack has no pinned `packageManager` version to shim, so it falls back to fetching the latest pnpm from the npm registry (11.9.0) and tries to self-install it — which fails with EACCES in the container's restricted filesystem. As a side effect, `pnpm db:migrate` would also have failed anyway ("missing script") since `db:migrate` is defined in package.json.
fix: Add `COPY package.json ./` to the `migration` stage so corepack can pin the correct pnpm version and `pnpm db:migrate` resolves its script. Also add `corepack prepare --activate` to the same RUN step so the pinned pnpm binary is fetched and baked into the image at build time — without this, corepack still re-downloaded pnpm on every container start (the original "demora pra baixar" complaint), even after the EACCES was fixed.
verification: `docker build --target migration` succeeds; `docker run` against a real Postgres (via port-forward) prints "migrations applied successfully!" with no corepack download line.
files_changed:
  - Dockerfile
