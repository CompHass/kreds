// @vitest-environment node

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

process.env.DATABASE_URL ??= 'https://example.com'
process.env.AUTH_SECRET ??= 'test-auth-secret'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

let checkBruteForce: typeof import('../../src/lib/families/child-session').checkBruteForce
let recordFailedAttempt: typeof import('../../src/lib/families/child-session').recordFailedAttempt
let resetAttempts: typeof import('../../src/lib/families/child-session').resetAttempts
let signChildSession: typeof import('../../src/lib/families/child-session').signChildSession
let verifyChildSession: typeof import('../../src/lib/families/child-session').verifyChildSession

beforeAll(async () => {
  ;({
    checkBruteForce,
    recordFailedAttempt,
    resetAttempts,
    signChildSession,
    verifyChildSession,
  } = await import('../../src/lib/families/child-session'))
})

beforeEach(() => {
  resetAttempts('child-1')
  resetAttempts('child-2')
})

describe('child auth endpoint helpers', () => {
  it('returns a JWT string when signing a child session', async () => {
    const token = await signChildSession({
      childProfileId: 'uuid-1',
      familyId: 'fam-1',
      role: 'child',
    })

    expect(token.startsWith('ey')).toBe(true)
  })

  it('verifies a generated child session token', async () => {
    const token = await signChildSession({
      childProfileId: 'uuid-1',
      familyId: 'fam-1',
      role: 'child',
    })

    await expect(verifyChildSession(token)).resolves.toEqual({
      childProfileId: 'uuid-1',
      familyId: 'fam-1',
      role: 'child',
    })
  })

  it('throws for an invalid child session token', async () => {
    await expect(verifyChildSession('token-invalido')).rejects.toThrow(Error)
  })

  it('starts with no brute-force block', () => {
    expect(checkBruteForce('child-1')).toEqual({ blocked: false, attemptsLeft: 5 })
  })

  it('blocks after five failed attempts', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordFailedAttempt('child-1')
    }

    expect(checkBruteForce('child-1')).toEqual({ blocked: true, attemptsLeft: 0 })
  })

  it('resets attempts after success', () => {
    recordFailedAttempt('child-1')
    resetAttempts('child-1')

    expect(checkBruteForce('child-1')).toEqual({ blocked: false, attemptsLeft: 5 })
  })

  it('isolates brute-force counters per child profile', () => {
    recordFailedAttempt('child-1')
    recordFailedAttempt('child-1')

    expect(checkBruteForce('child-2')).toEqual({ blocked: false, attemptsLeft: 5 })
  })
})
