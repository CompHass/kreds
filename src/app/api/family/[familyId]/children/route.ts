// Children Route Handlers — Phase 8 (D-06, D-14)
// GET: list ALL child profiles for a family (including deactivated — D-14 toggle target)
// POST: create a new child profile
//
// Security (T-08-05, T-08-08, T-08-10):
// - auth() guard returns 401 if no session
// - familyId isolation on every query (eq(childProfiles.familyId, familyId))
// - familyId injected from URL params, never trusted from request body
// - Zod validation rejects invalid displayName, ageYears, accentColor

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CreateChildSchema } from '@/types/child'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  // CRITICAL: await params before accessing familyId (Next.js 15+ requirement)
  const { familyId } = await params

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // NO active filter — deactivated children must still appear (D-14 toggle target)
  const children = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.familyId, familyId))

  return NextResponse.json(children)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  // CRITICAL: await params before accessing familyId (Next.js 15+ requirement)
  const { familyId } = await params

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

  const result = CreateChildSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  // familyId isolation: inject familyId from URL params, never trust body (T-08-10)
  // avatarPreset comes validated from CreateChildSchema (enum, default 'initial' — Phase 14)
  const [created] = await db
    .insert(childProfiles)
    .values({ ...result.data, familyId })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
