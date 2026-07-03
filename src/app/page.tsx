import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { db } from '@/lib/db'
import { identities, familyMemberships } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export default async function Home() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const identity = await db
    .select({ id: identities.id })
    .from(identities)
    .where(eq(identities.zitadelSubject, session.user.id))
    .limit(1)
    .then((r) => r[0])

  if (!identity) redirect('/login')

  const membership = await db
    .select({ familyId: familyMemberships.familyId })
    .from(familyMemberships)
    .where(
      and(
        eq(familyMemberships.identityId, identity.id),
        eq(familyMemberships.status, 'active')
      )
    )
    .limit(1)
    .then((r) => r[0])

  if (!membership) redirect('/login')

  redirect(`/family/${membership.familyId}/tasks`)
}
