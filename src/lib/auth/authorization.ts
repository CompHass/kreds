import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// Types

export interface KredsIdentity {
  id: string
  zitadelSub: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
}

export interface FamilyMembership {
  familyId: string
  identityId: string | null
  childProfileId: string | null
  role: 'guardian' | 'child'
  status: 'active' | 'inactive'
}

export type FamilyRole = 'guardian' | 'child'

// Pure inference helpers

/**
 * Maps an Auth.js session to a Kreds identity.
 * Extracts the stable ZITADEL sub (user.id) — never relies on mutable email as primary key.
 * For local Kreds identity creation, the caller should upsert via the identity table.
 *
 * @throws {Error} If session is null, has no user, or user has no ZITADEL sub (id)
 */
export function requireAuthenticatedIdentity(session: unknown): KredsIdentity {
  if (!session || typeof session !== 'object') {
    throw new Error('Authentication required')
  }

  const s = session as Record<string, unknown>
  const user = s.user as Record<string, unknown> | undefined

  if (!user || typeof user !== 'object') {
    throw new Error('Authentication required — no user in session')
  }

  const zitadelSub = user.id as string | undefined
  if (!zitadelSub) {
    throw new Error('Authentication required — no ZITADEL subject (sub) in session')
  }

  return {
    id: zitadelSub,
    zitadelSub,
    email: (user.email as string) ?? null,
    emailVerified: (user.emailVerified as boolean) ?? false,
    displayName: (user.name as string) ?? null,
  }
}

// Type for the membership lookup function — allows dependency injection for testing

export type MembershipLookup = (identityId: string, familyId: string) => Promise<FamilyMembership | null>

/**
 * Creates a requireActiveGuardian helper bound to a membership lookup function.
 * In production, use the default `requireActiveGuardian` export which queries real DB.
 */
export function makeRequireActiveGuardian(
  lookup: MembershipLookup,
): (identity: KredsIdentity | null, familyId: string) => Promise<FamilyMembership> {
  return async function requireActiveGuardian(
    identity: KredsIdentity | null,
    familyId: string,
  ): Promise<FamilyMembership> {
    if (!identity) {
      throw new Error('Authentication required')
    }

    const row = await lookup(identity.id, familyId)

    if (!row) {
      throw new Error(`Not a member of family ${familyId}`)
    }

    if (row.role !== 'guardian') {
      throw new Error('Guardian role required')
    }

    if (row.status !== 'active') {
      throw new Error('Active guardian membership required')
    }

    return row
  }
}

/**
 * Creates a requireFamilyMember helper bound to a membership lookup function.
 * In production, use the default `requireFamilyMember` export which queries real DB.
 */
export function makeRequireFamilyMember(
  lookup: MembershipLookup,
): (identity: KredsIdentity | null, familyId: string) => Promise<FamilyMembership> {
  return async function requireFamilyMember(
    identity: KredsIdentity | null,
    familyId: string,
  ): Promise<FamilyMembership> {
    if (!identity) {
      throw new Error('Authentication required')
    }

    const row = await lookup(identity.id, familyId)

    if (!row || row.status !== 'active') {
      throw new Error(`Not an active member of family ${familyId}`)
    }

    return row
  }
}

// Default production exports — bound to the real Drizzle DB

const dbLookup: MembershipLookup = async (identityId: string, familyId: string) => {
  const [row] = await db
    .select({
      familyId: schema.familyMemberships.familyId,
      identityId: schema.familyMemberships.identityId,
      childProfileId: schema.familyMemberships.childProfileId,
      role: schema.familyMemberships.role,
      status: schema.familyMemberships.status,
    })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.familyId, familyId),
        eq(schema.familyMemberships.identityId, identityId),
      ),
    )
  return (row as FamilyMembership) ?? null
}

export const requireActiveGuardian = makeRequireActiveGuardian(dbLookup)
export const requireFamilyMember = makeRequireFamilyMember(dbLookup)

/**
 * Pure predicate: checks if a membership has the given role.
 */
export function hasRole(
  membership: FamilyMembership | null,
  role: FamilyRole,
): boolean {
  return membership !== null && membership.role === role
}

/**
 * Pure predicate: checks if a membership represents an active guardian.
 */
export function isGuardian(membership: FamilyMembership | null): boolean {
  return (
    membership !== null &&
    membership.role === 'guardian' &&
    membership.status === 'active'
  )
}

/**
 * Pure predicate: checks if a membership represents an active child.
 */
export function isChild(membership: FamilyMembership | null): boolean {
  return (
    membership !== null &&
    membership.role === 'child' &&
    membership.status === 'active'
  )
}
