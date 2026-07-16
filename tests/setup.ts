import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

process.env.IAM_LOGIN_CLIENT ??= JSON.stringify({
  type: 'serviceaccount',
  keyId: 'test-key',
  key: 'test-private-key',
  userId: 'test-user',
})
process.env.DATABASE_URL ??= 'postgresql://kreds:kreds@localhost:5432/kreds_dev'
process.env.AUTH_SECRET ??= 'test-auth-secret-32-chars-at-minimum!!'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'
process.env.PIN_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString('base64')

// Mock global de IntersectionObserver para jsdom (Pitfall 2 do RESEARCH.md)
globalThis.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(public callback: IntersectionObserverCallback) {}
} as unknown as typeof IntersectionObserver
