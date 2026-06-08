---
slug: guardian-invite-500
status: resolved
trigger: manual
goal: find_and_fix
created: 2026-06-08
resolved: 2026-06-08
---

# Debug Session: guardian-invite-500

## Symptoms

- Browser console: `Unsafe attempt to load URL https://kreds.hasslab.pro/api/families/invitations from frame with URL chrome-error://chromewebdata/`
- HTTP ERROR 500 on POST to `/api/families/invitations`
- Service worker preload warnings (noise, not root cause)

## Known Context

- Git status shows untracked files: `src/app/api/families/[familyId]/` and `src/app/family/access/` and `src/lib/families/child-session.ts`
- Recent commits added child PIN feature (unrelated)
- The invitation endpoint path in error is `/api/families/invitations` (flat, not nested under `[familyId]`)

## Root Cause Analysis

**Location:** `src/app/api/families/invitations/route.ts` lines 33–40 (before fix)

**Mechanism:**
1. `invitations/page.tsx` uses a plain HTML `<form action="/api/families/invitations" method="POST">`. The browser submits with `Content-Type: application/x-www-form-urlencoded`.
2. The route handler called `request.json()` first in a try block, expecting it to fail gracefully and fall through to `request.formData()`.
3. On Node.js 22+ (which uses undici for the Fetch API), calling `request.json()` consumes the underlying `ReadableStream` even when JSON parsing fails. The stream is marked `bodyUsed = true`.
4. The subsequent `request.formData()` call in the catch block throws `TypeError: Body is unusable: Body has already been read`.
5. This exception escapes the inner try/catch, is caught by the outer catch at line 278, and the handler returns `{ status: 500 }`.

**Confirming evidence:**
- `src/app/api/families/route.ts` already has the correct fix with this exact comment: "Node.js 22+ (undici) marks the body stream as consumed after any read attempt, even a failed one."
- `src/app/api/families/children/route.ts` had the identical broken pattern (latent defect, not currently triggered because ChildrenForm uses React Server Actions, not direct HTTP).

## Evidence

- timestamp: 2026-06-08
  file: src/app/api/families/invitations/route.ts
  note: broken try-json-then-formData pattern, lines 33-40

- timestamp: 2026-06-08
  file: src/app/api/families/route.ts
  note: same route file already has the correct Content-Type-aware parseBody helper as reference

- timestamp: 2026-06-08
  file: src/app/family/invitations/page.tsx
  note: plain HTML form with method=POST submits as application/x-www-form-urlencoded

## Resolution

**root_cause:** `request.json()` on Node.js 22+/undici consumes the request body stream even on parse failure; the subsequent `request.formData()` call in the catch block always throws "Body is unusable", producing a 500.

**fix:** Replaced the try-json-then-formData pattern in `invitations/route.ts` with a `parseBody` helper that inspects the `Content-Type` header first and calls only one read method. Also applied the same fix to `children/route.ts` (same latent bug, same pattern).

**files changed:**
- `src/app/api/families/invitations/route.ts` — added `parseBody` helper, replaced inline try/catch body reading
- `src/app/api/families/children/route.ts` — fixed same pattern inline

**status:** fixed
