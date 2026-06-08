/**
 * GET /api/families/tasks — list task templates for the authenticated guardian's family.
 * POST /api/families/tasks — create a new task template.
 *
 * Security:
 * - T-04-04: family_id always derived from Auth.js session (membership.familyId); never from client.
 * - T-04-05: Zod validates kredsValue as integer and positive before DB write.
 * - T-04-06: requireAuthenticatedIdentity + guardian role check in membership lookup.
 * - T-04-07: POST requires Content-Type: application/json to reject CSRF via form encoding.
 */
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
 * Returns active task templates by default.
 * With ?showInactive=true, returns all templates for audit purposes (D-07).
 *
 * Responses:
 * - 200: JSON array of task templates
 * - 401: Not authenticated
 * - 400: No family membership found
 */
export async function GET(request: NextRequest) {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Resolve Kreds UUID from ZITADEL sub
  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Derive family_id from authenticated session — T-04-04
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
    return NextResponse.json(
      { error: 'No family found. Create a family first.' },
      { status: 400 },
    )
  }

  const familyId = membership.familyId

  // D-07: ?showInactive=true returns all templates for audit toggle
  const showInactive = request.nextUrl.searchParams.get('showInactive') === 'true'
  const tasks = showInactive
    ? await getAllTasksForFamily(familyId)
    : await getActiveTasksForFamily(familyId)

  return NextResponse.json(tasks)
}

/**
 * POST /api/families/tasks
 *
 * Creates a new task template for the authenticated guardian's family.
 *
 * Body JSON: { title, description?, assignedChildId, kredsValue }
 *
 * Responses:
 * - 201: { id } — template created
 * - 400: Validation error or child not in family
 * - 401: Not authenticated
 * - 415: Content-Type not application/json (T-04-07 CSRF guard)
 */
export async function POST(request: NextRequest) {
  // T-04-07: Reject non-JSON content types to prevent CSRF via HTML form encoding
  if (!request.headers.get('content-type')?.includes('application/json')) {
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

  // Resolve Kreds UUID from ZITADEL sub
  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Derive family_id from authenticated session — T-04-04, T-04-06
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
    return NextResponse.json(
      { error: 'No family found. Create a family first.' },
      { status: 400 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // T-04-05: Zod validation — rejects floats, negatives, zero for kredsValue
  const parsed = taskTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    // Always use family_id from session — never from the request body (T-04-04)
    const result = await createTaskTemplate({
      familyId: membership.familyId,
      assignedChildId: parsed.data.assignedChildId,
      title: parsed.data.title,
      description: parsed.data.description,
      kredsValue: parsed.data.kredsValue,
    })

    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task template'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
