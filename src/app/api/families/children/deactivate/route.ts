import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { deactivateChildProfile } from '@/lib/families/child-profiles'

/**
 * POST /api/families/children/deactivate
 *
 * Soft-deactivates a child profile (D-12). Preserves audit history.
 * Only an active guardian of the child's family can deactivate.
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Resolve Kreds UUID from ZITADEL sub — membership columns use the DB UUID, not the sub string
  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  }

  const childProfileId = body.childProfileId

  if (!childProfileId) {
    return NextResponse.json({ error: 'Child profile ID is required' }, { status: 400 })
  }

  // Get the guardian's family
  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found' }, { status: 400 })
  }

  try {
    await deactivateChildProfile(childProfileId, membership.familyId, kredsIdentityId)
    return NextResponse.redirect(new URL('/family/children', request.url), 303)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deactivate child profile'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
