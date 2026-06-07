import { NextResponse } from 'next/server'
import {
  getChildLedgerHistory,
  getGuardianLedgerHistory,
} from '@/modules/ledger/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params
  const { searchParams } = new URL(request.url)
  const requestedView = searchParams.get('view')
  const view = requestedView === 'guardian' ? 'guardian' : 'child'
  // TODO: replace placeholder family scope with authenticated session family_id.
  const familyId = request.headers.get('x-family-id') ?? searchParams.get('family_id') ?? ''

  const data =
    view === 'guardian'
      ? await getGuardianLedgerHistory(childId, familyId)
      : await getChildLedgerHistory(childId, familyId)

  return NextResponse.json({ data, view }, { status: 200 })
}
