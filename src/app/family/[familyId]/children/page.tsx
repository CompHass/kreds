// D-01: Rota SSR /family/[familyId]/children — mesma forma de tasks/page.tsx.
// Server Component — auth gate executado pelo layout.tsx compartilhado (D-02/D-03, T-08-06).
// Query childProfiles SEM filtro active=true — crianças desativadas devem continuar
// aparecendo na lista (D-14 é o alvo do toggle de reativação).
// T-08-14: nunca envia pinHash/pinEncrypted ao cliente — apenas hasEncryptedPin derivado.

import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ChildrenPanelView } from '@/components/parent/children-panel-view'
import type { ChildProfileView } from '@/types/child'

export default async function ChildrenPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  // CRÍTICO: params é Promise no Next.js 15+ — await obrigatório
  const { familyId } = await params

  // Auth gate executado pelo layout.tsx pai — auth() aqui é somente para
  // obter session.user?.name / email (não faz redirect).
  const session = await auth()

  // Queries paralelas: childProfiles (SEM filtro active) + nome da família
  const [children, familyResult] = await Promise.all([
    db
      .select({
        id: childProfiles.id,
        displayName: childProfiles.displayName,
        ageYears: childProfiles.ageYears,
        accentColor: childProfiles.accentColor,
        active: childProfiles.active,
        pinEncrypted: childProfiles.pinEncrypted,
      })
      .from(childProfiles)
      .where(eq(childProfiles.familyId, familyId)),

    db
      .select({ name: families.name })
      .from(families)
      .where(eq(families.id, familyId)),
  ])

  const familyName = familyResult[0]?.name ?? 'Família'

  // Mapeia rows do banco para ChildProfileView — T-08-14: pinEncrypted NUNCA
  // sai deste escopo, apenas o booleano derivado hasEncryptedPin.
  const initialChildren: ChildProfileView[] = children.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    ageYears: c.ageYears,
    accentColor: c.accentColor,
    active: c.active,
    hasEncryptedPin: c.pinEncrypted !== null,
  }))

  return (
    <ChildrenPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
      initialChildren={initialChildren}
    />
  )
}
