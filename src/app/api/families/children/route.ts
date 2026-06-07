import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { createChildProfile } from '@/lib/families/child-profiles'

/**
 * POST /api/families/children
 *
 * Creates a child profile for the authenticated guardian's family.
 * Requires explicit consent via checkbox (D-02, FAM-03).
 * Redirects to /family/children on success.
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

  // Get the guardian's family
  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found. Create a family first.' }, { status: 400 })
  }

  const familyId = membership.familyId
  const consentGiven = body.consentGiven === 'true' || body.consentGiven === 'on'

  if (!consentGiven) {
    return NextResponse.json({ error: 'Explicit parental consent is required (D-02)' }, { status: 400 })
  }

  try {
    await createChildProfile({
      familyId,
      guardianIdentityId: kredsIdentityId,
      displayName: body.displayName ?? '',
      ageYears: parseInt(body.ageYears ?? '0', 10),
      avatarPreset: body.avatarPreset ?? '',
      accentColor: body.accentColor ?? '',
      consentGiven,
    })

    return NextResponse.redirect(new URL('/family/children', request.url), 303)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create child profile'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
