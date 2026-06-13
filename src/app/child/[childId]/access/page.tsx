import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function ChildAccessRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { childId } = await params
  const { next } = await searchParams

  const [profile] = await db
    .select({ familyId: schema.childProfiles.familyId })
    .from(schema.childProfiles)
    .where(eq(schema.childProfiles.id, childId))
    .limit(1)

  if (!profile) {
    redirect('/')
  }

  const nextParam = next ? `?next=${encodeURIComponent(next)}` : ''
  redirect(`/family/access/${profile.familyId}${nextParam}`)
}
