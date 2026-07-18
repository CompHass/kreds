// @vitest-environment node

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'

process.env.DATABASE_URL ??= 'https://example.com'
process.env.AUTH_SECRET ??= 'test-auth-secret'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

let middleware: typeof import('../../src/middleware').middleware
let config: typeof import('../../src/middleware').config

beforeAll(async () => {
  // middleware imports are cached; isolate from other test files that may set
  // different env by loading fresh.
  vi.resetModules()
  ;({ middleware, config } = await import('../../src/middleware'))
})

// Helper to create mock NextRequest
function createMockRequest(
  pathname: string,
  url: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {}
): any {
  return {
    nextUrl: { pathname },
    url,
    cookies: {
      get: (name: string) => {
        const value = cookies[name]
        return value ? { value } : undefined
      },
    },
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  }
}

// Helper to create valid child JWT
async function createValidChildJWT(payload: {
  childProfileId: string
  familyId: string
  role: 'child'
}): Promise<string> {
  const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

// Helper to create expired child JWT
async function createExpiredChildJWT(payload: {
  childProfileId: string
  familyId: string
  role: 'child'
}): Promise<string> {
  const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('-1h') // Expired
    .sign(secret)
}

// Phase 13 — helper to create a valid guardian-session JWT
async function createValidGuardianJWT(payload: {
  familyId: string
  identityId: string
  role: 'guardian'
}): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.GUARDIAN_SESSION_SECRET ?? process.env.CHILD_SESSION_SECRET!,
  )
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(secret)
}

async function createExpiredGuardianJWT(payload: {
  familyId: string
  identityId: string
  role: 'guardian'
}): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.GUARDIAN_SESSION_SECRET ?? process.env.CHILD_SESSION_SECRET!,
  )
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('-1m')
    .sign(secret)
}

describe('src/middleware.ts', () => {
  describe('config.matcher', () => {
    it('should exclude _next/static, _next/image, favicon.ico, images, and sw.js', () => {
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
      const matcherStr = config.matcher[0]
      expect(matcherStr).toContain('_next/static')
      expect(matcherStr).toContain('_next/image')
      expect(matcherStr).toContain('favicon.ico')
      expect(matcherStr).toContain('png')
      expect(matcherStr).toContain('svg')
      expect(matcherStr).toMatch(/sw\\?\.js/i)
    })
  })

  describe('Test 1: /child/* without child-session cookie → redirect to /', () => {
    it('should redirect to / when no child-session cookie', async () => {
      const request = createMockRequest('/child/abc/dashboard', 'http://localhost:3000/child/abc/dashboard')
      const response = await middleware(request)
      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/')
    })
  })

  describe('Test 2: /child/* with valid child-session → pass through', () => {
    it('should allow request with valid child-session token', async () => {
      const token = await createValidChildJWT({
        childProfileId: 'child-123',
        familyId: 'fam-456',
        role: 'child',
      })
      const request = createMockRequest('/child/child-123/dashboard', 'http://localhost:3000/child/child-123/dashboard', {
        'child-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(200) // NextResponse.next() returns 200
    })
  })

  describe('Test 3: /child/* with expired JWT → redirect to / (no trust of unverified payload)', () => {
    it('should redirect to / when token is expired — CR-02: no decodeJwt on untrusted tokens', async () => {
      const token = await createExpiredChildJWT({
        childProfileId: 'child-123',
        familyId: 'fam-789',
        role: 'child',
      })
      const request = createMockRequest('/child/child-123/dashboard', 'http://localhost:3000/child/child-123/dashboard', {
        'child-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })
  })

  describe('Test 4: /child/* with malformed JWT → redirect to /', () => {
    it('should redirect to / when token is malformed (not JWT)', async () => {
      const request = createMockRequest('/child/abc/dashboard', 'http://localhost:3000/child/abc/dashboard', {
        'child-session': 'not-a-jwt-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 13: /family/* and /guardian/* NO LONGER grant access on next-auth
  // cookie presence alone. A short-lived guardian-session JWT (issued only
  // after the family PIN is entered) is required. The tests below were updated
  // because the old assertions encoded the vulnerability this phase fixes:
  // on a shared device the guardian's next-auth cookie is always present, so
  // "presence => 200" let any child reach the management panel via direct URL.
  // ─────────────────────────────────────────────────────────────────────────

  describe('Test 5: /family/* without guardian-session → redirect to /family/access/{id} (no longer /api/auth/signin)', () => {
    it('redirects to the profile picker when there is no guardian-session cookie', async () => {
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })
  })

  describe('Test 6 (Phase 13): /family/* with NextAuth cookie but NO guardian-session → redirect (the security fix)', () => {
    it('does NOT pass through on next-auth cookie alone — the old privilege-escalation vector', async () => {
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })

    it('also rejects when __Secure- next-auth cookie is present but no guardian-session (HTTPS)', async () => {
      const request = createMockRequest('/family/fam-1/tasks', 'https://localhost:3000/family/fam-1/tasks', {
        '__Secure-authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })
  })

  describe('Test 7: /guardian/* without guardian-session → redirect to /family/access/', () => {
    it('redirects (no familyId extractable from /guardian/* path)', async () => {
      const request = createMockRequest('/guardian/child-123/balance', 'http://localhost:3000/guardian/child-123/balance')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/')
    })
  })

  describe('Test 8 (Phase 13): /guardian/* with NextAuth cookie but NO guardian-session → redirect', () => {
    it('does NOT pass through on next-auth cookie alone', async () => {
      const request = createMockRequest('/guardian/child-123/balance', 'http://localhost:3000/guardian/child-123/balance', {
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/')
    })
  })

  describe('Test 9: / (public route) without cookies → pass through', () => {
    it('should allow public root path', async () => {
      const request = createMockRequest('/', 'http://localhost:3000/')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Test 10: /family/access/abc123 (public route) without cookies → pass through', () => {
    it('should allow public /family/access/* path', async () => {
      const request = createMockRequest('/family/access/abc123', 'http://localhost:3000/family/access/abc123')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Test 11: /api/auth/callback (public route) without cookies → pass through', () => {
    it('should allow public /api/auth/* path', async () => {
      const request = createMockRequest('/api/auth/callback', 'http://localhost:3000/api/auth/callback')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Test 12: /api/child/abc/tasks (public API route) without cookies → pass through', () => {
    it('should allow public /api/child/* path', async () => {
      const request = createMockRequest('/api/child/abc/tasks', 'http://localhost:3000/api/child/abc/tasks')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Test 13: /family/* with valid child-session (role=child) AND valid next-auth cookie → redirect to /family/access/{familyId}', () => {
    it('should redirect to /family/access/{familyId} even when next-auth cookie is also present', async () => {
      const token = await createValidChildJWT({
        childProfileId: 'child-123',
        familyId: 'fam-456',
        role: 'child',
      })
      const request = createMockRequest('/family/fam-456/tasks', 'http://localhost:3000/family/fam-456/tasks', {
        'child-session': token,
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-456')
    })
  })

  describe('Test 14: /guardian/* with valid child-session (role=child) AND valid next-auth cookie → redirect to /family/access/{familyId}', () => {
    it('should redirect to /family/access/{familyId} even when next-auth cookie is also present', async () => {
      const token = await createValidChildJWT({
        childProfileId: 'child-123',
        familyId: 'fam-456',
        role: 'child',
      })
      const request = createMockRequest('/guardian/child-123/balance', 'http://localhost:3000/guardian/child-123/balance', {
        'child-session': token,
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-456')
    })
  })

  describe('Test 15: /family/* with valid child-session (role=child) and NO next-auth cookie → redirect to /family/access/{familyId}', () => {
    it('child-session precedence holds even without a next-auth cookie', async () => {
      const token = await createValidChildJWT({
        childProfileId: 'child-123',
        familyId: 'fam-789',
        role: 'child',
      })
      const request = createMockRequest('/family/fam-789/tasks', 'http://localhost:3000/family/fam-789/tasks', {
        'child-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-789')
    })
  })

  describe('Test 16 (Phase 13): /family/* with EXPIRED child-session but valid next-auth cookie → redirect to access page (no longer falls through)', () => {
    it('an expired child-session is not trusted; with no guardian-session the request is redirected', async () => {
      const token = await createExpiredChildJWT({
        childProfileId: 'child-123',
        familyId: 'fam-456',
        role: 'child',
      })
      const request = createMockRequest('/family/fam-456/tasks', 'http://localhost:3000/family/fam-456/tasks', {
        'child-session': token,
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-456')
    })
  })

  describe('Test 17 (Phase 13): /family/* with MALFORMED child-session but valid next-auth cookie → redirect', () => {
    it('a malformed child-session is not trusted; with no guardian-session the request is redirected', async () => {
      const request = createMockRequest('/family/fam-456/tasks', 'http://localhost:3000/family/fam-456/tasks', {
        'child-session': 'not-a-jwt-token',
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-456')
    })
  })

  describe('Invalid child session role', () => {
    it('should reject token with role != "child"', async () => {
      const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
      const token = await new SignJWT({
        childProfileId: 'child-123',
        familyId: 'fam-456',
        role: 'guardian', // Wrong role!
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(secret)

      const request = createMockRequest('/child/child-123/dashboard', 'http://localhost:3000/child/child-123/dashboard', {
        'child-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-456')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 13 — guardian-session gate. These are the core security assertions:
  // the management panel is reachable ONLY with a valid, family-scoped,
  // non-expired guardian-session JWT — never on next-auth presence alone.
  // ─────────────────────────────────────────────────────────────────────────

  describe('Phase 13: guardian-session gate on /family/*', () => {
    it('passes through with a valid guardian-session whose familyId matches the URL', async () => {
      const token = await createValidGuardianJWT({
        familyId: 'fam-1',
        identityId: 'id-1',
        role: 'guardian',
      })
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'guardian-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })

    it('rejects a guardian-session issued for a DIFFERENT family (scope check)', async () => {
      const token = await createValidGuardianJWT({
        familyId: 'fam-A',
        identityId: 'id-1',
        role: 'guardian',
      })
      const request = createMockRequest('/family/fam-B/tasks', 'http://localhost:3000/family/fam-B/tasks', {
        'guardian-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-B')
    })

    it('rejects an expired guardian-session (forces PIN re-entry)', async () => {
      const token = await createExpiredGuardianJWT({
        familyId: 'fam-1',
        identityId: 'id-1',
        role: 'guardian',
      })
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'guardian-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })

    it('rejects a malformed guardian-session token', async () => {
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'guardian-session': 'not-a-jwt',
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })

    it('rejects a guardian-session whose role is not "guardian"', async () => {
      const secret = new TextEncoder().encode(
        process.env.GUARDIAN_SESSION_SECRET ?? process.env.CHILD_SESSION_SECRET!,
      )
      const token = await new SignJWT({
        familyId: 'fam-1',
        identityId: 'id-1',
        role: 'child', // Wrong role
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(secret)
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'guardian-session': token,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })

    it('child-session precedence still wins over a valid guardian-session (no privilege escalation)', async () => {
      const childToken = await createValidChildJWT({
        childProfileId: 'child-1',
        familyId: 'fam-1',
        role: 'child',
      })
      const guardianToken = await createValidGuardianJWT({
        familyId: 'fam-1',
        identityId: 'id-1',
        role: 'guardian',
      })
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'child-session': childToken,
        'guardian-session': guardianToken,
      })
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/family/access/fam-1')
    })

    it('guardian step-up routes (guardian-login / guardian-setup) are public pass-through', async () => {
      const r1 = await middleware(
        createMockRequest('/family/fam-1/guardian-login', 'http://localhost:3000/family/fam-1/guardian-login'),
      )
      expect(r1.status).toBe(200)

      const r2 = await middleware(
        createMockRequest('/family/fam-1/guardian-setup', 'http://localhost:3000/family/fam-1/guardian-setup'),
      )
      expect(r2.status).toBe(200)
    })

    it('falls back to GUARDIAN_SESSION_SECRET when set (separate from CHILD_SESSION_SECRET)', async () => {
      // Token signed with GUARDIAN_SESSION_SECRET must verify in middleware,
      // which falls back to CHILD only when GUARDIAN is unset.
      const guardianSecret = 'g-secret-0123456789abcdef0123456789abcdef'
      process.env.GUARDIAN_SESSION_SECRET = guardianSecret
      vi.resetModules()
      const { middleware: mwFresh } = await import('../../src/middleware')
      const secret = new TextEncoder().encode(guardianSecret)
      const token = await new SignJWT({ familyId: 'fam-1', identityId: 'id-1', role: 'guardian' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(secret)
      const request = createMockRequest('/family/fam-1/tasks', 'http://localhost:3000/family/fam-1/tasks', {
        'guardian-session': token,
      })
      const response = await mwFresh(request)
      expect(response.status).toBe(200)
      // restore
      delete process.env.GUARDIAN_SESSION_SECRET
      vi.resetModules()
      ;({ middleware } = await import('../../src/middleware'))
    })
  })
})
