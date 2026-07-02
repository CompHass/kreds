'use server'

// Server Actions for ChildrenPanelView mutations — Phase 8 (D-06 through D-15)
// These actions are called by ChildrenPanelView client component (Plan 05).
//
// Security: auth() check before any DB access (T-08-08).
// Family isolation: every mutation/read scoped by and(eq(id), eq(familyId)) (T-08-05).
// PIN handling: resetChildPin dual-writes bcrypt pinHash + AES-GCM pinEncrypted (D-13).
//   revealChildPin decrypts server-side, returns null for pre-existing NULL rows (Pitfall 6).
//   pinEncrypted is NEVER used for authentication (D-11) — this file never verifies login.
// revalidatePath: called with concrete path after each mutation (Pitfall 4).

import { revalidatePath } from 'next/cache'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { hashPin, validatePinFormat } from '@/lib/families/child-pin'
import { encryptPin, decryptPin } from '@/lib/crypto/pin-cipher'
import { CreateChildSchema } from '@/types/child'

// ─── createChild ─────────────────────────────────────────────────────────────
// Inserts a new child profile and returns the persisted row (with real UUID).
// avatarPreset is a fixed server-injected value (D-08) — never user-selectable.

export async function createChild(
  data: z.infer<typeof CreateChildSchema> & { familyId: string },
): Promise<typeof childProfiles.$inferSelect> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Validate — throws ZodError if invalid
  CreateChildSchema.parse(data)

  const [child] = await db
    .insert(childProfiles)
    .values({
      familyId: data.familyId,
      displayName: data.displayName,
      ageYears: data.ageYears,
      accentColor: data.accentColor,
      avatarPreset: 'initial', // D-08: fixed value, NOT user-selectable
    })
    .returning()

  revalidatePath(`/family/${data.familyId}/children`)

  return child
}

// ─── resetChildPin ───────────────────────────────────────────────────────────
// Dual-writes bcrypt pinHash (login auth, unchanged path per D-11) and AES-GCM
// pinEncrypted (reveal-only, D-12) together in one UPDATE (D-13 — kept in sync).

export async function resetChildPin(
  childId: string,
  familyId: string,
  pin: string,
): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (!validatePinFormat(pin)) throw new Error('Invalid PIN format')

  const pinHash = await hashPin(pin)
  const pinEncrypted = encryptPin(pin)

  await db
    .update(childProfiles)
    .set({ pinHash, pinEncrypted, updatedAt: new Date() })
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))

  revalidatePath(`/family/${familyId}/children`)
}

// ─── revealChildPin ──────────────────────────────────────────────────────────
// Read-only, server-side decrypt for the "Mostrar" button (D-12). Returns null
// for pre-existing rows with pinEncrypted=NULL (Pitfall 6) — never used for auth.

export async function revealChildPin(
  childId: string,
  familyId: string,
): Promise<string | null> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const [child] = await db
    .select({ pinEncrypted: childProfiles.pinEncrypted })
    .from(childProfiles)
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
    .limit(1)

  if (!child?.pinEncrypted) return null

  return decryptPin(child.pinEncrypted)
}

// ─── toggleChildActive ───────────────────────────────────────────────────────
// Soft-deactivates/reactivates a child profile (D-14). Only blocks the NEXT
// login attempt — no session revocation, no change to child-guard.ts (D-15).

export async function toggleChildActive(
  childId: string,
  familyId: string,
  active: boolean,
): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(childProfiles)
    .set({
      active,
      deactivatedAt: active ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))

  revalidatePath(`/family/${familyId}/children`)
}
