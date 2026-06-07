import { getGuardianLedgerHistory } from '@/modules/ledger/queries'

type GuardianHistoryPageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number) {
  return `${amount} Kreds`
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function formatNote(row: { transactionType: string; note: string | null }) {
  if (!row.note) return '—'

  if (row.transactionType !== 'negative_adjustment') {
    return row.note
  }

  try {
    const parsed = JSON.parse(row.note) as {
      reason?: string
      restorationNote?: string | null
    }

    return [parsed.reason, parsed.restorationNote].filter(Boolean).join(' • ') || row.note
  } catch {
    return row.note
  }
}

export default async function GuardianHistoryPage({ params }: GuardianHistoryPageProps) {
  const { childId } = await params
  const rows = await getGuardianLedgerHistory(childId, '')

  return (
    <main className="min-h-screen bg-amber-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Guardian Ledger History
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Detailed audit trail</h1>

        {rows.length === 0 ? (
          <p className="mt-6 text-base text-slate-600">Nenhuma transação registrada ainda.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {rows.map((row) => (
              <li key={row.lineId} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{row.transactionType}</p>
                    <p className="text-sm text-slate-600">{formatTimestamp(row.createdAt)}</p>
                  </div>
                  <p className="font-semibold text-slate-950">{formatKreds(row.amount)}</p>
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-500">Command ID</dt>
                    <dd>{`${row.commandId.slice(0, 8)}...`}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Transaction ID</dt>
                    <dd>{row.transactionId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Account Type</dt>
                    <dd>{row.accountType}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Line ID</dt>
                    <dd>{row.lineId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Corrects Transaction</dt>
                    <dd>{row.correctsTransactionId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Note</dt>
                    <dd>{formatNote(row)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
