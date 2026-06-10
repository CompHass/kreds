import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getChildSession } from '@/lib/families/child-session'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params
    const cookieStore = await cookies()
    const session = await getChildSession(cookieStore)

    // Auth guard: verify session and childId match
    if (!session || session.childProfileId !== childId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const { targetLabel, amountKreds } = body as Record<string, unknown>

    // Validate targetLabel
    if (
      !targetLabel ||
      typeof targetLabel !== 'string' ||
      targetLabel.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'targetLabel obrigatório' },
        { status: 400 },
      )
    }

    // Validate amountKreds
    const amount = parseInt(String(amountKreds), 10)
    if (!Number.isInteger(amount) || amount < 1) {
      return NextResponse.json(
        { error: 'amountKreds deve ser inteiro positivo' },
        { status: 400 },
      )
    }

    // Insert donation
    await db.insert(schema.donations).values({
      familyId: session.familyId,
      childProfileId: session.childProfileId,
      targetLabel: targetLabel.trim(),
      amountKreds: amount,
      status: 'pending',
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating donation:', error)
    return NextResponse.json(
      { error: 'Erro ao processar doação' },
      { status: 500 },
    )
  }
}
