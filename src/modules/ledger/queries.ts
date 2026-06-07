import { and, eq, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ledgerLines } from '@/lib/db/schema/ledger'

export type LedgerAccountType = 'available' | 'firstfruits'

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

export async function getGuardianLedgerHistory(): Promise<
  Array<{ commandId: string; note: string | null; correctsTransactionId: string | null }>
> {
  throw new Error('not implemented')
}

export async function getChildLedgerHistory(): Promise<Array<Record<string, unknown>>> {
  throw new Error('not implemented')
}
