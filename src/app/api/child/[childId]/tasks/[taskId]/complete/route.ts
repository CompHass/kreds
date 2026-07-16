import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { taskCompletions, taskTemplates } from '@/lib/db/schema'
import { verifyChildSession } from '@/lib/families/child-session'
import { validateChildSessionScope } from '@/lib/auth/child-guard'
import { getCurrentCycleStart } from '@/lib/cycles/current-cycle'

// Persists the garden-view task checkbox toggle so Phase 9 reports can read
// real completion counts (previously client-only state, never written to
// taskCompletions). Same auth pattern as harvest/route.ts.

const CompleteBodySchema = z.object({
  completed: z.boolean(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string; taskId: string }> },
) {
  // CRITICAL: await params in Next.js 15+
  const { childId, taskId } = await params

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

  // Ownership guard — child A cannot mark child B's tasks (mirrors T-06-10)
  if (!validateChildSessionScope(session, childId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const result = CompleteBodySchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const { completed } = result.data

  // Task must exist and actually belong to this child (T-06-16) — otherwise
  // a child could mark a sibling's task as done via a guessed taskId.
  const [task] = await db
    .select({ id: taskTemplates.id })
    .from(taskTemplates)
    .where(and(eq(taskTemplates.id, taskId), eq(taskTemplates.assignedChildId, childId)))
    .limit(1)

  if (!task) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const cycleStart = getCurrentCycleStart()
  const status = completed ? 'completed' : 'pending'

  const [row] = await db
    .insert(taskCompletions)
    .values({
      taskTemplateId: taskId,
      childProfileId: childId,
      cycleStart,
      status,
      completedAt: completed ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [
        taskCompletions.taskTemplateId,
        taskCompletions.childProfileId,
        taskCompletions.cycleStart,
      ],
      set: {
        status,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      },
    })
    .returning()

  return NextResponse.json(row, { status: 200 })
}
