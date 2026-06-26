// Task Route Handlers — Phase 6 (API-01, API-02)
// PATCH: update task template fields (title, category, days, kredsValue, approval)
// DELETE: soft-delete — sets isActive=false and deactivatedAt=now()
//
// Security (T-06-05, T-06-06, T-06-07):
// - auth() guard returns 401 if no session
// - familyId isolation in every WHERE clause prevents cross-family writes
// - updatedAt set explicitly on every mutation (Drizzle does not auto-update)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../auth'
import { db } from '@/lib/db'
import { taskTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { UpdateTaskSchema } from '@/types/task'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string; taskId: string }> },
) {
  // CRITICAL: await params before accessing familyId/taskId (Next.js 15+ requirement)
  const { familyId, taskId } = await params

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

  const result = UpdateTaskSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  // familyId in WHERE clause prevents cross-family writes (T-06-05)
  // updatedAt set explicitly — Drizzle does not auto-update timestamp columns
  const [updated] = await db
    .update(taskTemplates)
    .set({ ...result.data, updatedAt: new Date() })
    .where(
      and(
        eq(taskTemplates.id, taskId),
        eq(taskTemplates.familyId, familyId),
      ),
    )
    .returning()

  if (!updated) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ familyId: string; taskId: string }> },
) {
  // CRITICAL: await params before accessing familyId/taskId (Next.js 15+ requirement)
  const { familyId, taskId } = await params

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft-delete: set isActive=false and deactivatedAt=now() (history preserved — D-06)
  await db
    .update(taskTemplates)
    .set({
      isActive: false,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(taskTemplates.id, taskId),
        eq(taskTemplates.familyId, familyId),
      ),
    )

  return NextResponse.json({ ok: true })
}
