import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { families, familyMemberships, guardianInvitations, identities } from '@/lib/db/schema'

export interface GuardianIdentityInput {
  subject: string
  email: string
  emailVerified: boolean
  displayName: string | null
}

export async function syncGuardianIdentity(input: GuardianIdentityInput): Promise<string> {
  const [identity] = await db
    .insert(identities)
    .values({ zitadelSubject: input.subject, email: input.email, emailVerified: input.emailVerified, displayName: input.displayName })
    .onConflictDoUpdate({
      target: identities.zitadelSubject,
      set: { email: input.email, emailVerified: input.emailVerified, displayName: input.displayName, updatedAt: new Date() },
    })
    .returning({ id: identities.id })
  if (!identity) throw new Error('Guardian identity sync returned no identity')

  await db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ id: familyMemberships.id })
      .from(familyMemberships)
      .where(and(eq(familyMemberships.identityId, identity.id), eq(familyMemberships.status, 'active')))
      .limit(1)
    if (membership) return
    const [invite] = await tx.select().from(guardianInvitations).where(and(
      eq(guardianInvitations.email, input.email.toLowerCase()),
      eq(guardianInvitations.status, 'pending'),
    )).limit(1)
    if (invite) {
      await tx.insert(familyMemberships).values({ familyId: invite.familyId, identityId: identity.id, role: 'guardian' }).onConflictDoNothing()
      await tx.update(guardianInvitations).set({ status: 'accepted', acceptedByIdentityId: identity.id, updatedAt: new Date() }).where(eq(guardianInvitations.id, invite.id))
      return
    }
    const [family] = await tx.insert(families).values({ name: 'Família', createdByIdentityId: identity.id }).returning({ id: families.id })
    if (!family) throw new Error('Guardian family bootstrap failed')
    await tx.insert(familyMemberships).values({ familyId: family.id, identityId: identity.id, role: 'guardian' })
  })
  return identity.id
}
