import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { families, familyMemberships, identities } from '@/lib/db/schema'

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
    const [family] = await tx.insert(families).values({ name: 'Família', createdByIdentityId: identity.id }).returning({ id: families.id })
    if (!family) throw new Error('Guardian family bootstrap failed')
    await tx.insert(familyMemberships).values({ familyId: family.id, identityId: identity.id, role: 'guardian' })
  })
  return identity.id
}
