import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { createAuditEvent } from '@/lib/families/audit'
import { verifyPin } from '@/lib/families/child-pin'
import {
  checkBruteForce,
  recordFailedAttempt,
  resetAttempts,
  signChildSession,
} from '@/lib/families/child-session'

type ChildAuthBody = {
  childProfileId?: string
  pin?: string
}

async function parseBody(request: NextRequest): Promise<ChildAuthBody> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData()
    return {
      childProfileId: formData.get('childProfileId')?.toString(),
      pin: formData.get('pin')?.toString(),
    }
  }

  return {}
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  const { familyId } = await params
  const body = await parseBody(request)
  const childProfileId = body.childProfileId?.trim()
  const pin = body.pin?.trim()

  if (!childProfileId || !pin) {
    return NextResponse.json({ error: 'Child profile and PIN are required.' }, { status: 400 })
  }

  const bruteForce = checkBruteForce(childProfileId)
  if (bruteForce.blocked) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 },
    )
  }

  const [profile] = await db
    .select({
      id: schema.childProfiles.id,
      familyId: schema.childProfiles.familyId,
      displayName: schema.childProfiles.displayName,
      active: schema.childProfiles.active,
      pinHash: schema.childProfiles.pinHash,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, childProfileId),
        eq(schema.childProfiles.familyId, familyId),
      ),
    )
    .limit(1)

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  if (!profile.active) {
    return NextResponse.json({ error: 'Profile inactive.' }, { status: 403 })
  }

  if (!profile.pinHash) {
    return NextResponse.json({ error: 'PIN is not configured for this profile.' }, { status: 403 })
  }

  const pinMatches = await verifyPin(pin, profile.pinHash)

  if (!pinMatches) {
    recordFailedAttempt(childProfileId)

    await createAuditEvent({
      familyId,
      actorIdentityId: null,
      eventType: 'child_login_failed',
      subjectType: 'child_profile',
      subjectId: childProfileId,
      summary: `Child login failed for "${profile.displayName}"`,
      metadata: { familyId },
    })

    return NextResponse.json({ error: 'PIN incorrect.' }, { status: 401 })
  }

  resetAttempts(childProfileId)

  const token = await signChildSession({ childProfileId, familyId, role: 'child' })

  await db
    .update(schema.childProfiles)
    .set({ lastAccessedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.childProfiles.id, childProfileId))

  await createAuditEvent({
    familyId,
    actorIdentityId: null,
    eventType: 'child_login_success',
    subjectType: 'child_profile',
    subjectId: childProfileId,
    summary: `Child login succeeded for "${profile.displayName}"`,
    metadata: { familyId },
  })

  const response = NextResponse.json({ ok: true, childProfileId, familyId })
  response.cookies.set('child-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60,
  })

  return response
}
