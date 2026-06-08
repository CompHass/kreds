import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { createChildProfile } from '@/lib/families/child-profiles'
import { validatePinFormat } from '@/lib/families/child-pin'

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

  // Parse body — inspect Content-Type first to avoid consuming the stream twice.
  // Node.js 22+ (undici) marks the body as unusable after any read attempt, even a
  // failed json() call, so the try-json-then-formData pattern always throws on the
  // second call.
  const contentType = request.headers.get('content-type') ?? ''
  let body: Record<string, string>
  if (contentType.includes('application/json')) {
    body = await request.json()
  } else if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  } else {
    try {
      body = await request.json()
    } catch {
      body = {}
    }
  }

  // Get the guardian's active family membership — role and status guard (WR-01)
  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.role, 'guardian'),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found. Create a family first.' }, { status: 400 })
  }

  const familyId = membership.familyId
  const consentGiven = body.consentGiven === 'true' || body.consentGiven === 'on'
  const pin = body.pin?.trim() || undefined

  if (!consentGiven) {
    return NextResponse.json({ error: 'Explicit parental consent is required (D-02)' }, { status: 400 })
  }

  // Strict numeric validation for age — reject mixed strings like "8abc" (WR-07)
  const rawAge = body.ageYears ?? ''
  if (!/^\d+$/.test(rawAge)) {
    return NextResponse.json({ error: 'Age must be a whole number' }, { status: 400 })
  }
  const ageYears = parseInt(rawAge, 10)

  if (pin && !validatePinFormat(pin)) {
    return NextResponse.json({ error: 'PIN must have 4 to 6 numeric digits' }, { status: 400 })
  }

  try {
    await createChildProfile({
      familyId,
      guardianIdentityId: kredsIdentityId,
      displayName: body.displayName ?? '',
      ageYears,
      avatarPreset: body.avatarPreset ?? '',
      accentColor: body.accentColor ?? '',
      pin,
      consentGiven,
    })

    return NextResponse.redirect(new URL('/family/children', request.url), 303)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create child profile'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
