import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { getChildSession } from '@/lib/families/child-session'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { getCycleForDate } from '@/modules/activity/cycle'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string; taskId: string }> },
) {
  try {
    const { childId, taskId } = await params
    const cookieStore = await cookies()
    const session = await getChildSession(cookieStore)

    // Verify authentication and scope
    if (!session || session.childProfileId !== childId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch family timezone to calculate correct cycle
    const [familyRow] = await db
      .select({ timezone: schema.families.timezone })
      .from(schema.families)
      .innerJoin(
        schema.childProfiles,
        eq(schema.childProfiles.familyId, schema.families.id),
      )
      .where(eq(schema.childProfiles.id, session.childProfileId))
      .limit(1)

    const timezone = familyRow?.timezone ?? 'America/Sao_Paulo'
    const { cycleStart } = getCycleForDate(new Date(), timezone)
    const cycleStartStr = cycleStart.toISOString().split('T')[0] // 'YYYY-MM-DD'

    // Parse request body
    const { action } = await req.json().catch(() => ({}))

    if (action === 'complete') {
      await db
        .insert(schema.taskCompletions)
        .values({
          taskTemplateId: taskId,
          childProfileId: session.childProfileId,
          cycleStart: cycleStartStr,
          status: 'completed',
          completedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            schema.taskCompletions.taskTemplateId,
            schema.taskCompletions.childProfileId,
            schema.taskCompletions.cycleStart,
          ],
          set: {
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })
    } else if (action === 'uncomplete') {
      await db
        .insert(schema.taskCompletions)
        .values({
          taskTemplateId: taskId,
          childProfileId: session.childProfileId,
          cycleStart: cycleStartStr,
          status: 'pending',
          completedAt: null,
        })
        .onConflictDoUpdate({
          target: [
            schema.taskCompletions.taskTemplateId,
            schema.taskCompletions.childProfileId,
            schema.taskCompletions.cycleStart,
          ],
          set: {
            status: 'pending',
            completedAt: null,
            updatedAt: new Date(),
          },
        })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      status: action === 'complete' ? 'completed' : 'pending',
    })
  } catch (error) {
    console.error('Task toggle error:', error)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    )
  }
}
