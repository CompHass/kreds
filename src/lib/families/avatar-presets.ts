/**
 * Closed Sylvan Growth avatar and accent constant sets (FAM-06, D-19, D-20, D-22).
 *
 * Phase 02 avatars are static profile identifiers — they do NOT encode
 * task progress, ledger state, or growth progression (D-20).
 * No photo uploads, URLs, file references, or camera identifiers are accepted (D-19).
 */
export const AVATAR_PRESETS = {
  'oak-sprout': 'Oak Sprout',
  'cedar-sapling': 'Cedar Sapling',
  'olive-branch': 'Olive Branch',
  'mustard-seed': 'Mustard Seed',
  'fig-leaf': 'Fig Leaf',
  'river-stone': 'River Stone',
} as const

export type AvatarPreset = keyof typeof AVATAR_PRESETS

export const ACCENT_COLORS = {
  moss: 'Moss',
  gold: 'Gold',
  sky: 'Sky',
  berry: 'Berry',
  clay: 'Clay',
  sage: 'Sage',
} as const

export type AccentColor = keyof typeof ACCENT_COLORS

/**
 * Type guard: returns true if the value is a valid Sylvan Growth avatar preset.
 */
export function isValidAvatarPreset(value: string): value is AvatarPreset {
  return value in AVATAR_PRESETS
}

/**
 * Type guard: returns true if the value is a valid accent color.
 */
export function isValidAccentColor(value: string): value is AccentColor {
  return value in ACCENT_COLORS
}
