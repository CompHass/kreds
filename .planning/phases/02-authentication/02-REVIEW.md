---
phase: 02-authentication
reviewed: 2026-06-21T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - src/app/(child)/child/[childId]/login/page.tsx
  - src/app/actions/child-auth.ts
  - src/app/actions/guardian-auth.ts
  - src/app/api/auth/[...nextauth]/route.ts
  - src/app/family/access/[familyId]/page.tsx
  - src/app/login/page.tsx
  - src/app/login/reset/page.tsx
  - src/components/auth/auth-input.tsx
  - src/components/auth/gate-lock.tsx
  - src/components/auth/guardian-login-form.tsx
  - src/components/auth/numeric-keypad.tsx
  - src/components/auth/password-reset-form.tsx
  - src/components/auth/pin-dot.tsx
  - src/components/auth/pin-dots.tsx
  - src/components/auth/pin-screen.tsx
  - src/components/auth/profile-card.tsx
  - src/components/auth/social-auth-buttons.tsx
  - src/components/auth/spinner-button.tsx
  - src/lib/auth/child-guard.ts
  - src/lib/families/child-pin.ts
  - src/lib/families/child-session.ts
  - src/middleware.ts
findings:
  critical: 6
  warning: 5
  info: 4
  total: 15
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

This phase implements the full authentication layer for the Kreds app: guardian login via Zitadel OIDC plus a custom child PIN-based session. The architecture is generally sound — JWT-signed child sessions, bcrypt PIN hashing, and middleware-level route guards are all present. However, there are six critical defects spanning security (brute-force bypass, unverified JWT claims used for redirect, open IDOR on child profile enumeration), correctness (race condition in the PIN flow, disabled `active` filter, missing `no-pin` UI path), and five quality warnings. These must be resolved before the authentication phase ships.

---

## Critical Issues

### CR-01: In-memory brute-force counter is bypassed by any server restart and is not per-instance safe in multi-process deployments

**File:** `src/lib/families/child-session.ts:32`

**Issue:** The brute-force state is stored in a module-level `Map` (`const attempts = new Map<string, number>()`). This means:
1. Every server restart (including Next.js hot reload in development) resets all counters silently — an attacker can simply force a process restart to clear lockouts.
2. In any multi-process or multi-instance deployment (e.g., Vercel serverless with multiple lambdas), each instance has its own counter; an attacker with 5 instances available gets `5 × MAX_ATTEMPTS` tries before any one instance blocks them.
3. There is no time window — a single failed attempt from a month ago permanently occupies a counter slot until the process is recycled.

The `checkBruteForce` / `recordFailedAttempt` / `resetAttempts` trio in `child-session.ts` must be backed by a persistent, shared store (Redis, database row with TTL, or similar).

**Fix:** Move attempt tracking to the database or a Redis/KV store keyed on `(childId, window)` with an expiry of, for example, 15 minutes:

```ts
// Pseudocode — replace in-memory Map with DB/Redis
await db.insert(failedAttempts).values({ childId, attemptedAt: new Date() })
const recent = await db.select().from(failedAttempts)
  .where(and(eq(failedAttempts.childId, childId), gte(failedAttempts.attemptedAt, windowStart)))
return { blocked: recent.length >= MAX_ATTEMPTS, attemptsLeft: MAX_ATTEMPTS - recent.length }
```

---

### CR-02: Middleware uses `decodeJwt` (unauthenticated) on expired token to extract `familyId` for redirect — attacker-controlled redirect target

**File:** `src/middleware.ts:51-54`

**Issue:** When `jwtVerify` fails (expired or invalid token), the middleware falls into a catch block and calls `decodeJwt(cookieValue)` — which performs **no signature verification** — then unconditionally redirects the browser to `/family/access/${familyId}` where `familyId` is taken from the unverified payload. A user who crafts a JWT with an arbitrary `familyId` (e.g., pointing to a non-existent family or to another family's profile listing) will be redirected there without any check. The redirect target is currently a relative URL constructed with `new URL(...)`, so open-redirect to external origins is not possible, but an attacker can enumerate or probe `/family/access/<any-uuid>` by embedding it in a cookie.

Even more critically, the `familyId` from an unsigned JWT is used as a routing key. If an attacker can obtain or forge a JWT signed with a wrong key (malformed base64 causing `jwtVerify` to throw), they direct any user who visits a `/child/*` route to an arbitrary family profile page, revealing which children belong to that family.

**Fix:** On `jwtVerify` failure, do not attempt to recover any redirect from the unverified token. Redirect unconditionally to a safe landing page:

```ts
} catch {
  // Do not trust any field from an unverified or expired token
  return NextResponse.redirect(new URL('/', req.url))
}
```

If a contextual redirect (back to the correct family) is strongly desired, store the `familyId` in a separate, short-lived, signed cookie at login time rather than decoding it from the expired JWT.

---

### CR-03: `/family/access/[familyId]` page has no authentication guard — any unauthenticated user can enumerate child profiles for any family

**File:** `src/app/family/access/[familyId]/page.tsx:1-94`

**Issue:** This page accepts a `familyId` URL parameter, queries `childProfiles` from the database for that family, and renders names, avatar initials, and accent colors for every child — with no session check whatsoever. The middleware marks `/family/access/` as a public pass-through route (line 22 of `middleware.ts`), meaning:

- Any unauthenticated visitor who guesses or brute-forces a family UUID can list all children in that family by name.
- This is a direct IDOR (Insecure Direct Object Reference) on child personal data.

The comment in the middleware ("ORDEM IMPORTA: /family/access/ deve ser avaliado ANTES de /family/") explains the routing priority but does not justify making it fully public. The page should at minimum verify that the requester has an active guardian session for the requested family.

**Fix:** Add a session check at the top of the server component. A guardian's NextAuth session must be verified and must include the requested `familyId`:

```ts
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function SelectProfilePage({ params }) {
  const { familyId } = await params
  const session = await auth()
  if (!session) redirect('/login')
  // Optionally verify session.user belongs to this familyId
  // ...
}
```

---

### CR-04: Child login page (`/child/[childId]/login`) leaks child display name and family affiliation without any authentication

**File:** `src/app/(child)/child/[childId]/login/page.tsx:14-35`

**Issue:** The page is intentionally public (middleware line 24) to allow PIN entry without a session. However, the server component fetches `displayName` and `familyId` from the database for the requested `childId` and renders the child's name in the greeting. An unauthenticated attacker who knows (or brute-forces) any valid `childId` UUID can thus:

1. Confirm that a given UUID belongs to an existing child profile.
2. Learn the child's display name.
3. Learn the `familyId` (it is passed as a prop to `PinScreen`, which embeds it in the "Trocar perfil" button, navigating to `/family/access/${familyId}`).

Combined with CR-03, this creates a chain: guess a child UUID → get family UUID → list all siblings.

**Fix:** Consider not rendering the child's name until after a successful PIN entry (show only a generic "Digite seu PIN" prompt), or rate-limit unauthenticated requests to this endpoint at the infrastructure/middleware level. At minimum, do not pass `familyId` to `PinScreen` in plain form; have the post-auth redirect to the family page computed server-side.

---

### CR-05: Race condition in `handleDigit` — a second tap during the async `verifyChildPin` network round-trip causes double-submission

**File:** `src/components/auth/pin-screen.tsx:22-48`

**Issue:** `handleDigit` is an `async` function. The guard at line 23 checks `if (error || gateOpen) return`, but between the moment `setPin(newPin)` is called (line 29) and `verifyChildPin` resolves (line 30), the component is awaiting a server action. During this window:

- `pin.length` is 4 and `gateOpen` is false and `error` is false.
- The guard `if (pin.length >= 4) return` at line 24 would fire for a 5th digit, but only after React re-renders with `newPin` set. If the user taps rapidly before the re-render completes, `pin` in the closure still holds the previous 3-digit value, `newPin` becomes 4 digits, and `verifyChildPin` is called a second time concurrently.

This can trigger two simultaneous `verifyChildPin` calls with the same PIN, burning two brute-force attempts on a correct PIN or causing duplicate cookie writes. On a slow network connection the window is wide enough for this to be reliably triggered.

**Fix:** Introduce a dedicated loading/pending state that is set synchronously before the `await`:

```ts
const [pending, setPending] = useState(false)

async function handleDigit(d: string) {
  if (error || gateOpen || pending) return
  if (pin.length >= 4) return
  const newPin = pin + d
  setPin(newPin)
  if (newPin.length === 4) {
    setPending(true)
    try {
      const result = await verifyChildPin(childId, newPin)
      // ... handle result
    } finally {
      setPending(false)
    }
  }
}
```

---

### CR-06: `child-auth.ts` does not validate PIN format before calling bcrypt — allows bcrypt timing/resource abuse

**File:** `src/app/actions/child-auth.ts:29`

**Issue:** `verifyChildPin` receives a `pin: string` from the client and passes it directly to `bcrypt.compare(pin, child.pinHash)`. The `validatePinFormat` function exists in `child-pin.ts` (line 6) but is never called in the server action. `bcryptjs` will happily compare arbitrarily long strings — there is a known bcrypt truncation issue where passwords longer than 72 bytes are silently truncated, meaning PINs of any length beyond that are treated as the same. More importantly, a server action accepting an unbounded string with no length check creates a trivial resource-exhaustion vector: a single POST with a 10 MB `pin` value will cause bcrypt to work on a 72-byte prefix (due to truncation) but the allocation and transmission overhead is real.

Additionally, not validating format leaks implementation detail: `no-pin` is returned for missing hash, `invalid` for wrong PIN, but no `format-error` — so if a child's PIN is 4 digits but the attacker submits 100 digits, bcrypt still runs and returns `invalid`, confirming the PIN exists but is wrong.

**Fix:** Call `validatePinFormat` at the top of `verifyChildPin` before any database or bcrypt work:

```ts
import { verifyPin, validatePinFormat } from '@/lib/families/child-pin'

export async function verifyChildPin(childId: string, pin: string) {
  if (!validatePinFormat(pin)) return { error: 'invalid' as const }
  const bf = checkBruteForce(childId)
  // ...
}
```

---

## Warnings

### WR-01: `active` column on `childProfiles` is never filtered — deactivated children appear on the profile selection screen and can still log in

**File:** `src/app/family/access/[familyId]/page.tsx:13-21` and `src/app/(child)/child/[childId]/login/page.tsx:14-21`

**Issue:** The schema defines `active: boolean('active').notNull().default(true)` (schema line 66), implying child profiles can be deactivated. Neither the profile listing query nor the child login page adds `.where(eq(childProfiles.active, true))` to the filter. Deactivated children appear on the "Quem está aqui?" screen and their PIN login endpoint remains functional.

**Fix:** Add the `active` filter to both queries:

```ts
// family/access page
.where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))

// child login page
.where(and(eq(childProfiles.id, childId), eq(childProfiles.active, true)))
```

---

### WR-02: Password reset form uses a fake `setTimeout` stub — the `sent` state is displayed even when no reset email was sent

**File:** `src/components/auth/password-reset-form.tsx:99`

**Issue:** `handleSubmit` awaits `new Promise((resolve) => setTimeout(resolve, 600))` — a deliberate stub. After the delay the form always transitions to the `sent` state, regardless of whether a real reset request was sent. The comment acknowledges this ("GAUTH-05/RESEARCH OQ2: endpoint de reset é [ASSUMED]"). The risk: if this ships to production without the stub being replaced, users who enter their email will see "E-mail enviado!" but no email will be sent. They will then be unable to recover their account. Given the comment says the threat model entry for this is "accept", there is a real chance this stub is forgotten.

**Fix:** Replace the stub with an actual call to the Zitadel reset endpoint or mark the entire feature with a visible runtime guard:

```ts
// Option: throw a clear error if stub is still in place
if (process.env.NODE_ENV === 'production') {
  throw new Error('Password reset not implemented — replace stub before deploying')
}
```

At minimum, log a server-side warning so the stub is not silently shipped.

---

### WR-03: `rememberMe` state in `GuardianLoginForm` is collected but never used

**File:** `src/components/auth/guardian-login-form.tsx:109` and `src/components/auth/guardian-login-form.tsx:122-124`

**Issue:** The checkbox "Lembrar-me" is rendered, its state is tracked in `useState`, and it toggles visually — but it is never passed to `loginWithCredentials(formData)`. The `loginWithCredentials` action simply calls `signIn('zitadel', { redirectTo: '/family' })` with no session duration hint. The checkbox creates a false expectation: users who check "Lembrar-me" believe the session will persist longer, but session lifetime is controlled entirely by the NextAuth/Zitadel defaults with no customization.

**Fix:** Either pass the value to the server action and honor it (e.g., append `formData.set('rememberMe', rememberMe ? '1' : '0')` and handle it), or remove the checkbox entirely until the feature is implemented.

---

### WR-04: `SocialAuthButtons` fire server actions without any error handling — unhandled promise rejections on auth failure

**File:** `src/components/auth/social-auth-buttons.tsx:15, 57, 87`

**Issue:** Each button's `onClick` calls the server action directly without `await` or `.catch()`. If `loginWithProvider('google')` throws (e.g., network error, Zitadel misconfiguration, provider not found), the promise is silently rejected. The user sees no feedback — the button appears inert. This is particularly bad on mobile where network errors are common.

```tsx
onClick={() => loginWithProvider('google')}  // no await, no .catch
```

**Fix:** Wrap calls in an async handler with error state:

```tsx
const [authError, setAuthError] = useState<string | null>(null)
async function handleProvider(idp: 'google' | 'apple') {
  try { await loginWithProvider(idp) }
  catch { setAuthError('Falha ao entrar. Tente novamente.') }
}
// ...
onClick={() => handleProvider('google')}
```

---

### WR-05: Middleware guardian session check is heuristic-only — presence of `authjs.session-token` cookie is not verified

**File:** `src/middleware.ts:64-73`

**Issue:** For `/family/*` and `/guardian/*` routes, the middleware only checks whether the NextAuth session cookie is present (`sessionToken` is truthy). It does not verify the JWT signature or expiry. A tampered or expired session cookie will pass the middleware check and the user will reach the server component. While the server component should call `auth()` to re-verify, any server component that relies on middleware protection without calling `auth()` itself is silently unprotected.

This is a defense-in-depth failure. The child session for `/child/*` routes is fully verified with `jwtVerify` (line 39), making the inconsistency confusing for developers maintaining both branches.

**Fix:** Either verify the NextAuth JWT in middleware using the same `jwtVerify` approach (requires knowing the NextAuth secret), or document clearly that every `/family/*` server component must call `auth()` independently. The heuristic check is acceptable as a first line of defense only if the downstream components always re-verify.

---

## Info

### IN-01: `validateChildSessionScope`, `extractChildProfileId`, and `extractFamilyId` in `child-guard.ts` are exported but never imported anywhere

**File:** `src/lib/auth/child-guard.ts:9-24`

**Issue:** All three exported functions in `child-guard.ts` have zero callers in the codebase. The middleware uses `jwtVerify` directly and does not import from `child-guard`. The server action does not use it either. Dead code — if the intent was to use `validateChildSessionScope` in server components or API routes that serve child-authenticated requests, those call sites are missing.

**Fix:** Either wire up `validateChildSessionScope` in the child-area server components (e.g., `/child/[childId]/garden`) or delete the file until it is needed.

---

### IN-02: `accentColor` CSS variable `--accent` is set on the `ProfileCard` wrapper but never referenced in any child style

**File:** `src/components/auth/profile-card.tsx:19-22`

**Issue:** The CSS custom property `--accent` is set via inline style (`{ '--accent': accentColor } as React.CSSProperties`) but is never used by any descendant element in the component. The avatar gradient is hardcoded to `#5A8A66 / #3E6B4F` regardless of the `accentColor` value. This means the per-child colour customisation feature is silently not working.

**Fix:** Use `--accent` in the avatar gradient:

```tsx
background: `linear-gradient(135deg, var(--accent, #5A8A66) 0%, var(--accent, #3E6B4F) 100%)`
```

Or derive a dark shade from the accent for the gradient end stop.

---

### IN-03: `PinDots` aria-label hardcodes "4 dígitos" but the PIN format allows 4–6 digits

**File:** `src/components/auth/pin-dots.tsx:14`

**Issue:** The accessible label reads `PIN: ${count} de 4 dígitos preenchidos` but `validatePinFormat` in `child-pin.ts` accepts `/^\d{4,6}$/` — PINs of 4, 5, or 6 digits are all valid. The `PinDots` component renders exactly 4 dots (`Array.from({ length: 4 })`), so if a child ever has a 5- or 6-digit PIN, the last digit(s) are silently accepted by the server but not reflected in the UI — the user would see 4 filled dots with no visual indication that a 5th character was entered, yet the submission fires when `pin.length === 4`.

**Fix:** Either lock PIN length to exactly 4 digits everywhere (including `validatePinFormat`) or make `PinDots` accept a `maxLength` prop and render the correct number of dots.

---

### IN-04: `console.error` in `auth.ts` leaks internal DB error details to server logs without sanitization

**File:** `auth.ts:66-68` (referenced for context — not in the reviewed file list, but imported by `guardian-auth.ts`)

**Issue:** `console.error('[auth] kreds_identities upsert failed:', err)` will print the full DB error including table names, column names, and potentially partial query contents to server logs in production. While this is not a client-side leak, it is a log hygiene issue that can expose schema details to log aggregation systems.

**Fix:** Log a sanitized message and a unique error code for correlation:

```ts
console.error('[auth] identity upsert failed — check DB connectivity', { code: 'AUTH_IDENTITY_UPSERT_ERR' })
```

---

_Reviewed: 2026-06-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
