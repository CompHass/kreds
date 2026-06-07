import 'server-only'

import { db } from '@/lib/db'
import { ledgerLines, ledgerTransactions } from '@/lib/db/schema/ledger'
import { calculateFirstfruits } from './calculate'
import type { AdjustmentCommand, EarningCommand, ReversalCommand } from './commands'

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

export async function postNegativeAdjustment(_command: AdjustmentCommand): Promise<never> {
  throw new Error('not implemented')
}

export async function postReversal(_command: ReversalCommand): Promise<never> {
  throw new Error('not implemented')
}
