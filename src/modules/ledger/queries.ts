export async function getBalance(): Promise<number> {
  throw new Error('not implemented')
}

export async function getGuardianLedgerHistory(): Promise<
  Array<{ commandId: string; note: string | null; correctsTransactionId: string | null }>
> {
  throw new Error('not implemented')
}

export async function getChildLedgerHistory(): Promise<Array<Record<string, unknown>>> {
  throw new Error('not implemented')
}
