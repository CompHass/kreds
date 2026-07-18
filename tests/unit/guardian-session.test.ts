// @vitest-environment node

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

process.env.DATABASE_URL ??= 'https://example.com'
process.env.AUTH_SECRET ??= 'test-auth-secret'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

let signGuardianSession: typeof import('../../src/lib/families/guardian-session').signGuardianSession
let verifyGuardianSession: typeof import('../../src/lib/families/guardian-session').verifyGuardianSession
let checkGuardianBruteForce: typeof import('../../src/lib/families/guardian-session').checkGuardianBruteForce
let recordGuardianFailedAttempt: typeof import('../../src/lib/families/guardian-session').recordGuardianFailedAttempt
let resetGuardianAttempts: typeof import('../../src/lib/families/guardian-session').resetGuardianAttempts

beforeAll(async () => {
  ;({
    signGuardianSession,
    verifyGuardianSession,
    checkGuardianBruteForce,
    recordGuardianFailedAttempt,
    resetGuardianAttempts,
  } = await import('../../src/lib/families/guardian-session'))
})

describe('guardian-session JWT', () => {
  const payload = {
    familyId: 'fam-1',
    identityId: 'id-1',
    role: 'guardian' as const,
  }

  it('round-trips a signed token through verify', async () => {
    const token = await signGuardianSession(payload)
    const decoded = await verifyGuardianSession(token)
    expect(decoded).toEqual(payload)
  })

  it('rejects a token signed with a different secret', async () => {
    // Sign with the guardian secret, then flip the env and try to verify —
    // the verification must fail because the secret changed.
    const token = await signGuardianSession(payload)
    const original = process.env.GUARDIAN_SESSION_SECRET
    process.env.GUARDIAN_SESSION_SECRET = 'different-secret-32-chars-long-aaa'
    vi.resetModules()
    const { verifyGuardianSession: verifyFresh } = await import('../../src/lib/families/guardian-session')
    await expect(verifyFresh(token)).rejects.toThrow()
    process.env.GUARDIAN_SESSION_SECRET = original
    vi.resetModules()
    ;({ verifyGuardianSession } = await import('../../src/lib/families/guardian-session'))
  })

  it('rejects a malformed token', async () => {
    await expect(verifyGuardianSession('not-a-jwt')).rejects.toThrow()
  })

  it('falls back to CHILD_SESSION_SECRET when GUARDIAN_SESSION_SECRET is unset', async () => {
    // The helper deliberately falls back to CHILD secret so local dev without
    // the new env var still works. Token signed under that fallback must verify.
    delete process.env.GUARDIAN_SESSION_SECRET
    vi.resetModules()
    const { signGuardianSession: signFresh, verifyGuardianSession: verifyFresh } = await import(
      '../../src/lib/families/guardian-session'
    )
    const token = await signFresh(payload)
    await expect(verifyFresh(token)).resolves.toEqual(payload)
  })
})

describe('guardian brute-force protection (keyed by family)', () => {
  beforeEach(() => {
    // The module keeps an in-process Map; reset between cases.
    resetGuardianAttempts('fam-bf')
  })

  it('is not blocked initially', () => {
    expect(checkGuardianBruteForce('fam-bf').blocked).toBe(false)
  })

  it('blocks after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) recordGuardianFailedAttempt('fam-bf')
    expect(checkGuardianBruteForce('fam-bf').blocked).toBe(true)
  })

  it('counts attempts left correctly', () => {
    recordGuardianFailedAttempt('fam-bf')
    expect(checkGuardianBruteForce('fam-bf').attemptsLeft).toBe(4)
  })

  it('is keyed per-family (family A blocking does not block family B)', () => {
    for (let i = 0; i < 5; i++) recordGuardianFailedAttempt('fam-A')
    expect(checkGuardianBruteForce('fam-A').blocked).toBe(true)
    expect(checkGuardianBruteForce('fam-B').blocked).toBe(false)
  })

  it('resets on demand', () => {
    for (let i = 0; i < 5; i++) recordGuardianFailedAttempt('fam-bf')
    resetGuardianAttempts('fam-bf')
    expect(checkGuardianBruteForce('fam-bf').blocked).toBe(false)
  })
})
