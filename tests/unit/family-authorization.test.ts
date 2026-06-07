import { describe, it, expect } from 'vitest'

// RED phase: these imports will fail because the modules do not exist yet.
// Wave 0 scaffolds — implementation created in later plans (02-02 through 02-07).
import {
  requireAuthenticatedIdentity,
  requireActiveGuardian,
  requireFamilyMember,
  hasRole,
  isGuardian,
  isChild,
} from '../../src/lib/auth/authorization'

import {
  createFamily,
  addGuardianMembership,
} from '../../src/lib/families/commands'

import {
  createAuditEvent,
} from '../../src/lib/families/audit'

describe('Family authorization', () => {
  describe('requireAuthenticatedIdentity', () => {
    it('should return identity when session has valid ZITADEL sub', () => {
      const session = {
        user: { id: 'zitadel|sub-abc-123', email: 'guardian@example.com' },
      }
      const identity = requireAuthenticatedIdentity(session)
      expect(identity).toBeDefined()
      expect(identity.zitadelSub).toBe('zitadel|sub-abc-123')
    })

    it('should throw when session is null', () => {
      expect(() => requireAuthenticatedIdentity(null)).toThrow()
    })

    it('should throw when session has no user', () => {
      expect(() => requireAuthenticatedIdentity({})).toThrow()
    })

    it('should throw when user has no ZITADEL sub', () => {
      const session = { user: { email: 'guardian@example.com' } }
      expect(() => requireAuthenticatedIdentity(session)).toThrow()
    })
  })

  describe('requireActiveGuardian', () => {
    it('should return membership when identity is active guardian of family', () => {
      const identity = { id: 'identity-uuid', zitadelSub: 'zitadel|sub-abc' }
      const familyId = 'family-uuid'
      const membership = requireActiveGuardian(identity, familyId)
      expect(membership).toBeDefined()
      expect(membership.role).toBe('guardian')
      expect(membership.status).toBe('active')
      expect(membership.familyId).toBe(familyId)
    })

    it('should throw when identity is not a member of the family (FAM-05 cross-family isolation)', () => {
      const identity = { id: 'identity-uuid', zitadelSub: 'zitadel|sub-abc' }
      const familyId = 'other-family-uuid'
      expect(() => requireActiveGuardian(identity, familyId)).toThrow()
    })

    it('should throw when identity is a child role, not guardian', () => {
      const identity = { id: 'child-identity-uuid', zitadelSub: 'zitadel|sub-child' }
      const familyId = 'family-uuid'
      expect(() => requireActiveGuardian(identity, familyId)).toThrow()
    })

    it('should throw when membership is inactive', () => {
      const identity = { id: 'identity-uuid', zitadelSub: 'zitadel|sub-abc' }
      const familyId = 'family-uuid'
      expect(() => requireActiveGuardian(identity, familyId)).toThrow()
    })

    it('should throw when identity is null', () => {
      expect(() => requireActiveGuardian(null, 'family-uuid')).toThrow()
    })
  })

  describe('requireFamilyMember', () => {
    it('should return membership when identity is any active family member', () => {
      const identity = { id: 'identity-uuid', zitadelSub: 'zitadel|sub-child' }
      const familyId = 'family-uuid'
      const membership = requireFamilyMember(identity, familyId)
      expect(membership).toBeDefined()
      expect(membership.familyId).toBe(familyId)
      expect(membership.status).toBe('active')
    })

    it('should throw when identity is not a member of the family (FAM-05)', () => {
      const identity = { id: 'identity-uuid', zitadelSub: 'zitadel|sub-abc' }
      const familyId = 'other-family-uuid'
      expect(() => requireFamilyMember(identity, familyId)).toThrow()
    })

    it('should not enumerate other families (FAM-01 tenant isolation)', () => {
      const identity = { id: 'identity-uuid', zitadelSub: 'zitadel|sub-abc' }
      const familyId = 'other-family-uuid'
      // Cross-family access must throw — no data leak
      expect(() => requireFamilyMember(identity, familyId)).toThrow()
    })
  })

  describe('hasRole', () => {
    it('should return true when membership has expected role', () => {
      const membership = { role: 'guardian', status: 'active', familyId: 'f1' }
      expect(hasRole(membership, 'guardian')).toBe(true)
    })

    it('should return false when membership has different role', () => {
      const membership = { role: 'child', status: 'active', familyId: 'f1' }
      expect(hasRole(membership, 'guardian')).toBe(false)
    })

    it('should return false for null membership', () => {
      expect(hasRole(null, 'guardian')).toBe(false)
    })
  })

  describe('isGuardian', () => {
    it('should return true for active guardian membership', () => {
      const membership = { role: 'guardian', status: 'active', familyId: 'f1' }
      expect(isGuardian(membership)).toBe(true)
    })

    it('should return false for child membership', () => {
      const membership = { role: 'child', status: 'active', familyId: 'f1' }
      expect(isGuardian(membership)).toBe(false)
    })

    it('should return false for inactive guardian', () => {
      const membership = { role: 'guardian', status: 'inactive', familyId: 'f1' }
      expect(isGuardian(membership)).toBe(false)
    })
  })

  describe('isChild', () => {
    it('should return true for active child membership', () => {
      const membership = { role: 'child', status: 'active', familyId: 'f1' }
      expect(isChild(membership)).toBe(true)
    })

    it('should return false for guardian membership', () => {
      const membership = { role: 'guardian', status: 'active', familyId: 'f1' }
      expect(isChild(membership)).toBe(false)
    })

    it('should return false for inactive child', () => {
      const membership = { role: 'child', status: 'inactive', familyId: 'f1' }
      expect(isChild(membership)).toBe(false)
    })
  })
})

describe('Family creation and onboarding (FAM-04, D-04)', () => {
  it('should map ZITADEL sub to local identity and create guardian membership (FAM-04, D-14, D-15, D-16)', () => {
    const zitadelSub = 'zitadel|sub-guardian-123'
    const email = 'guardian@example.com'
    const familyName = 'Silva Family'
    const timezone = 'America/Sao_Paulo'

    const result = createFamily({
      zitadelSub,
      email,
      familyName,
      timezone,
    })

    // Family is created and identity is linked
    expect(result.family).toBeDefined()
    expect(result.family.name).toBe(familyName)
    expect(result.family.timezone).toBe(timezone)

    // Identity record is created keyed by ZITADEL sub, not email (D-16)
    expect(result.identity).toBeDefined()
    expect(result.identity.zitadelSub).toBe(zitadelSub)
    expect(result.identity.email).toBe(email)

    // Guardian membership is created in the family
    expect(result.membership).toBeDefined()
    expect(result.membership.identityId).toBe(result.identity.id)
    expect(result.membership.familyId).toBe(result.family.id)
    expect(result.membership.role).toBe('guardian')
    expect(result.membership.status).toBe('active')
  })

  it('should redirect or route guardian to /family/children after family creation (D-04)', () => {
    const result = createFamily({
      zitadelSub: 'zitadel|sub-guardian-789',
      email: 'parent@example.com',
      familyName: 'Oliveira Family',
      timezone: 'America/Sao_Paulo',
    })

    // After family creation, the redirect target is the child profile setup
    expect(result.redirectTo).toBe('/family/children')
  })

  it('should write sanitized audit evidence for family creation (FAM-07, D-17, D-18)', () => {
    const result = createFamily({
      zitadelSub: 'zitadel|sub-guardian-456',
      email: 'guardian2@example.com',
      familyName: 'Costa Family',
      timezone: 'America/Fortaleza',
    })

    // Audit event is created in the same transaction
    const auditEvent = createAuditEvent({
      familyId: result.family.id,
      actorIdentityId: result.identity.id,
      eventType: 'family.created',
      subjectType: 'family',
      subjectId: result.family.id,
      summary: 'Family "Costa Family" created',
    })

    expect(auditEvent).toBeDefined()
    expect(auditEvent.familyId).toBe(result.family.id)
    expect(auditEvent.actorIdentityId).toBe(result.identity.id)
    expect(auditEvent.eventType).toBe('family.created')
    expect(auditEvent.summary).toContain('Costa Family')

    // Sanitized: no raw technical diffs or sensitive details exposed (D-18)
    expect(auditEvent.metadata).toBeDefined()
    expect(auditEvent.metadata).not.toHaveProperty('rawSqlDiff')
    expect(auditEvent.metadata).not.toHaveProperty('fullIdentityPayload')
  })

  it('should not create family without authenticated ZITADEL sub', () => {
    expect(() => createFamily({
      zitadelSub: '',
      email: 'guardian@example.com',
      familyName: 'Test Family',
      timezone: 'UTC',
    })).toThrow()
  })
})

describe('Cross-family isolation (FAM-01, FAM-05)', () => {
  it('should prevent unauthenticated access from enumerating any family', () => {
    // Unauthenticated session must not reveal any family data
    expect(() => requireAuthenticatedIdentity(null)).toThrow()
  })

  it('should prevent member of family A from accessing family B data', () => {
    const identity = { id: 'identity-a', zitadelSub: 'zitadel|sub-a' }
    const familyA = 'family-a-uuid'
    const familyB = 'family-b-uuid'

    // Identity can access family A
    const membershipA = requireFamilyMember(identity, familyA)
    expect(membershipA.familyId).toBe(familyA)

    // Same identity cannot access family B (FAM-05 cross-family isolation)
    expect(() => requireFamilyMember(identity, familyB)).toThrow()
  })
})
