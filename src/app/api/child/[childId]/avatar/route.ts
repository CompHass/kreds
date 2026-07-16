// Phase 14: child self-serve avatar picker — PATCH /api/child/[childId]/avatar
// Auth mirrors the harvest route: child-session cookie → verify JWT → ownership
// scope guard (child A cannot change child B's avatar). familyId always comes
// from the signed session, never from the body (T-06-13 pattern), and the
// UPDATE is scoped by and(id, familyId) for family isolation.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { verifyChildSession } from '@/lib/families/child-session'
import { validateChildSessionScope } from '@/lib/auth/child-guard'
import { UpdateChildAvatarSchema } from '@/types/child'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  // CRITICAL: await params in Next.js 15+
  const { childId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('child-session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let session: { childProfileId: string; familyId: string; role: 'child' }
  try {
    session = await verifyChildSession(token)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!validateChildSessionScope(session, childId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const result = UpdateChildAvatarSchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const [updated] = await db
    .update(childProfiles)
    .set({ avatarPreset: result.data.avatarPreset, updatedAt: new Date() })
    .where(
      and(eq(childProfiles.id, childId), eq(childProfiles.familyId, session.familyId)),
    )
    .returning({ id: childProfiles.id, avatarPreset: childProfiles.avatarPreset })

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
