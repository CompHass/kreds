import { getBalance } from '@/modules/ledger/queries'
import AdjustmentFormClient from './AdjustmentFormClient'

type GuardianAdjustmentPageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number): string {
  return `${amount} Kreds`
}

export default async function GuardianAdjustmentPage({ params }: GuardianAdjustmentPageProps) {
  const { childId } = await params
  const availableBalance = await getBalance(childId, 'available')

  return (
    <main className="min-h-screen bg-amber-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Guardian Ledger
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Registrar Ajuste para {childId}
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Saldo atual: {formatKreds(availableBalance)}
        </p>

        <AdjustmentFormClient childId={childId} />
      </section>
    </main>
  )
}
