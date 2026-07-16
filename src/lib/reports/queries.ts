import 'server-only'

// Phase 9 — aggregates the weekly report per child for a given cycle.
// Reuses existing tables (no new schema): taskTemplates/taskCompletions for
// task progress, ledger for Kreds earned + firstfruits, wishlistGoals for
// savings snapshot. Task completion is persisted via
// POST /api/child/[childId]/tasks/[taskId]/complete (garden-view.tsx).

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { childProfiles, taskTemplates, taskCompletions, wishlistGoals } from '@/lib/db/schema'
import { getEarningsForCycle } from '@/modules/ledger/queries'
import { getCycleRange } from '@/lib/cycles/current-cycle'
import type { ChildWeeklyReport, FamilyWeeklyReport } from '@/types/report'

export async function getFamilyWeeklyReport(
  familyId: string,
  cycleStart: string,
): Promise<FamilyWeeklyReport> {
  const { start, endExclusive } = getCycleRange(cycleStart)

  const children = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))

  const reports = await Promise.all(
    children.map(async (child): Promise<ChildWeeklyReport> => {
      const [tasks, completions, earnings, goals] = await Promise.all([
        db
          .select({ id: taskTemplates.id })
          .from(taskTemplates)
          .where(and(eq(taskTemplates.assignedChildId, child.id), eq(taskTemplates.isActive, true))),

        db
          .select({ id: taskCompletions.id })
          .from(taskCompletions)
          .where(
            and(
              eq(taskCompletions.childProfileId, child.id),
              eq(taskCompletions.cycleStart, cycleStart),
              eq(taskCompletions.status, 'completed'),
            ),
          ),

        getEarningsForCycle(child.id, start, endExclusive),

        db
          .select({ allocatedAmount: wishlistGoals.allocatedAmount, targetAmount: wishlistGoals.targetAmount })
          .from(wishlistGoals)
          .where(and(eq(wishlistGoals.childProfileId, child.id), eq(wishlistGoals.status, 'active')))
          .limit(1),
      ])

      const goal = goals[0]

      return {
        childId: child.id,
        displayName: child.displayName,
        accentColor: child.accentColor,
        tasksCompleted: completions.length,
        tasksTotal: tasks.length,
        kredsEarned: earnings.available + earnings.firstfruits,
        firstfruitsSeparated: earnings.firstfruits,
        savingsAllocated: goal?.allocatedAmount ?? null,
        savingsGoal: goal?.targetAmount ?? null,
      }
    }),
  )

  return { cycleStart, children: reports }
}
