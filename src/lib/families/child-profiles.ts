import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createAuditEvent } from './audit'
import { isValidAvatarPreset, isValidAccentColor } from './avatar-presets'
import { hashPin, validatePinFormat } from './child-pin'

// Types

export interface CreateChildProfileInput {
  familyId: string
  guardianIdentityId: string
  displayName: string
  ageYears: number
  avatarPreset: string
  accentColor: string
  pin?: string
  consentGiven: boolean
}

export interface UpdateChildProfileVisualsInput {
  childProfileId: string
  familyId: string
  guardianIdentityId: string
  displayName?: string
  avatarPreset?: string
  accentColor?: string
  pin?: string
}

export interface ChildProfile {
  id: string
  familyId: string
  displayName: string
  ageYears: number
  avatarPreset: string
  accentColor: string
  active: boolean
}

/**
 * Creates a child profile under parental consent (FAM-03, D-02, D-09, D-11).
 *
 * Validates the closed avatar/accent sets, writes consent + profile + audit
 * in one Drizzle transaction. Returns the created child profile.
 *
 * @throws {Error} If consent is not given, display name is empty, age is out of range,
 *   or avatar/accent are outside the closed sets.
 */
export async function createChildProfile(
  input: CreateChildProfileInput,
): Promise<ChildProfile> {
  if (!input.consentGiven) {
    throw new Error('Explicit parental consent is required before creating a child profile (D-02)')
  }
  if (!input.displayName.trim()) {
    throw new Error('Child display name is required')
  }
  if (!Number.isInteger(input.ageYears) || input.ageYears < 0 || input.ageYears > 120) {
    throw new Error('Age in years must be a valid integer between 0 and 120 (D-09)')
  }
  if (!isValidAvatarPreset(input.avatarPreset)) {
    throw new Error(`Invalid avatar preset: ${input.avatarPreset} (D-19)`)
  }
  if (!isValidAccentColor(input.accentColor)) {
    throw new Error(`Invalid accent color: ${input.accentColor} (D-22)`)
  }
  if (input.pin !== undefined && !validatePinFormat(input.pin)) {
    throw new Error('PIN must have 4 to 6 numeric digits')
  }

  return db.transaction(async (tx) => {
    // 1. Verify the guardian is an active guardian of this family
    const [membership] = await tx
      .select({ id: schema.familyMemberships.id })
      .from(schema.familyMemberships)
      .where(
        and(
          eq(schema.familyMemberships.familyId, input.familyId),
          eq(schema.familyMemberships.identityId, input.guardianIdentityId),
          eq(schema.familyMemberships.role, 'guardian'),
          eq(schema.familyMemberships.status, 'active'),
        ),
      )
      .limit(1)

    if (!membership) {
      throw new Error('Only an active guardian can create a child profile')
    }

    const pinHash = input.pin ? await hashPin(input.pin) : null

    // 2. Create the child profile
    const [profile] = await tx
      .insert(schema.childProfiles)
      .values({
        familyId: input.familyId,
        displayName: input.displayName.trim(),
        ageYears: input.ageYears,
        avatarPreset: input.avatarPreset,
        accentColor: input.accentColor,
        pinHash,
        active: true,
      })
      .returning({
        id: schema.childProfiles.id,
        familyId: schema.childProfiles.familyId,
        displayName: schema.childProfiles.displayName,
        ageYears: schema.childProfiles.ageYears,
        avatarPreset: schema.childProfiles.avatarPreset,
        accentColor: schema.childProfiles.accentColor,
        active: schema.childProfiles.active,
      })

    // 3. Create child membership record
    await tx.insert(schema.familyMemberships).values({
      familyId: input.familyId,
      childProfileId: profile.id,
      role: 'child',
      status: 'active',
    })

    // 4. Record parental consent evidence (D-02, D-13)
    await tx.insert(schema.parentalConsents).values({
      familyId: input.familyId,
      guardianIdentityId: input.guardianIdentityId,
      consentType: 'child_profile_creation',
      source: 'guardian_consent_checkbox',
    })

    // 5. Write sanitized audit event (D-17, D-18)
    await createAuditEvent(
      {
        familyId: input.familyId,
        actorIdentityId: input.guardianIdentityId,
        eventType: 'child_profile.created',
        subjectType: 'child_profile',
        subjectId: profile.id,
        summary: `Child profile "${profile.displayName}" created (age ${profile.ageYears})`,
        metadata: {
          avatarPreset: profile.avatarPreset,
          accentColor: profile.accentColor,
        },
      },
      tx,
    )

    return profile as ChildProfile
  })
}

/**
 * Updates a child profile's visual identifiers (display name, avatar, accent color).
 * Only guardians can change these — children cannot self-update (FAM-03, D-21).
 *
 * @throws {Error} If the profile is inactive or doesn't belong to the guardian's family.
 */
export async function updateChildProfile(
  input: UpdateChildProfileVisualsInput,
): Promise<ChildProfile> {
  // Verify guardian membership in same transaction
  return db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ id: schema.familyMemberships.id })
      .from(schema.familyMemberships)
      .where(
        and(
          eq(schema.familyMemberships.familyId, input.familyId),
          eq(schema.familyMemberships.identityId, input.guardianIdentityId),
          eq(schema.familyMemberships.role, 'guardian'),
          eq(schema.familyMemberships.status, 'active'),
        ),
      )
      .limit(1)

    if (!membership) {
      throw new Error('Only an active guardian can update a child profile')
    }

    // Fetch existing profile to ensure it belongs to this family
    const [existing] = await tx
      .select({
        id: schema.childProfiles.id,
        familyId: schema.childProfiles.familyId,
        displayName: schema.childProfiles.displayName,
        ageYears: schema.childProfiles.ageYears,
        avatarPreset: schema.childProfiles.avatarPreset,
        accentColor: schema.childProfiles.accentColor,
        active: schema.childProfiles.active,
      })
      .from(schema.childProfiles)
      .where(
        and(
          eq(schema.childProfiles.id, input.childProfileId),
          eq(schema.childProfiles.familyId, input.familyId),
        ),
      )
      .limit(1)

    if (!existing) {
      throw new Error('Child profile not found or not in this family')
    }

    if (!existing.active) {
      throw new Error('Cannot update a deactivated child profile')
    }

    // Validate updated values
    if (input.avatarPreset !== undefined && !isValidAvatarPreset(input.avatarPreset)) {
      throw new Error(`Invalid avatar preset: ${input.avatarPreset} (D-19)`)
    }
    if (input.accentColor !== undefined && !isValidAccentColor(input.accentColor)) {
      throw new Error(`Invalid accent color: ${input.accentColor} (D-22)`)
    }
    if (input.pin !== undefined && !validatePinFormat(input.pin)) {
      throw new Error('PIN must have 4 to 6 numeric digits')
    }

    const updates: Record<string, unknown> = {}
    const changes: string[] = []

    if (input.displayName !== undefined && input.displayName.trim()) {
      updates.displayName = input.displayName.trim()
      changes.push(`display_name: "${existing.displayName}" → "${input.displayName.trim()}"`)
    }
    if (input.avatarPreset !== undefined) {
      updates.avatarPreset = input.avatarPreset
      changes.push(`avatar: "${existing.avatarPreset}" → "${input.avatarPreset}"`)
    }
    if (input.accentColor !== undefined) {
      updates.accentColor = input.accentColor
      changes.push(`accent: "${existing.accentColor}" → "${input.accentColor}"`)
    }
    if (input.pin !== undefined) {
      updates.pinHash = await hashPin(input.pin)
      changes.push('pin updated')
    }

    if (Object.keys(updates).length === 0) {
      return existing as ChildProfile
    }

    updates.updatedAt = new Date()

    const [updated] = await tx
      .update(schema.childProfiles)
      .set(updates)
      .where(eq(schema.childProfiles.id, input.childProfileId))
      .returning({
        id: schema.childProfiles.id,
        familyId: schema.childProfiles.familyId,
        displayName: schema.childProfiles.displayName,
        ageYears: schema.childProfiles.ageYears,
        avatarPreset: schema.childProfiles.avatarPreset,
        accentColor: schema.childProfiles.accentColor,
        active: schema.childProfiles.active,
      })

    await createAuditEvent(
      {
        familyId: input.familyId,
        actorIdentityId: input.guardianIdentityId,
        eventType: 'child_profile.updated',
        subjectType: 'child_profile',
        subjectId: input.childProfileId,
        summary: `Child profile "${existing.displayName}" updated: ${changes.join('; ')}`,
        metadata: { changes },
      },
      tx,
    )

    return updated as ChildProfile
  })
}

export async function setChildPin(
  childProfileId: string,
  familyId: string,
  guardianIdentityId: string,
  pin: string,
): Promise<void> {
  if (!validatePinFormat(pin)) {
    throw new Error('PIN must have 4 to 6 numeric digits')
  }

  await db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ id: schema.familyMemberships.id })
      .from(schema.familyMemberships)
      .where(
        and(
          eq(schema.familyMemberships.familyId, familyId),
          eq(schema.familyMemberships.identityId, guardianIdentityId),
          eq(schema.familyMemberships.role, 'guardian'),
          eq(schema.familyMemberships.status, 'active'),
        ),
      )
      .limit(1)

    if (!membership) {
      throw new Error('Only an active guardian can update a child PIN')
    }

    const pinHash = await hashPin(pin)

    const [profile] = await tx
      .update(schema.childProfiles)
      .set({
        pinHash,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.childProfiles.id, childProfileId),
          eq(schema.childProfiles.familyId, familyId),
        ),
      )
      .returning({
        id: schema.childProfiles.id,
      })

    if (!profile) {
      throw new Error('Child profile not found or not in this family')
    }

    await createAuditEvent(
      {
        familyId,
        actorIdentityId: guardianIdentityId,
        eventType: 'child_profile.pin_set',
        subjectType: 'child_profile',
        subjectId: childProfileId,
        summary: 'PIN defined for child profile',
        metadata: {},
      },
      tx,
    )
  })
}

/**
 * Soft-deactivates a child profile, hiding it from normal UI while preserving
 * audit history and preventing ledger-history deletion conflicts (D-12).
 *
 * @throws {Error} If the profile is not found, not in the guardian's family, or already deactivated.
 */
export async function deactivateChildProfile(
  childProfileId: string,
  familyId: string,
  guardianIdentityId: string,
): Promise<ChildProfile> {
  return db.transaction(async (tx) => {
    const [membership] = await tx
      .select({ id: schema.familyMemberships.id })
      .from(schema.familyMemberships)
      .where(
        and(
          eq(schema.familyMemberships.familyId, familyId),
          eq(schema.familyMemberships.identityId, guardianIdentityId),
          eq(schema.familyMemberships.role, 'guardian'),
          eq(schema.familyMemberships.status, 'active'),
        ),
      )
      .limit(1)

    if (!membership) {
      throw new Error('Only an active guardian can deactivate a child profile')
    }

    const [existing] = await tx
      .select({
        id: schema.childProfiles.id,
        familyId: schema.childProfiles.familyId,
        displayName: schema.childProfiles.displayName,
        ageYears: schema.childProfiles.ageYears,
        avatarPreset: schema.childProfiles.avatarPreset,
        accentColor: schema.childProfiles.accentColor,
        active: schema.childProfiles.active,
      })
      .from(schema.childProfiles)
      .where(
        and(
          eq(schema.childProfiles.id, childProfileId),
          eq(schema.childProfiles.familyId, familyId),
        ),
      )
      .limit(1)

    if (!existing) {
      throw new Error('Child profile not found or not in this family')
    }

    if (!existing.active) {
      throw new Error('Child profile is already deactivated')
    }

    const [deactivated] = await tx
      .update(schema.childProfiles)
      .set({
        active: false,
        deactivatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.childProfiles.id, childProfileId))
      .returning({
        id: schema.childProfiles.id,
        familyId: schema.childProfiles.familyId,
        displayName: schema.childProfiles.displayName,
        ageYears: schema.childProfiles.ageYears,
        avatarPreset: schema.childProfiles.avatarPreset,
        accentColor: schema.childProfiles.accentColor,
        active: schema.childProfiles.active,
      })

    await createAuditEvent(
      {
        familyId,
        actorIdentityId: guardianIdentityId,
        eventType: 'child_profile.deactivated',
        subjectType: 'child_profile',
        subjectId: childProfileId,
        summary: `Child profile "${existing.displayName}" deactivated`,
      },
      tx,
    )

    return deactivated as ChildProfile
  })
}

/**
 * Lists active child profiles for a family, filtered to only active profiles.
 * Deactivated profiles are hidden from normal UI (D-12).
 */
export async function listActiveChildProfiles(
  familyId: string,
): Promise<ChildProfile[]> {
  const rows = await db
    .select({
      id: schema.childProfiles.id,
      familyId: schema.childProfiles.familyId,
      displayName: schema.childProfiles.displayName,
      ageYears: schema.childProfiles.ageYears,
      avatarPreset: schema.childProfiles.avatarPreset,
      accentColor: schema.childProfiles.accentColor,
      active: schema.childProfiles.active,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.familyId, familyId),
        eq(schema.childProfiles.active, true),
      ),
    )
    .orderBy(schema.childProfiles.displayName)

  return rows as ChildProfile[]
}
