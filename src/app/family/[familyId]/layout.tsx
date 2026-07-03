// T-08-06 mitigado: redireciona para /login sem sessão antes de qualquer dado da família renderizar.
// D-03: centraliza o auth gate — /tasks e /children compartilham este layout.
// D-04 / Pitfall 1: ParentSidebar/ParentTopbar/GuardianProfileDrawer NÃO estão aqui —
//   esses componentes ficam em cada page's próprio client view (ParentPanelView, ChildrenPanelView)
//   para que o estado do drawer seja page-local e não vaze entre rotas.

import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'

export default async function FamilyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ familyId: string }>
}) {
  // CRÍTICO: params é Promise no Next.js 15+ — await obrigatório
  const { familyId: _familyId } = await params
  const session = await auth()
  if (!session) redirect('/login')
  return <>{children}</>
}
