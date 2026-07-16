// Phase 10 — Rota SSR /family/[familyId]/settings — mesma forma de reports/page.tsx.
// Auth gate executado pelo layout.tsx compartilhado.
// Escopo desta fase: apenas nome da família (D-recommended). Dia de início do
// ciclo semanal e notificações ficam fora — ver ROADMAP.md Fase 10.

import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsPanelView } from '@/components/parent/settings-panel-view'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const session = await auth()

  const familyResult = await db
    .select({ name: families.name })
    .from(families)
    .where(eq(families.id, familyId))

  const familyName = familyResult[0]?.name ?? 'Família'

  return (
    <SettingsPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
    />
  )
}
