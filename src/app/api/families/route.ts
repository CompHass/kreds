import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { createFamilyForGuardian } from '@/lib/families/commands'
import { isValidTimezone } from '@/lib/families/timezones'

/**
 * GET /api/families
 *
 * Returns ONLY the authenticated user's current family data.
 * Membership-checked — never enumerates all families (T-02-05 mitigated).
 * Unauthenticated requests receive 401.
 */
export async function GET() {
  const session = await auth()

  try {
    const identity = requireAuthenticatedIdentity(session)

    // Resolve the Kreds UUID (DB key) from the ZITADEL sub (session key)
    const kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)

    const memberships = await db
      .select({
        familyId: schema.familyMemberships.familyId,
        role: schema.familyMemberships.role,
      })
      .from(schema.familyMemberships)
      .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
      .limit(1)

    if (memberships.length === 0) {
      return NextResponse.json({ family: null, needsOnboarding: true })
    }

    const membership = memberships[0]

    const families = await db
      .select({
        id: schema.families.id,
        name: schema.families.name,
        timezone: schema.families.timezone,
        createdAt: schema.families.createdAt,
      })
      .from(schema.families)
      .where(eq(schema.families.id, membership.familyId))
      .limit(1)

    if (families.length === 0) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    return NextResponse.json({
      family: families[0],
      role: membership.role,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

/**
 * POST /api/families
 *
 * Creates a new family for an authenticated guardian (D-01, D-03).
 * After creation, returns redirect target /family/children per D-04.
 * Unauthenticated requests receive 401.
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  try {
    const identity = requireAuthenticatedIdentity(session)

    let body: { familyName?: string; timezone?: string }
    try {
      body = await request.json()
    } catch {
      // Fallback for form-encoded (onboarding page submits as form)
      const formData = await request.formData()
      body = {
        familyName: formData.get('familyName')?.toString(),
        timezone: formData.get('timezone')?.toString(),
      }
    }

    const { familyName, timezone } = body

    if (!familyName || !timezone) {
      return NextResponse.json(
        { error: 'Family name and timezone are required' },
        { status: 400 },
      )
    }

    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 },
      )
    }

    const result = await createFamilyForGuardian({
      zitadelSub: identity.zitadelSub,
      email: identity.email ?? '',
      familyName,
      timezone,
    })

    return NextResponse.json(
      {
        family: result.family,
        membership: result.membership,
        redirectTo: result.redirectTo,
      },
      { status: 201 },
    )
  } catch (err) {
    // Auth errors thrown by requireAuthenticatedIdentity are handled here; return 401
    if (err instanceof Error && err.message.startsWith('Authentication required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Do not leak internal DB or server error messages to clients
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 })
  }
}
