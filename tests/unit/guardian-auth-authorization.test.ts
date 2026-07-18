// @vitest-environment node

// Phase 13 — tests the deep-authorization layer of guardian-pin actions.
// These are the tests that prove the fix for the privilege-escalation vector:
// a logged-in guardian of family A must NOT be able to unlock family B's panel,
// and an unauthenticated caller must be rejected outright.
//
// We mock @/lib/auth/guardian-membership (the action's actual dependency) rather
// than @/lib/db's select chains, because resolveGuardianMembership's two-step
// query is fiddly to fake and that's not what we're testing here. We assert the
// ACTION's contract: it gates on the membership result and the auth() subject,
// and issues/revokes the guardian-session cookie accordingly.

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPin } from '../../src/lib/families/child-pin'

vi.mock('server-only', () => ({}))

// Single hoisted state object so every vi.mock factory (hoisted above imports)
// closes over real bindings, not TDZ references.
const { state } = vi.hoisted(() => ({
  state: {
    currentSubject: undefined as string | undefined,
    membershipFor: ((_f: string) => null) as (
      familyId: string,
    ) => { familyId: string; identityId: string } | null,
    guardianPinHash: null as string | null,
    updateOk: true as boolean,
    cookieStore: {} as Record<string, string>,
  },
}))

// next-auth's env.js imports next/server, which isn't resolvable in the node
// test environment. Stub next-auth so the real auth.ts loads cleanly, and route
// its `auth()` export through our hoisted state so tests control the session.
// auth.ts does `export const { auth, ... } = NextAuth({...})`, so the default
// export's returned object must expose an `auth` function.
vi.mock('next-auth', () => ({
  default: () => ({
    auth: async () =>
      state.currentSubject ? { user: { id: state.currentSubject, name: 'Guardian' } } : null,
    handlers: { GET: () => {}, POST: () => {} },
    signIn: () => {},
    signOut: () => {},
  }),
  CredentialsSignin: class {},
}))
vi.mock('next-auth/providers/credentials', () => ({ default: () => ({}) }))
vi.mock('next-auth/providers/zitadel', () => ({ default: () => ({}) }))

// Stub the rest of auth.ts's transitive imports so it loads cleanly in the test
// env. We only care that `auth` is exported and routed to our state; the real
// implementations of these modules are not exercised by these tests.
vi.mock('@/lib/env', () => ({ env: {} }))
vi.mock('@/lib/auth/guardian-sync', () => ({ syncGuardianIdentity: () => {} }))
vi.mock('@/lib/auth/provisional-signup', () => ({ consumeProvisionalSignupToken: () => null }))
vi.mock('@/lib/auth/guardian-signin-policy', () => ({ guardianSignInDecision: () => null }))
vi.mock('@/lib/zitadel/login-client', () => ({
  createGuardianSession: () => ({}),
  extractSystemRoles: () => [],
  getGuardianGrants: () => [],
  getGuardianUser: () => null,
  ZitadelApiError: class {},
}))

vi.mock('@/lib/auth/guardian-membership', () => ({
  resolveGuardianMembership: vi.fn(async (_sub: string | undefined, familyId: string) =>
    state.membershipFor(familyId),
  ),
}))

// Minimal db mock for the PIN select (verifyGuardianPin) and update
// (setGuardianPin). resolveGuardianMembership is mocked above, so these are the
// only db surfaces the action reaches.
vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () =>
            state.guardianPinHash ? [{ guardianPinHash: state.guardianPinHash }] : [],
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => (state.updateOk ? [{ id: 'fam-A' }] : []),
        }),
      }),
    }),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: (name: string, value: string) => {
      state.cookieStore[name] = value
    },
    delete: (name: string) => {
      delete state.cookieStore[name]
    },
  })),
}))

process.env.DATABASE_URL ??= 'https://example.com'
process.env.AUTH_SECRET ??= 'test-auth-secret'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.GUARDIAN_SESSION_SECRET ??= 'guard-secret-0123456789abcdef0123456789'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

let verifyGuardianPin: typeof import('../../src/app/actions/guardian-pin').verifyGuardianPin
let setGuardianPin: typeof import('../../src/app/actions/guardian-pin').setGuardianPin
let exitGuardianSession: typeof import('../../src/app/actions/guardian-pin').exitGuardianSession

beforeAll(async () => {
  ;({ verifyGuardianPin, setGuardianPin, exitGuardianSession } = await import(
    '../../src/app/actions/guardian-pin'
  ))
})

beforeEach(() => {
  state.currentSubject = undefined
  state.membershipFor = () => null
  state.guardianPinHash = null
  state.updateOk = true
  Object.keys(state.cookieStore).forEach((k) => delete state.cookieStore[k])
})

describe('verifyGuardianPin — membership authorization', () => {
  it('rejects an unauthenticated caller with "unauthorized"', async () => {
    const result = await verifyGuardianPin('fam-1', '1234')
    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('rejects a logged-in guardian who is NOT a member of the family', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = (famId) =>
      famId === 'fam-A' ? { familyId: 'fam-A', identityId: 'id-A' } : null
    // Request targets a different family — resolver returns null for fam-B.
    const result = await verifyGuardianPin('fam-B', '1234')
    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('rejects an invalid PIN format before any sensitive check', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    const result = await verifyGuardianPin('fam-A', 'abc')
    expect(result).toEqual({ error: 'invalid' })
  })

  it('returns "no-pin" when the family has not set up a guardian PIN yet', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    state.guardianPinHash = null // no PIN configured
    const result = await verifyGuardianPin('fam-A', '1234')
    expect(result).toEqual({ error: 'no-pin' })
  })

  it('issues a guardian-session cookie on correct PIN (bcrypt end-to-end)', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    state.guardianPinHash = await hashPin('1234')
    const result = await verifyGuardianPin('fam-A', '1234')
    expect(result).toEqual({ success: true })
    expect(state.cookieStore['guardian-session']).toBeTruthy()
  })

  it('rejects a wrong PIN and does not issue a cookie', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    state.guardianPinHash = await hashPin('1234')
    const result = await verifyGuardianPin('fam-A', '9999')
    expect(result).toEqual({ error: 'invalid' })
    expect(state.cookieStore['guardian-session']).toBeUndefined()
  })
})

describe('setGuardianPin — membership authorization', () => {
  it('rejects an unauthenticated caller with "unauthorized"', async () => {
    const result = await setGuardianPin('fam-1', '1234', '1234')
    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('rejects a guardian of a different family', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = (famId) =>
      famId === 'fam-A' ? { familyId: 'fam-A', identityId: 'id-A' } : null
    const result = await setGuardianPin('fam-B', '1234', '1234')
    expect(result).toEqual({ error: 'unauthorized' })
  })

  it('rejects mismatched PIN/confirmPIN', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    const result = await setGuardianPin('fam-A', '1234', '5678')
    expect(result).toEqual({ error: 'mismatch' })
  })

  it('rejects an invalid PIN format even when membership is valid', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    const result = await setGuardianPin('fam-A', '12', '12')
    expect(result).toEqual({ error: 'invalid' })
  })

  it('issues a guardian-session cookie when a valid guardian sets a valid PIN', async () => {
    state.currentSubject = 'sub-A'
    state.membershipFor = () => ({ familyId: 'fam-A', identityId: 'id-A' })
    const result = await setGuardianPin('fam-A', '1234', '1234')
    expect(result).toEqual({ success: true })
    expect(state.cookieStore['guardian-session']).toBeTruthy()
  })
})

describe('exitGuardianSession', () => {
  it('clears the guardian-session cookie', async () => {
    state.cookieStore['guardian-session'] = 'some-token'
    await exitGuardianSession()
    expect(state.cookieStore['guardian-session']).toBeUndefined()
  })
})
