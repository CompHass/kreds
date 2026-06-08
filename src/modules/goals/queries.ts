import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { wishlistGoals } from '@/lib/db/schema'

export type WishlistGoal = {
  id: string
  title: string
  targetAmount: number
  allocatedAmount: number
  status: 'active' | 'achieved' | 'archived'
  createdAt: Date
}

export async function listGoals(childProfileId: string, familyId: string): Promise<WishlistGoal[]> {
  return db
    .select({
      id: wishlistGoals.id,
      title: wishlistGoals.title,
      targetAmount: wishlistGoals.targetAmount,
      allocatedAmount: wishlistGoals.allocatedAmount,
      status: wishlistGoals.status,
      createdAt: wishlistGoals.createdAt,
    })
    .from(wishlistGoals)
    .where(
      and(
        eq(wishlistGoals.childProfileId, childProfileId),
        eq(wishlistGoals.familyId, familyId),
      ),
    )
    .orderBy(desc(wishlistGoals.createdAt))
}

export async function getGoal(
  goalId: string,
  childProfileId: string,
  familyId: string,
): Promise<WishlistGoal | null> {
  const [goal] = await db
    .select({
      id: wishlistGoals.id,
      title: wishlistGoals.title,
      targetAmount: wishlistGoals.targetAmount,
      allocatedAmount: wishlistGoals.allocatedAmount,
      status: wishlistGoals.status,
      createdAt: wishlistGoals.createdAt,
    })
    .from(wishlistGoals)
    .where(
      and(
        eq(wishlistGoals.id, goalId),
        eq(wishlistGoals.childProfileId, childProfileId),
        eq(wishlistGoals.familyId, familyId),
      ),
    )
    .limit(1)

  return goal ?? null
}
