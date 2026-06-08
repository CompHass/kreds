import { NextRequest, NextResponse } from 'next/server'
import { requireCurrentFamilyContext, requireChildInFamily } from '@/lib/auth/family-context'
import { allocateTowardGoal } from '@/modules/goals/engine'

type Params = { params: Promise<{ childId: string; goalId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { childId, goalId } = await params

  let ctx: Awaited<ReturnType<typeof requireCurrentFamilyContext>>
  try {
    ctx = await requireCurrentFamilyContext()
    await requireChildInFamily(childId, ctx.familyId)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const amount = typeof body?.amount === 'number' ? body.amount : 0

  if (!Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
  }

  try {
    const goal = await allocateTowardGoal({
      goalId,
      familyId: ctx.familyId,
      childProfileId: childId,
      guardianIdentityId: ctx.kredsIdentityId,
      amount,
    })
    return NextResponse.json(goal)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error'
    if (msg === 'goal_not_found') return NextResponse.json({ error: 'Sonho não encontrado.' }, { status: 404 })
    if (msg === 'amount_exceeds_remaining') return NextResponse.json({ error: 'Valor excede o restante do sonho.' }, { status: 422 })
    if (msg === 'insufficient_balance') return NextResponse.json({ error: 'Saldo disponível insuficiente.' }, { status: 422 })
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
