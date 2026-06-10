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
  ;({ middleware, config } = await import('../../src/middleware'))
})

// Helper to create mock NextRequest
function createMockRequest(pathname: string, url: string, cookies: Record<string, string> = {}): any {
  return {
    nextUrl: { pathname },
    url,
    cookies: {
      get: (name: string) => {
        const value = cookies[name]
        return value ? { value } : undefined
      },
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

  describe('Test 3: /child/* with expired JWT but decodable familyId → redirect to /family/access/[familyId]', () => {
    it('should redirect to /family/access/[familyId] when token expired but familyId present', async () => {
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
      expect(response.headers.get('location')).toContain('/family/access/fam-789')
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

  describe('Test 5: /family/* without NextAuth cookie (HTTP) → redirect to /api/auth/signin', () => {
    it('should redirect to /api/auth/signin when no authjs.session-token (HTTP dev)', async () => {
      const request = createMockRequest('/family/dashboard', 'http://localhost:3000/family/dashboard')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/api/auth/signin')
    })
  })

  describe('Test 6: /family/* with NextAuth cookie (HTTP) → pass through', () => {
    it('should allow request when authjs.session-token present (HTTP dev)', async () => {
      const request = createMockRequest('/family/dashboard', 'http://localhost:3000/family/dashboard', {
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Test 7: /guardian/* without NextAuth cookie (HTTP) → redirect to /api/auth/signin', () => {
    it('should redirect to /api/auth/signin when no authjs.session-token (HTTP dev)', async () => {
      const request = createMockRequest('/guardian/child-123/balance', 'http://localhost:3000/guardian/child-123/balance')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/api/auth/signin')
    })
  })

  describe('Test 8: /guardian/* with NextAuth cookie (HTTP) → pass through', () => {
    it('should allow request when authjs.session-token present (HTTP dev)', async () => {
      const request = createMockRequest('/guardian/child-123/balance', 'http://localhost:3000/guardian/child-123/balance', {
        'authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(200)
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

  describe('HTTPS cookie name switching', () => {
    it('should use __Secure-authjs.session-token for HTTPS /family/* requests', async () => {
      const request = createMockRequest('/family/dashboard', 'https://localhost:3000/family/dashboard', {
        '__Secure-authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })

    it('should use __Secure-authjs.session-token for HTTPS /guardian/* requests', async () => {
      const request = createMockRequest('/guardian/child-123/balance', 'https://localhost:3000/guardian/child-123/balance', {
        '__Secure-authjs.session-token': 'valid-nextauth-token',
      })
      const response = await middleware(request)
      expect(response.status).toBe(200)
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
})
