// Phase 9 — Rota SSR /family/[familyId]/reports — mesma forma de children/page.tsx.
// Auth gate executado pelo layout.tsx compartilhado.
// ?cycle=YYYY-MM-DD seleciona o ciclo exibido; default é o ciclo atual.

import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ReportsPanelView } from '@/components/parent/reports-panel-view'
import { getFamilyWeeklyReport } from '@/lib/reports/queries'
import { getCurrentCycleStart, listRecentCycleStarts } from '@/lib/cycles/current-cycle'

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>
  searchParams: Promise<{ cycle?: string }>
}) {
  const { familyId } = await params
  const { cycle } = await searchParams
  const cycleStart = cycle ?? getCurrentCycleStart()

  const session = await auth()

  const [report, familyResult] = await Promise.all([
    getFamilyWeeklyReport(familyId, cycleStart),
    db.select({ name: families.name }).from(families).where(eq(families.id, familyId)),
  ])

  const familyName = familyResult[0]?.name ?? 'Família'

  return (
    <ReportsPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
      report={report}
      recentCycles={listRecentCycleStarts(8)}
    />
  )
}
