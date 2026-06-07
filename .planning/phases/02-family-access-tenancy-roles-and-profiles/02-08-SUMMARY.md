---
phase: 02-family-access-tenancy-roles-and-profiles
plan: "08"
subsystem: authentication
tags:
  - zitadel
  - auth-config
  - diagnostics
  - developer-tooling
dependency_graph:
  requires:
    - auth.ts
    - src/lib/env.ts
    - .env.example
  provides:
    - scripts/check-auth-config.sh
    - docs/ZITADEL-SETUP.md
  affects:
    - developer onboarding
    - local ZITADEL authentication setup
tech_stack:
  added:
    - bash diagnostic script (no new packages)
  patterns:
    - OIDC discovery endpoint validation via curl
    - placeholder detection for env vars
    - ANSI-colored terminal output
key_files:
  created:
    - scripts/check-auth-config.sh
    - docs/ZITADEL-SETUP.md
  modified: []
decisions:
  - "Script never prints secret values — only [SET]/[MISSING] labels (T-02-GC01)"
  - "ZITADEL ONLINE check uses curl against /.well-known/openid-configuration and validates 'issuer' key"
  - "Script does not use set -e so all checks run even when one fails"
  - "Guide written entirely in Brazilian Portuguese as required"
metrics:
  duration: "2 min"
  completed: "2026-06-07"
  tasks_completed: 2
  tasks_total: 3
  files_created: 2
  files_modified: 0
---

# Phase 02 Plan 08: Auth Diagnostics and ZITADEL Setup Guide Summary

ZITADEL auth diagnostic script and step-by-step local setup guide in Brazilian Portuguese, covering env var validation, placeholder detection, OIDC connectivity check, and four common troubleshooting scenarios.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Script de diagnóstico da configuração de autenticação | 3f6290d | scripts/check-auth-config.sh |
| 2 | Guia de setup ZITADEL para desenvolvimento local | 5f30901 | docs/ZITADEL-SETUP.md |
| 3 | Checkpoint: human verify (ZITADEL live login) | — | awaiting human |

## What Was Built

### scripts/check-auth-config.sh

A bash diagnostic script (executable, no new packages) that:

1. Detects `.env.local` presence and loads it
2. Validates `AUTH_SECRET` — presence and placeholder detection
3. Validates `AUTH_ZITADEL_ID` — presence and placeholder detection
4. Validates `AUTH_ZITADEL_SECRET` — presence and placeholder detection
5. Validates `AUTH_ZITADEL_ISSUER` — uses default `https://auth.hasslab.pro` if absent
6. Tests OIDC discovery endpoint connectivity via `curl --max-time 5`, validates `"issuer"` key in JSON
7. Displays expected redirect URI `http://localhost:3000/api/auth/callback/zitadel`
8. Shows pass/fail/warn summary and directs to `docs/ZITADEL-SETUP.md` on failure

Security: script uses `[SET]` / `[MISSING]` labels only — never prints actual secret values (T-02-GC01).

### docs/ZITADEL-SETUP.md

7-step setup guide in Brazilian Portuguese covering:

- ZITADEL console navigation to create a Web application
- Redirect URI configuration (`http://localhost:3000/api/auth/callback/zitadel`) and Dev Mode activation
- Client ID and Client Secret retrieval
- `AUTH_SECRET` generation via `openssl rand -base64 33`
- Complete `.env.local` template
- Pre-flight check via `bash scripts/check-auth-config.sh`
- Live login test walkthrough
- Troubleshooting for 4 common errors: `redirect_uri_mismatch`, `CLIENT_FETCH_ERROR`, blank page after login, missing ZITADEL `sub` in session

## Checkpoint Status

Task 3 is a `checkpoint:human-verify` gate. The automation portion (Tasks 1 and 2) is complete. Human verification requires:

1. Configuring `.env.local` by following `docs/ZITADEL-SETUP.md`
2. Running `bash scripts/check-auth-config.sh` and confirming all checks pass
3. Starting `pnpm dev` and testing live ZITADEL login
4. Confirming post-login redirect to `/family/onboarding` or `/family/children`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond what the plan's threat model already covers.

## Known Stubs

None — this plan produces diagnostic tooling and documentation, not UI components with data dependencies.

## Self-Check: PASSED

- [x] `scripts/check-auth-config.sh` exists and is executable (`chmod +x`)
- [x] `docs/ZITADEL-SETUP.md` exists with 7 steps and troubleshooting section
- [x] Commit `3f6290d` exists (Task 1)
- [x] Commit `5f30901` exists (Task 2)
- [x] Script runs without syntax errors, diagnoses env vars, tests ZITADEL ONLINE
- [x] Script never prints actual secret values (T-02-GC01 compliant)
- [x] Guide covers all 4 required env vars and the redirect URI
- [x] All 4 common errors documented: `redirect_uri_mismatch`, `CLIENT_FETCH_ERROR`, blank page, missing `sub`
