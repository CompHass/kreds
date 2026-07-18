import 'server-only'

// Phase 13 — shared guardian-membership resolution.
//
// Resolves the next-auth session user (Zitadel `sub` stored on session.user.id)
// into the Kreds-domain identity + an active guardian membership for `familyId`.
// This is the deep authorization check that the old /family/* routes were
// missing: next-auth confirms *who* you are, but nothing confirmed the user is
// actually a guardian of the family in the URL. Any code path that grants panel
// access must call this — middleware (cookie presence) is only a fast reject.
//
// Canonical resolution pattern lifted from src/app/family/page.tsx.

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { identities, familyMemberships } from '@/lib/db/schema'

export interface GuardianMembership {
  identityId: string
  familyId: string
}

/**
 * Returns the active guardian membership for the authenticated user in
 * `familyId`, or null if the user is not authenticated or is not an active
 * guardian of that family.
 *
 * @param zitadelSubject - `session.user.id` from next-auth (Zitadel `sub`)
 * @param familyId       - the family in the route
 */
export async function resolveGuardianMembership(
  zitadelSubject: string | undefined | null,
  familyId: string,
): Promise<GuardianMembership | null> {
  if (!zitadelSubject) return null

  const identity = await db
    .select({ id: identities.id })
    .from(identities)
    .where(eq(identities.zitadelSubject, zitadelSubject))
    .limit(1)
    .then((r) => r[0])
  if (!identity) return null

  const membership = await db
    .select({ familyId: familyMemberships.familyId, identityId: familyMemberships.identityId })
    .from(familyMemberships)
    .where(
      and(
        eq(familyMemberships.identityId, identity.id),
        eq(familyMemberships.familyId, familyId),
        eq(familyMemberships.role, 'guardian'),
        eq(familyMemberships.status, 'active'),
      ),
    )
    .limit(1)
    .then((r) => r[0])

  // identityId is a non-null column in practice (filtered on identity.id above),
  // but the schema types it nullable, so guard defensively.
  if (!membership?.identityId) return null
  return { familyId: membership.familyId, identityId: membership.identityId }
}
