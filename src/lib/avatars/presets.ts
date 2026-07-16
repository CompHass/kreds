// Avatar presets — Phase 14 (supersedes D-06/D-07/D-08 from Phase 8).
// Client-safe registry: preset ids, PT-BR labels and static asset paths.
// 'initial' is the legacy fallback (displayName initial over accentColor) and
// has no image asset. Every other preset maps to /public/avatars/<id>.webp.
// The emoji is a graceful stand-in rendered while the image asset is missing
// or fails to load (ChildAvatar onError) — the UI never shows a broken image.

export const AVATAR_PRESET_IDS = [
  'initial',
  'leaft',
  'sprout',
  'seed',
  'vase',
  'oak',
  'mushroom',
  'toadstool',
  'scarecrow',
  'tree',
  'tree2',
  'flowergirl',
  'leafgirl',
  'leaftbaby',
  'plantkid',
] as const

export type AvatarPreset = (typeof AVATAR_PRESET_IDS)[number]

export interface AvatarPresetMeta {
  id: Exclude<AvatarPreset, 'initial'>
  label: string
  emoji: string
}

// Order here defines the picker grid order. Ids match the asset filenames the
// user dropped in public/avatars/raw/ (converted to <id>.webp at 256px).
export const AVATAR_PRESETS: AvatarPresetMeta[] = [
  { id: 'leaft', label: 'Folhinha', emoji: '🍃' },
  { id: 'sprout', label: 'Brotinho', emoji: '🌱' },
  { id: 'seed', label: 'Sementinha', emoji: '🫘' },
  { id: 'vase', label: 'Vasinho', emoji: '🪴' },
  { id: 'oak', label: 'Bolota', emoji: '🌰' },
  { id: 'mushroom', label: 'Cogumelo', emoji: '🍄' },
  { id: 'toadstool', label: 'Cogumelinho', emoji: '🍄‍🟫' },
  { id: 'scarecrow', label: 'Espantalho', emoji: '🎃' },
  { id: 'tree', label: 'Árvore', emoji: '🌳' },
  { id: 'tree2', label: 'Arvorezinha', emoji: '🌲' },
  { id: 'flowergirl', label: 'Florzinha', emoji: '🌸' },
  { id: 'leafgirl', label: 'Fadinha', emoji: '🧚' },
  { id: 'leaftbaby', label: 'Bebê Folha', emoji: '🌿' },
  { id: 'plantkid', label: 'Plantinha', emoji: '☘️' },
]

export function isAvatarPreset(value: string): value is AvatarPreset {
  return (AVATAR_PRESET_IDS as readonly string[]).includes(value)
}

// null for 'initial' (no asset) and for unknown legacy values.
export function avatarSrc(preset: string): string | null {
  if (preset === 'initial' || !isAvatarPreset(preset)) return null
  return `/avatars/${preset}.webp`
}

export function avatarEmoji(preset: string): string | null {
  return AVATAR_PRESETS.find((p) => p.id === preset)?.emoji ?? null
}
