// Phase 10 — Rota SSR /family/[familyId]/settings — mesma forma de reports/page.tsx.
// Auth gate executado pelo layout.tsx compartilhado.
// Nome da família, dia de início do ciclo semanal e preferências de
// notificação (sem canal de envio ainda — ver notificationPreferences).

import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { families, notificationPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsPanelView } from '@/components/parent/settings-panel-view'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params

  const [session, familyResult, prefsResult] = await Promise.all([
    auth(),
    db
      .select({ name: families.name, cycleStartDay: families.cycleStartDay })
      .from(families)
      .where(eq(families.id, familyId)),
    db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.familyId, familyId))
      .limit(1),
  ])

  const familyName = familyResult[0]?.name ?? 'Família'
  const cycleStartDay = familyResult[0]?.cycleStartDay ?? 0
  const prefs = prefsResult[0]

  return (
    <SettingsPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
      cycleStartDay={cycleStartDay}
      notificationPreferences={{
        taskCompleted: prefs?.taskCompleted ?? true,
        goalAchieved: prefs?.goalAchieved ?? true,
        weeklyReportReady: prefs?.weeklyReportReady ?? true,
      }}
    />
  )
}
