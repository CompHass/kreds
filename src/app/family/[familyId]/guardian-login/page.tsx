// Phase 13 — Guardian step-up PIN entry. Server component.
// Rota pública no middleware (GUARDIAN_STEPUP_PATH), mas chamamos auth() aqui
// para exigir a base identity (next-auth/Zitadel) — sem login base, não há como
// validar membership, então mandamos ao /login.
//
// Se a família ainda não tem guardian_pin_hash, redirecionamos ao setup forçado
// (decisão do usuário: PIN exigido no 1º acesso ao painel).

import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { GuardianPinScreen } from '@/components/auth/guardian-pin-screen'
import { resolveGuardianMembership } from '@/lib/auth/guardian-membership'

export default async function GuardianLoginPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Defesa em profundidade: mesmo nesta rota pública, só um guardião ativo da
  // família deve ver o formulário de PIN. Outros usuários logados são mandados
  // embora — não revelamos a existência do fluxo.
  const membership = await resolveGuardianMembership(session.user.id, familyId)
  if (!membership) redirect('/login')

  const [family] = await db
    .select({ guardianPinHash: families.guardianPinHash })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1)

  // Sem PIN cadastrado → 1º acesso forçado ao setup.
  if (!family?.guardianPinHash) {
    redirect(`/family/${familyId}/guardian-setup`)
  }

  return (
    <main>
      <GuardianPinScreen familyId={familyId} guardianName={session.user?.name ?? 'Responsável'} />
    </main>
  )
}
