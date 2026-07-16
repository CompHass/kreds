'use server'

// Server Actions for the Goals panel (Phase 11) — same convention as
// src/app/actions/children.ts: auth() check, familyId in the WHERE clause,
// revalidatePath after mutation.
//
// A child can have several active goals at once — the child picks which
// goal to allocate Kreds into (see SavingsSection). createGoal just inserts;
// it does not touch any other goal.

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

  const [goal] = await db
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
