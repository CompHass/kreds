import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ledgerLines, ledgerTransactions } from '@/lib/db/schema/ledger'
import { calculateFirstfruits } from './calculate'
import type { AdjustmentCommand, EarningCommand, ReversalCommand } from './commands'
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
