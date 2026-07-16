'use client'

// Phase 14: overlay de escolha de avatar da criança — aberto pelo avatar do
// GardenHeader. Grid com a opção "inicial" (fallback legado) + presets
// ilustrados. Alvos de toque grandes (72px) para crianças 6+. Segue o padrão
// visual do CelebrationOverlay (fixed inset, fundo #F4F1E8 translúcido).

import { AVATAR_PRESETS } from '@/lib/avatars/presets'
import { ChildAvatar } from '@/components/avatar/child-avatar'

interface AvatarPickerProps {
  visible: boolean
  displayName: string
  accentColor: string
  current: string
  onSelect: (preset: string) => void
  onClose: () => void
}

export function AvatarPicker({
  visible,
  displayName,
  accentColor,
  current,
  onSelect,
  onClose,
}: AvatarPickerProps) {
  if (!visible) return null

  // 'initial' primeiro (fallback legado), depois os presets ilustrados
  const options = [
    { id: 'initial', label: 'Inicial' },
    ...AVATAR_PRESETS.map((p) => ({ id: p.id as string, label: p.label })),
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escolher avatar"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(244,241,232,.98)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--color-kreds-card)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          maxWidth: 360,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-kreds-text)',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          Escolha seu avatar
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            justifyItems: 'center',
          }}
        >
          {options.map((option) => {
            const isSelected = current === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Avatar ${option.label}`}
                onClick={() => onSelect(option.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: 8,
                  borderRadius: 16,
                  border: `2.5px solid ${isSelected ? '#3E6B4F' : 'transparent'}`,
                  background: isSelected ? '#EEF3EA' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background .15s ease, border-color .15s ease',
                }}
              >
                <ChildAvatar
                  displayName={displayName}
                  accentColor={accentColor}
                  avatarPreset={option.id}
                  size={72}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isSelected ? '#3E6B4F' : 'var(--color-kreds-muted)',
                  }}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            height: 44,
            borderRadius: 13,
            border: 'none',
            background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cta)',
          }}
        >
          Pronto!
        </button>
      </div>
    </div>
  )
}
