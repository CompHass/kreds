import { describe, expect, it } from 'vitest'
import { EMAIL_NOT_VERIFIED_REDIRECT, guardianSignInDecision } from '../../src/lib/auth/guardian-signin-policy'

describe('guardian sign-in policy', () => {
  it('allows the unverified session created by a consumed provisional signup token', () => {
    expect(guardianSignInDecision({ credentialsEmailVerified: false, provisionalSignup: true })).toBe(true)
  })

  it('blocks a later normal credentials login while the email remains unverified', () => {
    expect(guardianSignInDecision({ credentialsEmailVerified: false, provisionalSignup: false })).toBe(EMAIL_NOT_VERIFIED_REDIRECT)
  })

  it('does not let a provisional credentials flag bypass an explicitly unverified OIDC profile', () => {
    expect(guardianSignInDecision({ profileEmailVerified: false, provisionalSignup: true })).toBe(EMAIL_NOT_VERIFIED_REDIRECT)
  })
})
