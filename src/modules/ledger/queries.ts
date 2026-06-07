import { and, desc, eq, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ledgerLines, ledgerTransactions } from '@/lib/db/schema/ledger'

export type LedgerAccountType = 'available' | 'firstfruits'

export type GuardianLedgerHistoryRow = {
  transactionId: string
  commandId: string
  transactionType: 'task_earning' | 'negative_adjustment' | 'reversal' | 'donation_match'
  note: string | null
  correctsTransactionId: string | null
  createdAt: Date
  lineId: string
  accountType: LedgerAccountType
  amount: number
}

export type ChildLedgerHistoryRow = {
  transactionId: string
  transactionType: 'task_earning' | 'negative_adjustment' | 'reversal' | 'donation_match'
  createdAt: Date
  lineId: string
  accountType: LedgerAccountType
  amount: number
}

export async function getBalance(
  childProfileId: string,
  accountType: LedgerAccountType,
): Promise<number> {
  const result = await db
    .select({ total: sum(ledgerLines.amount) })
    .from(ledgerLines)
    .where(
      and(
        eq(ledgerLines.childProfileId, childProfileId),
        eq(ledgerLines.accountType, accountType),
      ),
    )

  return Number(result[0]?.total ?? 0)
}

export async function getGuardianLedgerHistory(
  childProfileId: string,
  familyId: string,
): Promise<GuardianLedgerHistoryRow[]> {
  return (await db
    .select({
      transactionId: ledgerTransactions.id,
      commandId: ledgerTransactions.commandId,
      transactionType: ledgerTransactions.transactionType,
      note: ledgerTransactions.note,
      correctsTransactionId: ledgerTransactions.correctsTransactionId,
      createdAt: ledgerTransactions.createdAt,
      lineId: ledgerLines.id,
      accountType: ledgerLines.accountType,
      amount: ledgerLines.amount,
    })
    .from(ledgerTransactions)
    .leftJoin(ledgerLines, eq(ledgerLines.transactionId, ledgerTransactions.id))
    .where(
      and(
        eq(ledgerTransactions.childProfileId, childProfileId),
        eq(ledgerTransactions.familyId, familyId),
      ),
    )
    .orderBy(desc(ledgerTransactions.createdAt))) as GuardianLedgerHistoryRow[]
}

export async function getChildLedgerHistory(
  childProfileId: string,
  familyId: string,
): Promise<ChildLedgerHistoryRow[]> {
  return (await db
    .select({
      transactionId: ledgerTransactions.id,
      transactionType: ledgerTransactions.transactionType,
      createdAt: ledgerTransactions.createdAt,
      lineId: ledgerLines.id,
      accountType: ledgerLines.accountType,
      amount: ledgerLines.amount,
    })
    .from(ledgerTransactions)
    .leftJoin(ledgerLines, eq(ledgerLines.transactionId, ledgerTransactions.id))
    .where(
      and(
        eq(ledgerTransactions.childProfileId, childProfileId),
        eq(ledgerTransactions.familyId, familyId),
      ),
    )
    .orderBy(desc(ledgerTransactions.createdAt))) as ChildLedgerHistoryRow[]
}
