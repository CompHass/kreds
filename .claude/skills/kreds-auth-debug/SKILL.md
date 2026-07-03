---
name: kreds-auth-debug
description: Check live Zitadel project/app config when debugging login, session, OIDC callback, or auth-related bugs in Kreds. Use whenever a bug report mentions login not working, redirect loop, callback error, session not persisting, "invalid_client", "redirect_uri mismatch", or any auth/OIDC issue in this repo.
metadata:
  domain: auth
  triggers: login, auth, oidc, zitadel, session, callback, redirect_uri, invalid_client, sign in, logout
  scope: kreds
---

# Kreds Auth Debug — Zitadel Live Config Check

Kreds config docs (CLAUDE.md/AGENTS.md) record Zitadel project/app IDs, but they drift —
config changes happen directly in Zitadel, not through this repo. Before debugging any
login/auth issue, pull the live config instead of trusting the docs.

## Step 1 — Get the service account key

```bash
kubectl config use-context hasslab-k3s
kubectl -n zitadel get secret iam-admin -o jsonpath='{.data.iam-admin\.json}' | base64 -d > /tmp/iam-admin.json
```

This is a Zitadel service-account JWT-profile key (`type: serviceaccount`, RSA private key, `userId`).
Treat `/tmp/iam-admin.json` as a secret — delete it when done (`rm /tmp/iam-admin.json`).

## Step 2 — Build a signed JWT assertion

Use `zitadel-tools` if installed:
```bash
zitadel-tools key2jwt --audience=https://auth.hasslab.pro --key=/tmp/iam-admin.json --issuer=$(jq -r .userId /tmp/iam-admin.json) > /tmp/assertion.jwt
```

If `zitadel-tools` isn't available, build the JWT manually (RS256, `kid` header = `keyId` from the
key file, `iss`/`sub` = `userId`, `aud` = `https://auth.hasslab.pro`, short `exp`) — a small Node
script using `jsonwebtoken` is fine since this is already a Node/TS project.

## Step 3 — Exchange for an access token

```bash
curl --request POST \
  --url https://auth.hasslab.pro/oauth/v2/token \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer \
  --data scope='openid profile urn:zitadel:iam:org:project:id:zitadel:aud' \
  --data-urlencode assertion@/tmp/assertion.jwt
```

Extract `access_token` from the JSON response.

## Step 4 — Query the Management API

Project ID and App (clientId) from CLAUDE.md as of last check — **verify these still resolve**,
don't assume:

```bash
TOKEN="<access_token from step 3>"
PROJECT_ID=376396522276782110
APP_ID=376397200093151262

# Confirm project still exists / is active
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://auth.hasslab.pro/management/v1/projects/$PROJECT_ID" | jq .

# Get the OIDC app config — redirect URIs, grant types, response types, auth method
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://auth.hasslab.pro/management/v1/projects/$PROJECT_ID/apps/$APP_ID" | jq .
```

If `PROJECT_ID`/`APP_ID` return 404, list all apps in the org to find the current ones:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://auth.hasslab.pro/management/v1/projects/$PROJECT_ID/apps/_search" \
  -X POST -H 'Content-Type: application/json' -d '{}' | jq .
```

## What to check against the bug report

| Symptom | Check |
|---|---|
| Redirect loop / stuck on login | `redirectUris` on the OIDC app must include exactly `https://kreds.hasslab.pro/api/auth/callback/zitadel` (no trailing slash mismatch) |
| `invalid_client` | `clientId` in `AUTH_ZITADEL_ISSUER`/app config vs. `kreds-config` ConfigMap and app secrets |
| Session not persisting | `AUTH_TRUST_HOST=true` and `AUTH_URL` match the OIDC app's registered redirect host |
| Wrong locale on login screen | Confirm login UI version — V2 at `/ui/v2/login` per CLAUDE.md; check if it changed |
| Scopes/claims missing from session | Check `grantTypes`/`responseTypes` and requested `scope` in the app's OIDC settings |

## Cleanup

```bash
rm -f /tmp/iam-admin.json /tmp/assertion.jwt
```

Never commit the key file or paste its contents into chat/logs.
