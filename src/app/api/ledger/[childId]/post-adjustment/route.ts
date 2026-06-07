import { NextResponse } from 'next/server'
import { AdjustmentCommandSchema } from '@/modules/ledger/commands'
import { postNegativeAdjustment } from '@/modules/ledger/engine'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params
  const body = await request.json()
  const parsed = AdjustmentCommandSchema.safeParse({
    ...body,
    childProfileId: childId,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const txHeader = await postNegativeAdjustment(parsed.data)
    return NextResponse.json({ data: txHeader }, { status: 201 })
  } catch (err: unknown) {
    const pgErr = err as { code?: string; constraint?: string; message?: string }

    if (pgErr.message?.includes('Insufficient balance')) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para este ajuste' },
        { status: 422 },
      )
    }

    if (pgErr.code === '23505' && pgErr.constraint?.includes('command_id')) {
      return NextResponse.json({ status: 'already_posted' }, { status: 409 })
    }

    throw err
  }
}
