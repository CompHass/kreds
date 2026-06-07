import { NextResponse } from 'next/server'
import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import {
  getChildLedgerHistory,
  getGuardianLedgerHistory,
} from '@/modules/ledger/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params
    const { searchParams } = new URL(request.url)
    const requestedView = searchParams.get('view')
    const view = requestedView === 'guardian' ? 'guardian' : 'child'
    const { familyId, role } = await requireCurrentFamilyContext()

    if (view === 'guardian' && role !== 'guardian') {
      return NextResponse.json({ error: 'Guardian role required' }, { status: 403 })
    }

    await requireChildInFamily(childId, familyId)

    const data =
      view === 'guardian'
        ? await getGuardianLedgerHistory(childId, familyId)
        : await getChildLedgerHistory(childId, familyId)

    return NextResponse.json({ data, view }, { status: 200 })
  } catch (err: unknown) {
    const knownErr = err as { message?: string }

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

    throw err
  }
}
