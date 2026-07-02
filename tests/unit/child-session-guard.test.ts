// @vitest-environment node

import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

process.env.DATABASE_URL ??= 'https://example.com'
process.env.AUTH_SECRET ??= 'test-auth-secret'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

let validateChildSessionScope: typeof import('../../src/lib/auth/child-guard').validateChildSessionScope
let extractChildProfileId: typeof import('../../src/lib/auth/child-guard').extractChildProfileId
let extractFamilyId: typeof import('../../src/lib/auth/child-guard').extractFamilyId

beforeAll(async () => {
  ;({
    validateChildSessionScope,
    extractChildProfileId,
    extractFamilyId,
  } = await import('../../src/lib/auth/child-guard'))
})

describe('child session guard helpers', () => {
  const childSession = {
    childProfileId: 'c-1',
    familyId: 'f-1',
    role: 'child' as const,
  }

  it('returns true when session matches child scope', () => {
    expect(validateChildSessionScope(childSession, 'c-1')).toBe(true)
  })

  it('returns false when session child profile differs', () => {
    expect(validateChildSessionScope(childSession, 'c-2')).toBe(false)
  })

  it('returns false without a session', () => {
    expect(validateChildSessionScope(null, 'c-1')).toBe(false)
  })

  it('extracts child profile id', () => {
    expect(extractChildProfileId(childSession)).toBe('c-1')
  })

  it('extracts family id', () => {
    expect(extractFamilyId(childSession)).toBe('f-1')
  })

  it('returns false when role is not child', () => {
    expect(
      validateChildSessionScope(
        { childProfileId: 'c-1', familyId: 'f-1', role: 'child' } as const,
        'c-2',
      ),
    ).toBe(false)

    expect(
      validateChildSessionScope(
        { childProfileId: 'c-1', familyId: 'f-1', role: 'guardian' as 'child' },
        'c-1',
      ),
    ).toBe(false)
  })
})

describe('D-15 deactivation boundary — guard is intentionally unchanged', () => {
  it('a child session issued before deactivation still passes the guard', () => {
    // D-15: deactivation does NOT revoke a live JWT; child-guard.ts intentionally
    // never checks `active` (accepted risk, CONTEXT.md line 129). The guard
    // receives no `active` flag by design — this is the same
    // { childProfileId, familyId, role: 'child' } payload the JWT carries for
    // an ALREADY-DEACTIVATED child, proving the pre-existing session still
    // passes scope validation until the JWT naturally expires (8h).
    const deactivatedChildSession = {
      childProfileId: 'c-1',
      familyId: 'f-1',
      role: 'child' as const,
    }

    expect(
      validateChildSessionScope(deactivatedChildSession, deactivatedChildSession.childProfileId),
    ).toBe(true)
  })

  it('the guard exposes no surface that would block a deactivated child\'s live session', () => {
    // New-login rejection for `active=false` lives in the DB query of
    // `verifyChildPin` (src/app/actions/child-auth.ts), NOT in the guard —
    // out of scope per D-11/D-15. validateChildSessionScope takes only
    // (session, requestedChildId) — arity 2 — with no third `active`/DB
    // parameter through which deactivation could reach the live session.
    expect(validateChildSessionScope.length).toBe(2)
  })
})
