import { getChildLedgerHistory } from '@/modules/ledger/queries'

type ChildHistoryPageProps = {
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

function getChildLabel(row: Awaited<ReturnType<typeof getChildLedgerHistory>>[number]) {
  if (row.transactionType === 'reversal') {
    return 'Correção aplicada'
  }

  if (row.transactionType === 'task_earning' && row.accountType === 'available') {
    return `You earned ${row.amount} Kreds`
  }

  if (row.transactionType === 'task_earning' && row.accountType === 'firstfruits') {
    return `${row.amount} Kreds were set aside for your Firstfruits`
  }

  if (row.transactionType === 'negative_adjustment') {
    return `Ajuste de ${formatKreds(Math.abs(row.amount) * -1)} registrado`
  }

  return `${row.amount >= 0 ? '+' : ''}${formatKreds(row.amount)}`
}

export default async function ChildHistoryPage({ params }: ChildHistoryPageProps) {
  const { childId } = await params
  const rows = await getChildLedgerHistory(childId, '')

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Your Kreds History
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">See how your Kreds grew</h1>

        {rows.length === 0 ? (
          <p className="mt-6 text-base text-slate-600">Seu histórico de Kreds aparecerá aqui.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {rows.map((row) => (
              <li key={row.lineId} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{getChildLabel(row)}</p>
                    <p className="text-sm text-slate-600">{formatTimestamp(row.createdAt)}</p>
                  </div>
                  <p className="font-semibold text-slate-950">{formatKreds(row.amount)}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600">{row.accountType}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
