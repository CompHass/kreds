import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { hashPin, validatePinFormat } from '@/lib/families/child-pin'

type Params = { params: Promise<{ childId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { childId } = await params

  let ctx: Awaited<ReturnType<typeof requireCurrentFamilyContext>>
  try {
    ctx = await requireCurrentFamilyContext()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [child] = await db
    .select({ id: schema.childProfiles.id })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, childId),
        eq(schema.childProfiles.familyId, ctx.familyId),
        eq(schema.childProfiles.active, true),
      ),
    )
    .limit(1)

  if (!child) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : ''

  if (!validatePinFormat(pin)) {
    return NextResponse.json({ error: 'PIN deve ter 4 a 6 dígitos numéricos.' }, { status: 400 })
  }

  const pinHash = await hashPin(pin)

  await db
    .update(schema.childProfiles)
    .set({ pinHash, updatedAt: new Date() })
    .where(eq(schema.childProfiles.id, childId))

  return NextResponse.json({ ok: true })
}
