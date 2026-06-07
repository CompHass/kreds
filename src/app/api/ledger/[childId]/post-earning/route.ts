import { NextResponse } from 'next/server'
import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { EarningCommandSchema } from '@/modules/ledger/commands'
import { postEarning } from '@/modules/ledger/engine'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params
  const body = await request.json()

  try {
    const { familyId, kredsIdentityId, role } = await requireCurrentFamilyContext()

    if (role !== 'guardian') {
      return NextResponse.json({ error: 'Guardian role required' }, { status: 403 })
    }

    await requireChildInFamily(childId, familyId)

    const parsed = EarningCommandSchema.safeParse({
      ...body,
      familyId,
      guardianIdentityId: kredsIdentityId,
      childProfileId: childId,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const txHeader = await postEarning(parsed.data)
    return NextResponse.json({ data: txHeader }, { status: 201 })
  } catch (err: unknown) {
    const knownErr = err as { code?: string; constraint?: string; message?: string }

    if (
      knownErr.message === 'Authentication required' ||
      knownErr.message?.startsWith('Authentication required') ||
      knownErr.message?.startsWith('No Kreds identity found')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (knownErr.message === 'No active family membership found') {
      return NextResponse.json({ error: 'No active family found' }, { status: 403 })
    }

    if (knownErr.message === 'Child profile not found in current family') {
      return NextResponse.json({ error: 'Child profile not found' }, { status: 404 })
    }

    if (knownErr.code === '23505' && knownErr.constraint?.includes('command_id')) {
      return NextResponse.json({ status: 'already_posted' }, { status: 409 })
    }

    throw err
  }
}
