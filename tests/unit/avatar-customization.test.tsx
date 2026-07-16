// Phase 14: avatar customization — preset registry (closed set), ChildAvatar
// rendering/fallbacks, AvatarPicker interaction, GardenHeader trigger and
// ChildFormPanel avatar grid submit.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  AVATAR_PRESET_IDS,
  AVATAR_PRESETS,
  isAvatarPreset,
  avatarSrc,
} from '../../src/lib/avatars/presets'
import { AvatarPresetSchema, CreateChildSchema } from '../../src/types/child'
import { ChildAvatar } from '../../src/components/avatar/child-avatar'
import { AvatarPicker } from '../../src/components/garden/avatar-picker'
import { GardenHeader } from '../../src/components/garden/garden-header'
import { ChildFormPanel } from '../../src/components/parent/child-form-panel'

describe('avatar presets registry', () => {
  it('is a closed set: rejects arbitrary identifiers, uploads and URLs', () => {
    const invalid = [
      'custom-upload',
      'photo-123',
      'child-photo.jpg',
      'https://example.com/photo.jpg',
      '/uploads/child-avatar.png',
      'data:image/png;base64,...',
      '',
      'admin',
    ]
    invalid.forEach((value) => expect(isAvatarPreset(value)).toBe(false))
  })

  it('accepts every declared preset id, including the legacy fallback', () => {
    AVATAR_PRESET_IDS.forEach((id) => expect(isAvatarPreset(id)).toBe(true))
    expect(AVATAR_PRESET_IDS).toContain('initial')
  })

  it('maps illustrated presets to /avatars/<id>.webp and initial/unknown to null', () => {
    expect(avatarSrc('leaft')).toBe('/avatars/leaft.webp')
    expect(avatarSrc('oak')).toBe('/avatars/oak.webp')
    expect(avatarSrc('initial')).toBeNull()
    expect(avatarSrc('not-a-preset')).toBeNull()
  })

  it('Zod schema only accepts known presets (server-side validation)', () => {
    expect(AvatarPresetSchema.safeParse('mushroom').success).toBe(true)
    expect(AvatarPresetSchema.safeParse('photo.jpg').success).toBe(false)
  })

  it('CreateChildSchema defaults avatarPreset to initial when omitted', () => {
    const parsed = CreateChildSchema.parse({
      displayName: 'Ana',
      ageYears: 8,
      accentColor: '#3E6B4F',
    })
    expect(parsed.avatarPreset).toBe('initial')
  })
})

describe('ChildAvatar', () => {
  it('renders the preset image when an illustrated preset is set', () => {
    const { container } = render(
      <ChildAvatar displayName="Ana" accentColor="#3E6B4F" avatarPreset="leaft" size={52} />,
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('/avatars/leaft.webp')
  })

  it('renders the initial for the legacy preset and for unknown values', () => {
    render(
      <ChildAvatar displayName="Ana" accentColor="#3E6B4F" avatarPreset="initial" size={52} />,
    )
    expect(screen.getByText('A')).toBeInTheDocument()

    render(
      <ChildAvatar displayName="Bia" accentColor="#B14A2E" avatarPreset="legacy-junk" size={52} />,
    )
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('falls back to the preset emoji when the image asset fails to load', () => {
    const { container } = render(
      <ChildAvatar displayName="Ana" accentColor="#3E6B4F" avatarPreset="sprout" size={52} />,
    )
    fireEvent.error(container.querySelector('img')!)
    const emoji = AVATAR_PRESETS.find((p) => p.id === 'sprout')!.emoji
    expect(screen.getByText(emoji)).toBeInTheDocument()
  })
})

describe('AvatarPicker', () => {
  const baseProps = {
    displayName: 'Ana',
    accentColor: '#3E6B4F',
    current: 'initial',
    onSelect: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders nothing when not visible', () => {
    const { container } = render(<AvatarPicker {...baseProps} visible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the initial option plus every illustrated preset', () => {
    render(<AvatarPicker {...baseProps} visible />)
    expect(screen.getByRole('dialog', { name: 'Escolher avatar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Avatar Inicial' })).toBeInTheDocument()
    AVATAR_PRESETS.forEach((p) => {
      expect(screen.getByRole('button', { name: `Avatar ${p.label}` })).toBeInTheDocument()
    })
  })

  it('marks the current preset with aria-pressed and fires onSelect/onClose', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <AvatarPicker
        {...baseProps}
        visible
        current="oak"
        onSelect={onSelect}
        onClose={onClose}
      />,
    )
    expect(screen.getByRole('button', { name: 'Avatar Bolota' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avatar Cogumelo' }))
    expect(onSelect).toHaveBeenCalledWith('mushroom')
    fireEvent.click(screen.getByRole('button', { name: 'Pronto!' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('GardenHeader avatar trigger', () => {
  it('exposes a "Trocar avatar" button when onAvatarClick is provided', () => {
    const onAvatarClick = vi.fn()
    render(
      <GardenHeader name="Maria" initial="M" coins={10} onAvatarClick={onAvatarClick} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Trocar avatar' }))
    expect(onAvatarClick).toHaveBeenCalled()
  })

  it('renders a plain avatar without the button when onAvatarClick is absent', () => {
    render(<GardenHeader name="Maria" initial="M" coins={10} />)
    expect(screen.queryByRole('button', { name: 'Trocar avatar' })).not.toBeInTheDocument()
  })
})

describe('ChildFormPanel avatar grid', () => {
  it('submits the selected preset in onSave data', async () => {
    const onSave = vi.fn()
    render(<ChildFormPanel mode="create" onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Avatar Folhinha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar criança' }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({
      displayName: 'Ana',
      avatarPreset: 'leaft',
    })
  })
})
