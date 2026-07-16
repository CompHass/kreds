'use server'

// Server Actions for the Goals panel (Phase 11) — same convention as
// src/app/actions/children.ts: auth() check, familyId in the WHERE clause,
// revalidatePath after mutation.
//
// One active goal per child at a time (matches the single `.limit(1)`
// active-goal read already relied on by garden/page.tsx and
// lib/reports/queries.ts): createGoal archives any existing active goal
// for that child before inserting the new one.

import { revalidatePath } from 'next/cache'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import { wishlistGoals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { GoalFormSchema, type GoalFormData } from '@/types/goal'

export async function createGoal(
  familyId: string,
  childId: string,
  data: GoalFormData,
): Promise<typeof wishlistGoals.$inferSelect> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = GoalFormSchema.parse(data)

  return await db.transaction(async (tx) => {
    await tx
      .update(wishlistGoals)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(
        and(
          eq(wishlistGoals.childProfileId, childId),
          eq(wishlistGoals.familyId, familyId),
          eq(wishlistGoals.status, 'active'),
        ),
      )

    const [goal] = await tx
      .insert(wishlistGoals)
      .values({
        familyId,
        childProfileId: childId,
        title: parsed.title,
        targetAmount: parsed.targetAmount,
        dueDate: parsed.dueDate ?? null,
      })
      .returning()

    revalidatePath(`/family/${familyId}/goals`)

    return goal
  })
}

export async function updateGoal(
  goalId: string,
  familyId: string,
  data: GoalFormData,
): Promise<typeof wishlistGoals.$inferSelect> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = GoalFormSchema.parse(data)

  const [goal] = await db
    .update(wishlistGoals)
    .set({
      title: parsed.title,
      targetAmount: parsed.targetAmount,
      dueDate: parsed.dueDate ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(wishlistGoals.id, goalId), eq(wishlistGoals.familyId, familyId)))
    .returning()

  if (!goal) throw new Error('Goal not found')

  revalidatePath(`/family/${familyId}/goals`)

  return goal
}

export async function archiveGoal(goalId: string, familyId: string): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(wishlistGoals)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(wishlistGoals.id, goalId), eq(wishlistGoals.familyId, familyId)))

  revalidatePath(`/family/${familyId}/goals`)
}
