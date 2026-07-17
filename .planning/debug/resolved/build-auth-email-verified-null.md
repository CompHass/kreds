---
status: resolved
trigger: "erro no build: auth.ts email_verified boolean | null | undefined"
created: 2026-07-17
updated: 2026-07-17
---

# Debug Session: Auth Build Nullable Email Verification

## Symptoms

- Expected: the production Docker image passes Next.js TypeScript validation.
- Actual: build fails at `auth.ts` because Auth.js exposes `profile.email_verified` as `boolean | null | undefined`.

## Current Focus

- hypothesis: the local sign-in policy contract omitted Auth.js's nullable claim type.
- test: normalize `null` before passing the claim and run focused tests/type checking.
- expecting: no Phase 12 auth type errors and unchanged sign-in decisions.
- next_action: commit and push the build fix.

## Resolution

- root_cause: Auth.js types the OIDC `email_verified` claim as `boolean | null | undefined`, but the extracted policy accepted only `boolean | undefined`.
- fix: normalize `null` to `undefined` at the Auth.js adapter boundary.
- verification: 8 focused tests passed; targeted TypeScript output contains no Phase 12 auth errors; diff check passed.
- files_changed: auth.ts
