import 'server-only'

import { and, eq } from 'drizzle-orm'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from './authorization'

export type CurrentFamilyContext = {
  familyId: string
  kredsIdentityId: string
  role: 'guardian' | 'child'
}

export async function requireCurrentFamilyContext(): Promise<CurrentFamilyContext> {
  const session = await auth()
  const identity = requireAuthenticatedIdentity(session)
  const kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)

  const [membership] = await db
    .select({
      familyId: schema.familyMemberships.familyId,
      role: schema.familyMemberships.role,
    })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) {
    throw new Error('No active family membership found')
  }

  return {
    familyId: membership.familyId,
    kredsIdentityId,
    role: membership.role,
  }
}

export async function requireChildInFamily(childProfileId: string, familyId: string) {
  const [child] = await db
    .select({ id: schema.childProfiles.id })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, childProfileId),
        eq(schema.childProfiles.familyId, familyId),
        eq(schema.childProfiles.active, true),
      ),
    )
    .limit(1)

  if (!child) {
    throw new Error('Child profile not found in current family')
  }

  return child
}
