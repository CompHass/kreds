// T-08-06 mitigado: redireciona para /login sem sessão antes de qualquer dado da família renderizar.
// D-03: centraliza o auth gate — /tasks e /children compartilham este layout.
// D-04 / Pitfall 1: ParentSidebar/ParentTopbar/GuardianProfileDrawer NÃO estão aqui —
//   esses componentes ficam em cada page's próprio client view (ParentPanelView, ChildrenPanelView)
//   para que o estado do drawer seja page-local e não vaze entre rotas.
//
// Phase 13: defense-in-depth authorization. O middleware já exige um
// guardian-session JWT com familyId casando a URL, mas este layout re-valida
// no nível server-component que o usuário autenticado é mesmo um guardião ATIVO
// daquela família. Fecha acesso direto mesmo se o middleware for绕ado (ex.: um
// bug que deixe um token passar sem validar escopo). Não confiar apenas em
// camada de borda.

import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { resolveGuardianMembership } from '@/lib/auth/guardian-membership'

export default async function FamilyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ familyId: string }>
}) {
  // CRÍTICO: params é Promise no Next.js 15+ — await obrigatório
  const { familyId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await resolveGuardianMembership(session.user.id, familyId)
  if (!membership) {
    // Não é guardião ativo desta família — não vaza a existência da rota.
    redirect('/login')
  }

  return <>{children}</>
}
