---
status: resolved
trigger: "erro no cadastro de uma conta"
created: 2026-07-17
updated: 2026-07-17
---

# Debug Session: Signup Zitadel Payload

## Symptoms

- Expected: creating a guardian account creates the Zitadel user, Kreds identity/family, and starts the first provisional session.
- Actual: signup form returns the generic “Não foi possível criar a conta” message.
- Reproduction: submit valid email, password and matching confirmation on `/signup`.

## Current Focus

- hypothesis: `POST /v2/users/human` receives the wrong JSON shape; the subsequent first-login flow also rejects the newly created unverified account.
- test: compare request against current Zitadel v2 contract and cover signup/provisional-login branches with focused tests.
- expecting: top-level user payload succeeds; one-time provisional token permits only the signup-created first session.
- next_action: deploy the migration and verify one real signup in the approved environment.

## Evidence

- 2026-07-17: current client nests `profile`, `email`, and `password` under `user`; Zitadel v2 requires them at the request root.
- 2026-07-17: HTTP 400 is incorrectly classified as duplicate and its safe provider detail is discarded.
- 2026-07-17: Auth.js `signIn` callback redirects all unverified Credentials users, including immediately-created signup users.
- 2026-07-17: `syncGuardianIdentity` recovery creates a new family without checking `guardianInvitations`.

## Resolution

- root_cause: Zitadel human-user fields were nested under an invalid `user` wrapper; HTTP 400 was mislabeled as duplication, and the normal unverified-email gate also blocked the signup-created first session.
- fix: corrected the v2 payload; preserved sanitized policy errors; added a five-minute opaque signup capability stored only as a hash and consumed atomically; made recovery invitation-aware.
- verification: 9 focused unit tests passed; local migration applied; SQL replay check accepted the token once and rejected the second consumption; TypeScript showed no new source errors. Container build compiled application code but was OOM-killed during its TypeScript step (exit 137).
- files_changed: auth.ts, guardian-signup.ts, login-client.ts, provisional-signup.ts, guardian-signin-policy.ts, guardian-sync.ts, schema/migration 0012, focused tests.
