import { requireChildSession } from '@/lib/auth/child-guard'
import { redirect } from 'next/navigation'
import NewGoalForm from './NewGoalForm'

type NewGoalPageProps = {
  params: Promise<{ childId: string }>
}

export default async function NewGoalPage({ params }: NewGoalPageProps) {
  const { childId } = await params

  const session = await requireChildSession()
  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/new-goal`)
  }

  return <PageContent childId={childId} />
}

function PageContent({ childId }: { childId: string }) {
  return <NewGoalForm childId={childId} />
}
