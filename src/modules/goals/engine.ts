import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { wishlistGoals, ledgerLines, ledgerTransactions } from '@/lib/db/schema'
import { getBalance } from '@/modules/ledger/queries'

export async function createGoal({
  familyId,
  childProfileId,
  title,
  targetAmount,
}: {
  familyId: string
  childProfileId: string
  title: string
  targetAmount: number
}) {
  const [goal] = await db
    .insert(wishlistGoals)
    .values({
      id: crypto.randomUUID(),
      familyId,
      childProfileId,
      title,
      targetAmount,
      allocatedAmount: 0,
      status: 'active',
    })
    .returning()

  return goal
}

export async function allocateTowardGoal({
  goalId,
  familyId,
  childProfileId,
  guardianIdentityId,
  amount,
}: {
  goalId: string
  familyId: string
  childProfileId: string
  guardianIdentityId: string
  amount: number
}) {
  const [goal] = await db
    .select()
    .from(wishlistGoals)
    .where(
      and(
        eq(wishlistGoals.id, goalId),
        eq(wishlistGoals.childProfileId, childProfileId),
        eq(wishlistGoals.familyId, familyId),
        eq(wishlistGoals.status, 'active'),
      ),
    )
    .limit(1)

  if (!goal) throw new Error('goal_not_found')

  const remaining = goal.targetAmount - goal.allocatedAmount
  if (amount > remaining) throw new Error('amount_exceeds_remaining')

  const availableBalance = await getBalance(childProfileId, 'available')
  if (amount > availableBalance) throw new Error('insufficient_balance')

  return await db.transaction(async (tx) => {
    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId,
        childProfileId,
        commandId: crypto.randomUUID(),
        transactionType: 'goal_allocation',
        initiatedByIdentityId: guardianIdentityId,
        note: `Alocado para sonho: ${goal.title}`,
      })
      .returning()

    await tx.insert(ledgerLines).values({
      id: crypto.randomUUID(),
      transactionId: txHeader.id,
      childProfileId,
      accountType: 'available',
      amount: -amount,
    })

    const newAllocated = goal.allocatedAmount + amount
    const newStatus = newAllocated >= goal.targetAmount ? 'achieved' : 'active'

    const [updated] = await tx
      .update(wishlistGoals)
      .set({
        allocatedAmount: newAllocated,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(wishlistGoals.id, goalId))
      .returning()

    return updated
  })
}
