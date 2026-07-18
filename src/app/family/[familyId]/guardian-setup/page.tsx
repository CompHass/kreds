// Phase 13 — Guardian first-time PIN setup. Server component.
// Rota pública no middleware (GUARDIAN_STEPUP_PATH). auth() exigido: sem base
// identity, não há como validar membership → /login. Ação sensível (definir o
// hash do PIN da família) vive em guardian-pin.ts e re-confirma membership.

import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { resolveGuardianMembership } from '@/lib/auth/guardian-membership'
import { GuardianSetupScreen } from '@/components/auth/guardian-setup-screen'

export default async function GuardianSetupPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await resolveGuardianMembership(session.user.id, familyId)
  if (!membership) redirect('/login')

  return (
    <main>
      <GuardianSetupScreen familyId={familyId} />
    </main>
  )
}
