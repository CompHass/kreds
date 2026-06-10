import { redirect } from 'next/navigation'
import { requireChildSession } from '@/lib/auth/child-guard'

export const dynamic = 'force-dynamic'

export default async function ChildHomePage() {
  const session = await requireChildSession()
  redirect(`/child/${session.childProfileId}/dashboard`)
}
