// Children Route Handler — Phase 8 (D-13, D-14)
// PATCH: two actions via body discriminator — 'reset-pin' or 'toggle-active'
//
// Security (T-08-05, T-08-08, T-08-10, T-08-11):
// - auth() guard returns 401 if no session
// - familyId AND childId both come from URL params, never from body (T-08-05/T-08-10)
// - reset-pin dual-writes pinHash + pinEncrypted together (D-13); response omits pin fields
// - toggle-active soft-(de)activates; no session revocation (D-14/D-15)
// - this file never reads pinEncrypted for authentication (D-11)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { ResetPinSchema } from '@/types/child'
import { hashPin } from '@/lib/families/child-pin'
import { encryptPin } from '@/lib/crypto/pin-cipher'

const ToggleActiveSchema = z.object({
  action: z.literal('toggle-active'),
  active: z.boolean(),
})

const ResetPinActionSchema = z.object({
  action: z.literal('reset-pin'),
  pin: ResetPinSchema.shape.pin,
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string; childId: string }> },
) {
  // CRITICAL: await params before accessing familyId/childId (Next.js 15+ requirement)
  const { familyId, childId } = await params

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = (body as { action?: unknown })?.action

  if (action === 'reset-pin') {
    const result = ResetPinActionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const pinHash = await hashPin(result.data.pin)
    const pinEncrypted = encryptPin(result.data.pin)

    const [updated] = await db
      .update(childProfiles)
      .set({ pinHash, pinEncrypted, updatedAt: new Date() })
      .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // reset-pin returns the row WITHOUT pin fields
    const { pinHash: _pinHash, pinEncrypted: _pinEncrypted, ...safe } = updated
    return NextResponse.json(safe)
  }

  if (action === 'toggle-active') {
    const result = ToggleActiveSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      )
    }

    const [updated] = await db
      .update(childProfiles)
      .set({
        active: result.data.active,
        deactivatedAt: result.data.active ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
