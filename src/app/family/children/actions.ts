'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { createChildProfile, deactivateChildProfile, updateChildProfile } from '@/lib/families/child-profiles'
import { validatePinFormat } from '@/lib/families/child-pin'
import { listActiveChildProfiles } from '@/lib/families/child-profiles'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function addChildAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const existingChildren = await listActiveChildProfiles(membership.familyId)

  const displayName = formData.get('displayName')?.toString()?.trim()
  const ageYearsRaw = formData.get('ageYears')?.toString()
  const avatarPreset = formData.get('avatarPreset')?.toString()
  const accentColor = formData.get('accentColor')?.toString()
  const pin = formData.get('pin')?.toString().trim() || undefined
  const consentGiven = formData.get('consentGiven') === 'true'

  if (!displayName || !ageYearsRaw || !avatarPreset || !accentColor) {
    return { error: 'Todos os campos são obrigatórios.' }
  }

  const ageYears = parseInt(ageYearsRaw, 10)
  if (isNaN(ageYears)) {
    return { error: 'Idade inválida.' }
  }

  if (!consentGiven) {
    return { error: 'O consentimento parental é obrigatório.' }
  }

  if (pin && !validatePinFormat(pin)) {
    return { error: 'PIN must have 4 to 6 numeric digits.' }
  }

  try {
    await createChildProfile({
      familyId: membership.familyId,
      guardianIdentityId: kredsIdentityId,
      displayName,
      ageYears,
      avatarPreset,
      accentColor,
      pin,
      consentGiven,
    })
  } catch (err) {
    console.error('[addChildAction] error:', err)
    return { error: 'Não foi possível adicionar o filho. Tente novamente.' }
  }

  redirect('/family/children?success=1')
}

export async function updateChildAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const childProfileId = formData.get('childProfileId')?.toString()
  const displayName = formData.get('displayName')?.toString()?.trim()
  const ageYearsRaw = formData.get('ageYears')?.toString()
  const avatarPreset = formData.get('avatarPreset')?.toString()
  const accentColor = formData.get('accentColor')?.toString()

  if (!childProfileId || !displayName || !ageYearsRaw || !avatarPreset || !accentColor) {
    return { error: 'Todos os campos são obrigatórios.' }
  }

  const ageYears = parseInt(ageYearsRaw, 10)
  if (isNaN(ageYears)) {
    return { error: 'Idade inválida.' }
  }

  try {
    await updateChildProfile({
      childProfileId,
      familyId: membership.familyId,
      guardianIdentityId: kredsIdentityId,
      displayName,
      ageYears,
      avatarPreset,
      accentColor,
    })
  } catch (err) {
    console.error('[updateChildAction] error:', err)
    return { error: 'Não foi possível salvar as alterações. Tente novamente.' }
  }

  redirect('/family/children')
}

export async function deactivateChildAction(formData: FormData): Promise<void> {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const childProfileId = formData.get('childProfileId')?.toString()
  if (!childProfileId) return

  try {
    await deactivateChildProfile(childProfileId, membership.familyId, kredsIdentityId)
  } catch (err) {
    console.error('[deactivateChildAction] error:', err)
  }

  redirect('/family/children')
}
