import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { PinScreen } from '@/components/auth/pin-screen'

export default async function ChildLoginPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params

  const [child] = await db
    .select({
      displayName: childProfiles.displayName,
      familyId: childProfiles.familyId,
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.active, true)))
    .limit(1)

  if (!child) {
    notFound()
  }

  return (
    <main>
      <PinScreen
        childId={childId}
        familyId={child.familyId}
        displayName={child.displayName}
      />
    </main>
  )
}
