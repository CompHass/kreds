// Phase 9 — Rota SSR /family/[familyId]/reports — mesma forma de children/page.tsx.
// Auth gate executado pelo layout.tsx compartilhado.
// ?cycle=YYYY-MM-DD seleciona o ciclo exibido; default é o ciclo atual.
// Phase 10: cycleStartDay da família decide onde a semana começa — precisa
// ser lido antes de calcular o ciclo default e a lista de ciclos recentes.

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

  const [session, familyResult] = await Promise.all([
    auth(),
    db.select({ name: families.name, cycleStartDay: families.cycleStartDay }).from(families).where(eq(families.id, familyId)),
  ])

  const cycleStartDay = familyResult[0]?.cycleStartDay ?? 0
  const cycleStart = cycle ?? getCurrentCycleStart(cycleStartDay)

  const report = await getFamilyWeeklyReport(familyId, cycleStart)

  const familyName = familyResult[0]?.name ?? 'Família'

  return (
    <ReportsPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
      report={report}
      recentCycles={listRecentCycleStarts(8, cycleStartDay)}
      currentCycleStart={getCurrentCycleStart(cycleStartDay)}
    />
  )
}
