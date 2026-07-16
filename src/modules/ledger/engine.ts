import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ledgerLines, ledgerTransactions } from '@/lib/db/schema/ledger'
import { wishlistGoals } from '@/lib/db/schema'
import { calculateFirstfruits } from './calculate'
import type {
  AdjustmentCommand,
  EarningCommand,
  GoalAllocationCommand,
  ReversalCommand,
} from './commands'
import { getBalance } from './queries'

export async function postEarning(command: EarningCommand) {
  return await db.transaction(async (tx) => {
    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,
        transactionType: 'task_earning',
        initiatedByIdentityId: command.guardianIdentityId,
        note: command.note ?? null,
      })
      .returning()

    const firstfruits = calculateFirstfruits(command.amount)
    const available = command.amount - firstfruits

    const lines = [
      {
        id: crypto.randomUUID(),
        transactionId: txHeader.id,
        childProfileId: command.childProfileId,
        accountType: 'available' as const,
        amount: available,
      },
      {
        id: crypto.randomUUID(),
        transactionId: txHeader.id,
        childProfileId: command.childProfileId,
        accountType: 'firstfruits' as const,
        amount: firstfruits,
      },
    ].filter((line) => line.amount !== 0)

    await tx.insert(ledgerLines).values(lines)

    return txHeader
  })
}

export async function postNegativeAdjustment(command: AdjustmentCommand) {
  return await db.transaction(async (tx) => {
    const availableBalance = await getBalance(command.childProfileId, 'available')

    if (command.amount > availableBalance) {
      throw new Error('Insufficient balance: adjustment amount exceeds available balance')
    }

    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,
        transactionType: 'negative_adjustment',
        initiatedByIdentityId: command.guardianIdentityId,
        note: JSON.stringify({
          reason: command.reason,
          restorationNote: command.restorationNote ?? null,
        }),
      })
      .returning()

    await tx.insert(ledgerLines).values({
      id: crypto.randomUUID(),
      transactionId: txHeader.id,
      childProfileId: command.childProfileId,
      accountType: 'available',
      amount: -command.amount,
    })

    return txHeader
  })
}

// Phase 11 — moves Kreds from the child's available balance into a savings
// goal: debits 'available' (real ledger line, auditable) and credits
// wishlistGoals.allocatedAmount in the same DB transaction. Flips the goal
// to 'achieved' when the running total reaches targetAmount.
export async function postGoalAllocation(command: GoalAllocationCommand) {
  return await db.transaction(async (tx) => {
    const availableBalance = await getBalance(command.childProfileId, 'available')
    if (command.amount > availableBalance) {
      throw new Error('Insufficient balance: allocation amount exceeds available balance')
    }

    const [goal] = await tx
      .select()
      .from(wishlistGoals)
      .where(
        and(
          eq(wishlistGoals.id, command.goalId),
          eq(wishlistGoals.childProfileId, command.childProfileId),
          eq(wishlistGoals.familyId, command.familyId),
          eq(wishlistGoals.status, 'active'),
        ),
      )
      .limit(1)

    if (!goal) {
      throw new Error('Goal not found or not active')
    }

    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,
        transactionType: 'goal_allocation',
        note: JSON.stringify({ goalId: command.goalId }),
      })
      .returning()

    await tx.insert(ledgerLines).values({
      id: crypto.randomUUID(),
      transactionId: txHeader.id,
      childProfileId: command.childProfileId,
      accountType: 'available',
      amount: -command.amount,
    })

    const newAllocated = goal.allocatedAmount + command.amount

    await tx
      .update(wishlistGoals)
      .set({
        allocatedAmount: newAllocated,
        status: newAllocated >= goal.targetAmount ? 'achieved' : 'active',
        updatedAt: new Date(),
      })
      .where(eq(wishlistGoals.id, command.goalId))

    return txHeader
  })
}

// Phase 11 — undoes an allocation: credits 'available' back and debits
// wishlistGoals.allocatedAmount. Lets a child correct a wrong goal or a
// wrong amount without a guardian in the loop — it's just moving Kreds
// between the child's own accounts, never creating or destroying value.
// Allowed on any goal status (including 'achieved'/'archived') since the
// child's Kreds don't stop being theirs to move just because a goal was
// archived or already hit its target; dropping below target un-achieves it.
export async function postGoalDeallocation(command: GoalAllocationCommand) {
  return await db.transaction(async (tx) => {
    const [goal] = await tx
      .select()
      .from(wishlistGoals)
      .where(
        and(
          eq(wishlistGoals.id, command.goalId),
          eq(wishlistGoals.childProfileId, command.childProfileId),
          eq(wishlistGoals.familyId, command.familyId),
        ),
      )
      .limit(1)

    if (!goal) {
      throw new Error('Goal not found')
    }
    if (command.amount > goal.allocatedAmount) {
      throw new Error('Insufficient goal balance: deallocation amount exceeds allocated amount')
    }

    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,
        transactionType: 'goal_allocation',
        note: JSON.stringify({ goalId: command.goalId, direction: 'deallocation' }),
      })
      .returning()

    await tx.insert(ledgerLines).values({
      id: crypto.randomUUID(),
      transactionId: txHeader.id,
      childProfileId: command.childProfileId,
      accountType: 'available',
      amount: command.amount,
    })

    const newAllocated = goal.allocatedAmount - command.amount

    await tx
      .update(wishlistGoals)
      .set({
        allocatedAmount: newAllocated,
        status: goal.status === 'achieved' && newAllocated < goal.targetAmount ? 'active' : goal.status,
        updatedAt: new Date(),
      })
      .where(eq(wishlistGoals.id, command.goalId))

    return txHeader
  })
}

export async function postReversal(command: ReversalCommand) {
  const [original] = await db
    .select({ familyId: ledgerTransactions.familyId })
    .from(ledgerTransactions)
    .where(eq(ledgerTransactions.id, command.correctsTransactionId))

  if (!original || original.familyId !== command.familyId) {
    throw new Error('cross_family_reversal_forbidden')
  }

  const originalLines = await db
    .select()
    .from(ledgerLines)
    .where(eq(ledgerLines.transactionId, command.correctsTransactionId))

  return await db.transaction(async (tx) => {
    const [txHeader] = await tx
      .insert(ledgerTransactions)
      .values({
        id: crypto.randomUUID(),
        familyId: command.familyId,
        childProfileId: command.childProfileId,
        commandId: command.commandId,
        transactionType: 'reversal',
        initiatedByIdentityId: command.guardianIdentityId,
        correctsTransactionId: command.correctsTransactionId,
        note: command.correctionNote,
      })
      .returning()

    const reversalLines = originalLines.map((line) => ({
      id: crypto.randomUUID(),
      transactionId: txHeader.id,
      childProfileId: command.childProfileId,
      accountType: line.accountType,
      amount: -line.amount,
    }))

    if (reversalLines.length > 0) {
      await tx.insert(ledgerLines).values(reversalLines)
    }

    return txHeader
  })
}
