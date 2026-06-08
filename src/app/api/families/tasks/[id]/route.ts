import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import {
  deactivateTaskTemplate,
  reactivateTaskTemplate,
  updateTaskTemplate,
} from '@/lib/db/tasks/commands'

/**
 * Zod schema for PATCH body validation.
 * action determines which command is called.
 */
const patchBodySchema = z.object({
  action: z.enum(['deactivate', 'reactivate', 'update']),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  kredsValue: z.coerce.number().int().positive().optional(),
})

/**
 * PATCH /api/families/tasks/:id
 *
 * Toggles activation state or updates fields of a task template.
 * Actions: deactivate | reactivate | update
 *
 * Security:
 * - T-04-09: Only guardians can deactivate/reactivate (role check)
 * - T-04-08: deactivateTaskTemplate/reactivateTaskTemplate always include familyId in WHERE —
 *   cross-family tampering affects 0 rows silently
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId, role: schema.familyMemberships.role })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found' }, { status: 400 })
  }

  // T-04-09: Only guardians can deactivate/reactivate/update task templates
  if (membership.role !== 'guardian') {
    return NextResponse.json(
      { error: 'Guardian role required to modify task templates' },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = patchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const { id: templateId } = await params

  try {
    switch (parsed.data.action) {
      case 'deactivate':
        // T-04-08: familyId in WHERE — cross-family update affects 0 rows silently
        await deactivateTaskTemplate(templateId, membership.familyId)
        break

      case 'reactivate':
        await reactivateTaskTemplate(templateId, membership.familyId)
        break

      case 'update':
        await updateTaskTemplate({
          id: templateId,
          familyId: membership.familyId,
          title: parsed.data.title,
          description: parsed.data.description,
          kredsValue: parsed.data.kredsValue,
        })
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update task template'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
