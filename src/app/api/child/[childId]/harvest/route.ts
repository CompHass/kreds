import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema'
import { calculateFirstfruits } from '@/modules/ledger/calculate'
import { verifyChildSession } from '@/lib/families/child-session'
import { validateChildSessionScope } from '@/lib/auth/child-guard'

// Zod schema — rejects floats, zero, negative, and non-UUID commandId
const HarvestBodySchema = z.object({
  commandId: z.string().uuid('commandId must be a UUID'),
  totalAmount: z.number().int().positive('totalAmount must be a positive integer'),
  familyId: z.string().uuid('familyId must be a UUID'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  // CRITICAL: await params in Next.js 15+
  const { childId } = await params

  // Step 1: Read child-session cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('child-session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Verify JWT signature and expiry
  let session: { childProfileId: string; familyId: string; role: 'child' }
  try {
    session = await verifyChildSession(token)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 3: Ownership guard — child A cannot harvest for child B (T-06-10)
  if (!validateChildSessionScope(session, childId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  }

  // Step 4: Parse JSON body
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Step 5: Validate with Zod (rejects floats, zero, negative, non-UUID)
  const result = HarvestBodySchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }
  const { commandId, totalAmount } = result.data

  // Step 6: Calculate firstfruits split — 10% ceiling
  const firstfruits = calculateFirstfruits(totalAmount)
  const available = totalAmount - firstfruits

  // Step 7: Atomic write — catch 23505 OUTSIDE the transaction (T-06-11)
  try {
    const txn = await db.transaction(async (tx) => {
      // Insert ledger header — commandId has a unique index (idempotency at DB level)
      const [header] = await tx
        .insert(ledgerTransactions)
        .values({
          commandId,
          // SECURITY: Use session.familyId, not body.familyId — session is signed JWT (T-06-13)
          familyId: session.familyId,
          childProfileId: childId,
          transactionType: 'task_earning',
        })
        .returning()

      // Insert two ledger lines — available and firstfruits
      await tx.insert(ledgerLines).values([
        {
          transactionId: header.id,
          childProfileId: childId,
          accountType: 'available',
          amount: available,
        },
        {
          transactionId: header.id,
          childProfileId: childId,
          accountType: 'firstfruits',
          amount: firstfruits,
        },
      ])

      return header
    })

    return NextResponse.json(txn, { status: 201 })
  } catch (err: unknown) {
    // PostgreSQL unique violation — commandId already used (replay attack / double-click)
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json({ error: 'Already harvested' }, { status: 409 })
    }
    throw err
  }
}
