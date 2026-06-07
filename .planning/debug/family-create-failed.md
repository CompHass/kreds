---
status: resolved
slug: family-create-failed
trigger: "erro ao criar familia {\"error\":\"Failed to create family\"}"
created: 2026-06-07
updated: 2026-06-07
---

# Debug Session: family-create-failed

## Symptoms

- **Expected:** Submit onboarding form → family created → redirect to `/family/children`
- **Actual:** Generic `{"error":"Failed to create family"}` returned
- **Error messages:** `{"error":"Failed to create family"}`
- **Timeline:** During Phase 2 UAT — first attempt to create a family
- **Reproduction:** Both form submit at `/family/onboarding` and direct `POST /api/families` fail

## Current Focus

- hypothesis: RESOLVED
- test: confirmed via Node.js 26 REPL test
- expecting: n/a
- next_action: n/a
- reasoning_checkpoint: Two bugs found and fixed

## Evidence

- timestamp: 2026-06-07T21:00:00Z
  source: code-analysis
  content: >
    route.ts POST handler uses try { request.json() } catch { request.formData() }.
    In Node.js 26 (undici), after json() fails with SyntaxError, bodyUsed=true.
    formData() then throws "Body is unusable: Body has already been read".
    This TypeError propagates to outer catch, returning {"error":"Failed to create family"}.

- timestamp: 2026-06-07T21:10:00Z
  source: node-repl-test
  content: >
    Confirmed with Node.js 26 REPL: json() on application/x-www-form-urlencoded body
    sets bodyUsed=true after failure. formData() throws "Body is unusable: Body has already been read".

- timestamp: 2026-06-07T21:15:00Z
  source: code-analysis
  content: >
    Second bug: onboarding page.tsx uses <form action="/api/families" method="POST"> (HTML native submit).
    After server returns JSON 201, browser renders raw JSON instead of redirecting.
    The redirectTo field in the response is never followed by the browser.

## Eliminated

- Database schema: families, family_memberships, kreds_identities — all correct, transactions work fine
- Authentication: auth() returns session correctly, requireAuthenticatedIdentity works
- createFamilyForGuardian: transaction logic correct, confirmed via psql simulation

## Resolution

- root_cause: >
    Two bugs: (1) In Node.js 22+, the Web Fetch API body stream is consumed after a failed
    request.json() call (bodyUsed=true). The route's try/catch fallback to request.formData()
    always throws "Body is unusable" since the onboarding form submits as application/x-www-form-urlencoded.
    This causes the outer catch to return {"error":"Failed to create family"}.
    (2) Even if body parsing succeeded, the HTML native form submit ignores the JSON response
    and the user is never redirected to /family/children.

- fix: >
    (1) Replaced try/catch body parsing with Content-Type-aware parseBody() helper that
    reads json() only when Content-Type is application/json, and formData() when
    application/x-www-form-urlencoded or multipart/form-data — never reads the body twice.
    (2) Replaced native <form action="/api/families"> with a Server Action pattern:
    created actions.ts (createFamilyAction 'use server') and OnboardingForm.tsx
    ('use client' with useActionState) so the form redirects via redirect('/family/children')
    on success and displays inline errors on failure.

- files_changed:
    - src/app/api/families/route.ts
    - src/app/family/onboarding/actions.ts (new)
    - src/app/family/onboarding/OnboardingForm.tsx (new)
    - src/app/family/onboarding/page.tsx
