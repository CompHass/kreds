import { NextResponse, NextRequest } from 'next/server'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { taskTemplateSchema } from '@/lib/db/tasks/schema'
import { createTaskTemplate } from '@/lib/db/tasks/commands'
import { getActiveTasksForFamily, getAllTasksForFamily } from '@/lib/db/tasks/queries'

/**
 * GET /api/families/tasks
 *
 * Returns task templates for the authenticated guardian's family.
 * Query param: ?showInactive=true returns all templates (D-07).
 * Default: returns only active templates.
 */
export async function GET(request: NextRequest) {
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
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.role, 'guardian'),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found.' }, { status: 400 })
  }

  const showInactive = request.nextUrl.searchParams.get('showInactive') === 'true'
  const tasks = showInactive
    ? await getAllTasksForFamily(membership.familyId)
    : await getActiveTasksForFamily(membership.familyId)

  return NextResponse.json(tasks)
}

/**
 * POST /api/families/tasks
 *
 * Creates a new task template for the guardian's family.
 * Body: { title, description?, assignedChildId, kredsValue }
 * Returns 201 + { id } on success.
 *
 * Security:
 * - T-04-06: Only guardians can create templates
 * - T-04-07: Enforces Content-Type: application/json (rejects HTML form submissions)
 * - T-04-03: createTaskTemplate validates assignedChildId belongs to this family
 * - T-04-05: Zod rejects floats/negatives before DB write
 */
export async function POST(request: NextRequest) {
  // T-04-07: Content-Type guard — reject HTML form encoding
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 },
    )
  }

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

  // T-04-06: Only active guardians can create templates
  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.role, 'guardian'),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) {
    return NextResponse.json({ error: 'No family found. Create a family first.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // T-04-05: Zod validation rejects floats, negatives, zero, missing fields
  const parsed = taskTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    // T-04-03: createTaskTemplate validates assignedChildId belongs to this family
    const result = await createTaskTemplate({
      familyId: membership.familyId, // Never trust client-supplied familyId
      ...parsed.data,
    })
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task template'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
