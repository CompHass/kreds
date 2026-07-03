'use client'

import { useActionState, useState } from 'react'
import { updateChildAction } from '../../actions'

interface AvatarOption { key: string; label: string }
interface AccentOption { key: string; label: string }

interface EditChildFormProps {
  childProfileId: string
  initialDisplayName: string
  initialAgeYears: number
  initialAvatarPreset: string
  initialAccentColor: string
  avatarOptions: AvatarOption[]
  accentOptions: AccentOption[]
}

// Emoji representing each Sylvan avatar preset
const AVATAR_EMOJI: Record<string, string> = {
  'oak-sprout':     '🌱',
  'cedar-sapling':  '🌲',
  'olive-branch':   '🫒',
  'mustard-seed':   '🌻',
  'fig-leaf':       '🍃',
  'river-stone':    '🪨',
}

// CSS color for each accent key
const ACCENT_CSS: Record<string, string> = {
  moss:  '#3b6934',
  gold:  '#d2a501',
  sky:   '#0369a1',
  berry: '#9333ea',
  clay:  '#c2410c',
  sage:  '#65a30d',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #42493e)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
  background: 'rgba(255,255,255,0.72)',
  fontSize: '0.9375rem',
  color: 'var(--color-primary, #154212)',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function EditChildForm({
  childProfileId,
  initialDisplayName,
  initialAgeYears,
  initialAvatarPreset,
  initialAccentColor,
  avatarOptions,
  accentOptions,
}: EditChildFormProps) {
  const [state, formAction, isPending] = useActionState(updateChildAction, null)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(initialAvatarPreset)
  const [selectedAccent, setSelectedAccent] = useState<string>(initialAccentColor)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input type="hidden" name="childProfileId" value={childProfileId} />

      {state?.error && (
        <div role="alert" style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.24)',
          color: '#b91c1c',
          fontSize: '0.875rem',
        }}>
          {state.error}
        </div>
      )}

      {/* Display name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="displayName" style={labelStyle}>Nome</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          defaultValue={initialDisplayName}
          minLength={1}
          disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
        />
      </div>

      {/* Age */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="ageYears" style={labelStyle}>Idade (anos)</label>
        <input
          id="ageYears"
          name="ageYears"
          type="number"
          required
          min={0}
          max={120}
          defaultValue={initialAgeYears}
          disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-soft, #72796e)' }}>
          Apenas a idade em anos é armazenada — não a data de nascimento.
        </span>
      </div>

      {/* Avatar — visual grid picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={labelStyle}>Avatar</span>
        {/* Hidden input carries the real value for form submission */}
        <input type="hidden" name="avatarPreset" value={selectedAvatar} required />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}>
          {avatarOptions.map(({ key, label }) => {
            const isSelected = selectedAvatar === key
            return (
              <button
                key={key}
                type="button"
                disabled={isPending}
                onClick={() => setSelectedAvatar(key)}
                aria-pressed={isSelected}
                aria-label={label}
                title={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '14px 8px',
                  borderRadius: '16px',
                  border: isSelected
                    ? '2px solid #154212'
                    : '2px solid var(--color-border, rgba(45,90,39,0.16))',
                  background: isSelected
                    ? 'rgba(21,66,18,0.08)'
                    : 'rgba(255,255,255,0.72)',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                  boxShadow: isSelected ? '0 0 0 1px #154212' : 'none',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>
                  {AVATAR_EMOJI[key] ?? '🌿'}
                </span>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: isSelected ? '#154212' : 'var(--color-text-soft, #72796e)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        {!selectedAvatar && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-soft, #72796e)' }}>
            Toque em um avatar para selecionar.
          </span>
        )}
      </div>

      {/* Accent color — visual dot picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={labelStyle}>Cor de destaque</span>
        <input type="hidden" name="accentColor" value={selectedAccent} required />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {accentOptions.map(({ key, label }) => {
            const isSelected = selectedAccent === key
            const color = ACCENT_CSS[key] ?? '#154212'
            return (
              <button
                key={key}
                type="button"
                disabled={isPending}
                onClick={() => setSelectedAccent(key)}
                aria-pressed={isSelected}
                aria-label={label}
                title={label}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: color,
                  border: isSelected ? `3px solid #154212` : '3px solid transparent',
                  outline: isSelected ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: '2px',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                  transition: 'border-color 0.15s, outline-color 0.15s, transform 0.1s',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: isSelected ? `0 4px 12px ${color}55` : 'none',
                }}
              />
            )
          })}
        </div>
        {selectedAccent && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-soft, #72796e)' }}>
            {accentOptions.find(a => a.key === selectedAccent)?.label}
          </span>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !selectedAvatar || !selectedAccent}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '52px',
          borderRadius: 'var(--radius-full, 9999px)',
          background: 'linear-gradient(135deg, #3b6934, #154212)',
          boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38), 0 18px 55px rgba(45,90,39,0.1)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          border: 'none',
          cursor: (isPending || !selectedAvatar || !selectedAccent) ? 'not-allowed' : 'pointer',
          marginTop: '4px',
          opacity: (isPending || !selectedAvatar || !selectedAccent) ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {isPending ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}
