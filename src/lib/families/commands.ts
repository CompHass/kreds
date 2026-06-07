import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAuditEvent } from './audit'

/**
 * Input for the transactional family creation command.
 * Per D-01: authenticated guardian with no Kreds family creates the family tenant before child data.
 * Per D-03: family name and canonical IANA timezone required.
 * Per D-16: identity is keyed by ZITADEL sub, not mutable email.
 */
export interface CreateFamilyInput {
  zitadelSub: string
  email: string
  familyName: string
  timezone: string
}

export interface CreateFamilyResult {
  family: {
    id: string
    name: string
    timezone: string
  }
  identity: {
    id: string
    zitadelSub: string
    email: string
  }
  membership: {
    identityId: string
    familyId: string
    role: string
    status: string
  }
  redirectTo: string
}

/**
 * Transactional family creation: identity upsert, family creation, guardian membership,
 * and audit event in one Drizzle transaction (D-01, D-03, D-14-D-18).
 *
 * Creates or reuses the local Kreds identity keyed by ZITADEL sub.
 * Creates the family with canonical timezone.
 * Creates active guardian membership.
 * Writes sanitized audit event.
 *
 * Returns the composed result with redirectTo pointing to /family/children per D-04.
 *
 * @throws {Error} If zitadelSub is empty or family name is empty
 */
export async function createFamilyForGuardian(
  input: CreateFamilyInput,
): Promise<CreateFamilyResult> {
  if (!input.zitadelSub) {
    throw new Error('ZITADEL sub is required for family creation')
  }
  if (!input.familyName.trim()) {
    throw new Error('Family name is required')
  }

  return db.transaction(async (tx) => {
    // 1. Upsert local Kreds identity (create or reuse) keyed by ZITADEL sub
    const existingIdentities = await tx
      .select({ id: schema.identities.id })
      .from(schema.identities)
      .where(
        eq(schema.identities.zitadelSubject, input.zitadelSub),
      )
      .limit(1)

    let identityId: string
    if (existingIdentities.length > 0) {
      identityId = existingIdentities[0].id
    } else {
      const [newIdentity] = await tx
        .insert(schema.identities)
        .values({
          zitadelSubject: input.zitadelSub,
          email: input.email,
          emailVerified: true,
          displayName: input.email,
        })
        .returning({ id: schema.identities.id })
      identityId = newIdentity.id
    }

    // 2. Create the family with canonical timezone
    const [family] = await tx
      .insert(schema.families)
      .values({
        name: input.familyName.trim(),
        timezone: input.timezone,
        createdByIdentityId: identityId,
      })
      .returning({
        id: schema.families.id,
        name: schema.families.name,
        timezone: schema.families.timezone,
      })

    // 3. Create active guardian membership
    const [membership] = await tx
      .insert(schema.familyMemberships)
      .values({
        familyId: family.id,
        identityId: identityId,
        role: 'guardian',
        status: 'active',
      })
      .returning({
        identityId: schema.familyMemberships.identityId,
        familyId: schema.familyMemberships.familyId,
        role: schema.familyMemberships.role,
        status: schema.familyMemberships.status,
      })

    // 4. Write sanitized audit event (D-17, D-18)
    await createAuditEvent(
      {
        familyId: family.id,
        actorIdentityId: identityId,
        eventType: 'family.created',
        subjectType: 'family',
        subjectId: family.id,
        summary: `Family "${family.name}" created`,
        metadata: {
          timezone: input.timezone,
          guardianEmail: input.email,
        },
      },
      tx,
    )

    return {
      family: {
        id: family.id,
        name: family.name,
        timezone: family.timezone,
      },
      identity: {
        id: identityId,
        zitadelSub: input.zitadelSub,
        email: input.email,
      },
      membership: {
        identityId: membership.identityId!,
        familyId: membership.familyId,
        role: membership.role,
        status: membership.status,
      },
      redirectTo: '/family/children',
    }
  })
}
