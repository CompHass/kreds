// Child types and Zod schemas — Phase 8 (D-06 through D-13)
// Single source of truth for ChildProfileView type + form validation schemas,
// shared by children-panel-view.tsx, Server Actions (src/app/actions/children.ts),
// and Route Handlers (src/app/api/family/.../children/route.ts).

import { z } from 'zod'
import { AVATAR_PRESET_IDS } from '@/lib/avatars/presets'

// Client-safe, server-fetched shape for ChildCard. Never carries pinHash/pinEncrypted
// directly — hasEncryptedPin is derived server-side from pinEncrypted !== null
// (Pitfall 6 — never send ciphertext or plaintext to the client at fetch time).
export interface ChildProfileView {
  id: string
  displayName: string
  ageYears: number
  accentColor: string
  avatarPreset: string
  active: boolean
  hasEncryptedPin: boolean
}

// Phase 14: only known preset ids are accepted server-side — never a free path/URL.
export const AvatarPresetSchema = z.enum(AVATAR_PRESET_IDS)

// Phase 14 supersedes D-06/D-07/D-08: avatarPreset is now a selectable form field
// (guardian form grid + child self-serve picker). 'initial' keeps the legacy
// fallback rendering (displayName initial + accentColor).
// accentColor is a 7-char hex string from a native color picker.
export const CreateChildSchema = z.object({
  displayName: z.string().min(1, 'Nome obrigatório'),
  ageYears: z.number().int().min(1).max(18),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  avatarPreset: AvatarPresetSchema.default('initial'),
})

// Body of PATCH /api/child/[childId]/avatar (child self-serve picker).
export const UpdateChildAvatarSchema = z.object({
  avatarPreset: AvatarPresetSchema,
})

// D-10: exactly 4 digits for this phase's reset-PIN flow — distinct from the
// login validatePinFormat (4-6 digits) in src/lib/families/child-pin.ts.
export const ResetPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'PIN deve ter 4 dígitos'),
})
