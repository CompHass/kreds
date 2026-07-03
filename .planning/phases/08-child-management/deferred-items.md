# Deferred Items — Phase 08 child-management

Out-of-scope failures observed during Plan 04 execution (`npm test` full-suite run).
Not caused by Plan 04 changes — confirmed pre-existing via `git stash` before/after
comparison. Logged per executor scope-boundary rule (do not fix, do not re-run hoping
they resolve).

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Broken import | `tests/unit/family-authorization.test.ts` imports non-existent module | Pre-existing, unrelated to Plan 04 | 08-04 |
| Broken import | `tests/unit/family-constants.test.ts` imports non-existent module | Pre-existing, unrelated to Plan 04 | 08-04 |
| Broken import | `tests/unit/family-invitations.test.ts` imports `../../src/lib/families/invitations` (does not exist) | Pre-existing, unrelated to Plan 04 | 08-04 |
| Broken import | `tests/unit/glossary.test.ts` imports `../../src/modules/glossary/terms` (does not exist) | Pre-existing, unrelated to Plan 04 | 08-04 |
| Integration/E2E infra | `tests/integration/db-connection.test.ts`, `family-tenancy.test.ts`, `family-audit-isolation.test.ts`, `family-invitations.test.ts`, `tests/e2e/*.spec.ts` fail when run via plain `npm test` | Requires Testcontainers Docker daemon / Playwright browser install / running app — not part of this plan's `npm test -- tests/unit/<file>` verification scope | 08-04 |
