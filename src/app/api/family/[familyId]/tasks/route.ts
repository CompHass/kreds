// Task Route Handlers — Phase 6 (API-01, API-02)
// GET: list active task templates for a family
// POST: create a new task template
//
// Security (T-06-04, T-06-05, T-06-06, T-06-07):
// - auth() guard returns 401 if no session
// - familyId isolation on every query (eq(taskTemplates.familyId, familyId))
// - Zod validation rejects invalid kredsValue, days, category, and assignedChildId

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { db } from '@/lib/db'
import { taskTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { CreateTaskSchema } from '@/types/task'

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

  const tasks = await db
    .select()
    .from(taskTemplates)
    .where(
      and(
        eq(taskTemplates.familyId, familyId),
        eq(taskTemplates.isActive, true),
      ),
    )

  return NextResponse.json(tasks)
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

  // Zod validates: title required, assignedChildId UUID, kredsValue positive int,
  // days array of 0-6 indices, category optional enum, approval boolean (T-06-06, T-06-07)
  const result = CreateTaskSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  // familyId isolation: inject familyId from URL params, never trust body
  const [created] = await db
    .insert(taskTemplates)
    .values({ ...result.data, familyId })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
