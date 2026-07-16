import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { verifyChildSession } from '@/lib/families/child-session'
import { validateChildSessionScope } from '@/lib/auth/child-guard'
import { postGoalAllocation } from '@/modules/ledger/engine'

// Phase 11 — child allocates Kreds from their available balance into a
// savings goal. Same auth/idempotency pattern as harvest/route.ts:
// child-session cookie, ownership guard, commandId unique-index idempotency.

const AllocateBodySchema = z.object({
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

  const result = AllocateBodySchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const { commandId, amount } = result.data

  try {
    const txn = await postGoalAllocation({
      commandId,
      // SECURITY: familyId from the signed session, never from the body (T-06-13)
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
      return NextResponse.json({ error: 'Already allocated' }, { status: 409 })
    }
    if (err instanceof Error && err.message === 'Insufficient balance: allocation amount exceeds available balance') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'Goal not found or not active') {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    throw err
  }
}
