import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  await params
  const { searchParams } = new URL(request.url)
  const requestedView = searchParams.get('view')
  const view = requestedView === 'guardian' ? 'guardian' : 'child'

  // TODO Plano 04: implementar queries reais getGuardianLedgerHistory / getChildLedgerHistory.
  return NextResponse.json({ data: [], view }, { status: 200 })
}
