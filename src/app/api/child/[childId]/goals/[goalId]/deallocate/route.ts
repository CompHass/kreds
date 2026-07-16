import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { verifyChildSession } from '@/lib/families/child-session'
import { validateChildSessionScope } from '@/lib/auth/child-guard'
import { postGoalDeallocation } from '@/modules/ledger/engine'

// Phase 11 — lets the child undo an allocation (wrong goal or wrong amount):
// credits Kreds back to available and debits the goal. Same auth/idempotency
// pattern as allocate/route.ts.

const DeallocateBodySchema = z.object({
  commandId: z.string().uuid('commandId must be a UUID'),
  amount: z.number().int().positive('amount must be a positive integer'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string; goalId: string }> },
) {
  const { childId, goalId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('child-session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let session: { childProfileId: string; familyId: string; role: 'child' }
  try {
    session = await verifyChildSession(token)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!validateChildSessionScope(session, childId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const result = DeallocateBodySchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const { commandId, amount } = result.data

  try {
    const txn = await postGoalDeallocation({
      commandId,
      familyId: session.familyId,
      childProfileId: childId,
      goalId,
      amount,
    })
    return NextResponse.json(txn, { status: 201 })
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json({ error: 'Already deallocated' }, { status: 409 })
    }
    if (err instanceof Error && err.message.startsWith('Insufficient goal balance')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'Goal not found') {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    throw err
  }
}
