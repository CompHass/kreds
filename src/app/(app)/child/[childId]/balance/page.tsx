import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getBalance } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'

type ChildBalancePageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number): string {
  return `${amount} Kreds`
}

export default async function ChildBalancePage({ params }: ChildBalancePageProps) {
  const { childId } = await params

  try {
    const { familyId } = await requireCurrentFamilyContext()
    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  const [available, firstfruits] = await Promise.all([
    getBalance(childId, 'available'),
    getBalance(childId, 'firstfruits'),
  ])

  return (
    <main className="min-h-screen bg-emerald-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Kreds Balance
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Your stewardship is growing
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Keep completing responsibilities with care and watch your progress grow.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl bg-emerald-100 p-5">
            <p className="text-sm font-medium text-emerald-800">
              Your Available Kreds
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-950">
              {formatKreds(available)}
            </p>
          </article>

          <article className="rounded-2xl bg-amber-100 p-5">
            <p className="text-sm font-medium text-amber-800">Your Firstfruits</p>
            <p className="mt-2 text-3xl font-bold text-amber-950">
              {formatKreds(firstfruits)}
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
