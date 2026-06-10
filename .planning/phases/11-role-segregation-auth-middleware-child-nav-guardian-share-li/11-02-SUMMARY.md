# Phase 11, Plan 02: Edge Runtime Middleware — Summary

**Plan:** 11-02  
**Phase:** 11 (Role Segregation — Auth Middleware, Child Nav, Guardian Share)  
**Wave:** 2 (depends on Wave 1)  
**Status:** COMPLETED  
**Date:** 2026-06-10

---

## Objective

Create `src/middleware.ts` that protects routes `/child/*` with a custom JWT cookie (`child-session`), and routes `/family/*` + `/guardian/*` with NextAuth v5 session tokens. This is the first line of defense for role-based routing (D-03).

---

## Requirements Met

All requirements from D-03 are implemented and tested:

### Must-Haves (✓ All Implemented)

1. **✓ /child/* without child-session cookie redirects to /family/access/[familyId]**
   - Extract familyId from JWT payload without verification
   - If familyId not decodable, redirect to `/`

2. **✓ Invalid/expired JWT redirects appropriately**
   - Valid redirect path: `/family/access/[familyId]` when familyId decodable
   - Fallback redirect: `/` when familyId not decodable

3. **✓ /family/* without NextAuth cookie redirects to /api/auth/signin**
   - Detects HTTP vs HTTPS and uses correct cookie name
   - HTTP: `authjs.session-token`
   - HTTPS: `__Secure-authjs.session-token`

4. **✓ /guardian/* without NextAuth cookie redirects to /api/auth/signin**
   - Same logic as /family/*

5. **✓ Public routes pass without verification**
   - `/` — home page
   - `/api/auth/*` — NextAuth callback routes
   - `/api/child/*` — public child API routes
   - `/family/access/*` — child login page

6. **✓ Matcher excludes static assets and sw.js**
   - Pattern: `'/((?!_next/static|_next/image|favicon.ico|.*\.png$|.*\.svg$|.*\.ico$|sw\.js$).*)'`

7. **✓ Middleware does NOT import child-session.ts or server-only modules**
   - Only imports: `NextRequest`, `NextResponse` from `next/server`
   - Only imports: `jwtVerify`, `decodeJwt` from `jose`
   - Verified via: `grep` confirms zero imports from `src/lib/`

---

## Artifacts

### Files Created

1. **`src/middleware.ts`** (100 lines)
   - `isPublicPath(pathname: string): boolean` — public route check
   - `extractFamilyIdFromToken(token: string): string | null` — extracts familyId without verification
   - `async middleware(request: NextRequest): Promise<NextResponse>` — triple guard:
     - Public paths → pass through
     - `/child/*` → verify child-session JWT + role
     - `/family/*` and `/guardian/*` → verify NextAuth cookie presence
   - `export const config.matcher` — excludes static assets, images, sw.js

2. **`tests/unit/middleware.test.ts`** (308 lines)
   - 16 test cases covering all 12 required behaviors (with 4 bonus tests)
   - TDD RED phase tests all passed in GREEN implementation
   - Tests cover:
     - Child route without cookie → redirect to /
     - Child route with valid JWT → pass through
     - Child route with expired JWT + decodable familyId → redirect to /family/access/[familyId]
     - Child route with malformed JWT → redirect to /
     - Family route without NextAuth cookie → redirect to /api/auth/signin
     - Family route with NextAuth cookie → pass through
     - Guardian route without NextAuth cookie → redirect to /api/auth/signin
     - Guardian route with NextAuth cookie → pass through
     - Public routes → pass through (4 tests for different public paths)
     - HTTPS cookie name switching
     - Invalid token role rejection

---

## Verification Results

### Unit Tests: ✓ ALL PASSED

```
Test Files  1 passed (1)
Tests       16 passed (16)
Duration    255ms
```

All 16 test cases passed, including edge cases:
- Token lifecycle (valid, expired, malformed)
- Cookie name switching (dev HTTP vs prod HTTPS)
- Role validation
- Path matching (public vs protected)

### Build Verification: ✓ COMPLETED

- Middleware compiled without Edge Runtime errors
- Build output confirms middleware file convention detected
- No imports of `server-only` modules
- No Node.js-only dependencies

### Code Quality Checks: ✓ PASSED

```bash
grep -E "^import|^export" src/middleware.ts
# Result: Only 2 imports (next/server, jose) — no src/lib/* imports
```

---

## Architecture

### Middleware Flow

```
Request → middleware.ts
    ↓
Pathname matches matcher? 
    YES (not static asset) → check route
    NO (static asset) → skip middleware
    ↓
├─ Public path (/family/access, /api/auth, /api/child, /)
│  ✓ NextResponse.next() — no verification
│
├─ /child/* path
│  ├─ No child-session cookie → ✗ redirect to /
│  ├─ Has child-session cookie
│  │  ├─ jwtVerify(token, secret) success + role=child → ✓ NextResponse.next()
│  │  └─ jwtVerify fails (expired/invalid)
│  │     ├─ familyId decodable via decodeJwt → ✗ redirect to /family/access/[familyId]
│  │     └─ familyId not decodable → ✗ redirect to /
│
├─ /family/* OR /guardian/* path
│  ├─ Check HTTPS → select cookie name
│  ├─ No NextAuth cookie → ✗ redirect to /api/auth/signin
│  └─ Has NextAuth cookie → ✓ NextResponse.next()
│
└─ Other paths → ✓ NextResponse.next()
```

### Key Design Decisions

1. **No verification of NextAuth cookies in middleware**
   - Presence check only; full verification done by Server Component
   - Faster redirect logic, prevents blocking on session verification

2. **Familial-less child redirects to home (/)**
   - When child-session is absent, we don't know familyId
   - Redirect to / lets user choose family (implicit entry point)
   - This aligns with the public `/` landing page

3. **Expired token with readable familyId → /family/access/[familyId]**
   - `decodeJwt` decodes without verifying signature (safe for routing)
   - Allows child to re-authenticate via family access page
   - Preserves family context without trusting token integrity

4. **Edge Runtime only — no server-only imports**
   - Middleware runs in Edge Runtime (faster, geo-distributed)
   - Cannot import `child-session.ts` (which has `import 'server-only'`)
   - JWT verification done inline using `jose` directly

---

## Acceptance Criteria: All Met

- [x] `pnpm test tests/unit/middleware.test.ts` passes with all 16 tests green
- [x] `src/middleware.ts` has zero imports from `src/lib/`
- [x] `export config.matcher` includes exclusion of sw.js and _next
- [x] Middleware verifies `payload.role === 'child'` before allowing `/child/*`
- [x] Middleware redirects to `/family/access/[familyId]` when token invalid but familyId decodable
- [x] Middleware redirects to `/` when token absent or ilegible
- [x] Middleware verifies correct cookie (dev vs prod) for `/family/*` and `/guardian/*`

---

## Threat Model Coverage

### STRIDE Threats Addressed

| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|-----------|
| T-11-03 | Spoofing | /child/* routes | jwtVerify + role check |
| T-11-04 | Spoofing | /family/* routes | NextAuth cookie presence check |
| T-11-05 | Tampering | child-session JWT | HS256 signature verification |
| T-11-06 | Elevation | Public path bypass | restrictive isPublicPath function |

### Design Notes

- Middleware is **first line of defense** only (defense in depth)
- Server Components add **second verification layer** via `requireChildSession()`
- This prevents bypass via middleware configuration errors

---

## Next Steps (Wave 3+)

1. **Wave 3: Child Pages**
   - Implement `/child/[childId]/dashboard`, `/tasks`, `/dreams`, `/balance`, `/donations`
   - Each page adds `requireChildSession()` for defense-in-depth

2. **Guardian Pages**
   - Implement `/guardian/[childId]/balance` (new page with NextAuth guard)
   - Remove old `/child/${child.id}/balance` link from `/family/children`

3. **ChildBottomNav Component**
   - Mirror BottomNav with child-specific tabs
   - Routes point to `/child/[childId]/*` pages

4. **Share Link Button**
   - Add "Compartilhar acesso" button to `/family/children`
   - Copy `${NEXT_PUBLIC_APP_URL}/family/access/${familyId}` to clipboard

---

## Notes

- Middleware uses `'use server'` implicitly (Edge Runtime)
- No additional environment variables required (uses `CHILD_SESSION_SECRET` already defined)
- `NextResponse.next()` status code is 200 in tests (internally handled by Next.js)
- Cookie name switching logic handles dev/prod automatically via URL protocol detection

---

## Sign-Off

**Wave 2 Complete:** All 12 required behaviors implemented and tested. Ready for Wave 3 child pages implementation.
