import { NextRequest, NextResponse } from 'next/server'
import { requireCurrentFamilyContext, requireChildInFamily } from '@/lib/auth/family-context'
import { listGoals } from '@/modules/goals/queries'
import { createGoal } from '@/modules/goals/engine'

type Params = { params: Promise<{ childId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { childId } = await params

  let ctx: Awaited<ReturnType<typeof requireCurrentFamilyContext>>
  try {
    ctx = await requireCurrentFamilyContext()
    await requireChildInFamily(childId, ctx.familyId)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const goals = await listGoals(childId, ctx.familyId)
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { childId } = await params

  let ctx: Awaited<ReturnType<typeof requireCurrentFamilyContext>>
  try {
    ctx = await requireCurrentFamilyContext()
    await requireChildInFamily(childId, ctx.familyId)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const targetAmount = typeof body?.targetAmount === 'number' ? body.targetAmount : 0

  if (!title || title.length > 100) {
    return NextResponse.json({ error: 'Título inválido (1-100 caracteres).' }, { status: 400 })
  }
  if (!Number.isInteger(targetAmount) || targetAmount < 1 || targetAmount > 99999) {
    return NextResponse.json({ error: 'Valor alvo inválido (1-99999 Kreds).' }, { status: 400 })
  }

  const goal = await createGoal({
    familyId: ctx.familyId,
    childProfileId: childId,
    title,
    targetAmount,
  })

  return NextResponse.json(goal, { status: 201 })
}
