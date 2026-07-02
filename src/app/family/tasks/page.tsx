import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { auth } from '../../../../auth'

export const dynamic = 'force-dynamic'

/**
 * /family/tasks (bare, no familyId) is kept only as a redirect target for
 * old links (BottomNav "Missões" tab, child profile page). The real task
 * panel is /family/[familyId]/tasks (ParentPanelView, Fases 5-6).
 */
export default async function FamilyTasksRedirectPage() {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  redirect(`/family/${membership.familyId}/tasks`)
}
