import { NextResponse } from 'next/server'
import { EarningCommandSchema } from '@/modules/ledger/commands'
import { postEarning } from '@/modules/ledger/engine'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params
  const body = await request.json()
  const parsed = EarningCommandSchema.safeParse({
    ...body,
    childProfileId: childId,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const txHeader = await postEarning(parsed.data)
    return NextResponse.json({ data: txHeader }, { status: 201 })
  } catch (err: unknown) {
    const pgErr = err as { code?: string; constraint?: string }
    if (pgErr.code === '23505' && pgErr.constraint?.includes('command_id')) {
      return NextResponse.json({ status: 'already_posted' }, { status: 409 })
    }

    throw err
  }
}
