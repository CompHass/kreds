'use client'

// GARD-01: Header da criança com avatar, nome e badge de moedas
// Phase 14: avatar renderizado via ChildAvatar (preset selecionável) e vira
// botão que abre o AvatarPicker quando onAvatarClick é fornecido.

import { ChildAvatar } from '@/components/avatar/child-avatar'

interface GardenHeaderProps {
  name: string
  initial: string
  coins: number
  avatarPreset?: string
  accentColor?: string
  onAvatarClick?: () => void
}

export function GardenHeader({
  name,
  initial,
  coins,
  avatarPreset = 'initial',
  accentColor = '#3E6B4F',
  onAvatarClick,
}: GardenHeaderProps) {
  const avatar = (
    <ChildAvatar
      displayName={name || initial}
      accentColor={accentColor}
      avatarPreset={avatarPreset}
      size={46}
      borderRadius={15}
      background="linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)"
    />
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
      }}
    >
      {/* Avatar — botão de troca (Phase 14) ou estático */}
      {onAvatarClick ? (
        <button
          type="button"
          aria-label="Trocar avatar"
          onClick={onAvatarClick}
          style={{
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: 15,
            flexShrink: 0,
            lineHeight: 0,
          }}
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}

      {/* Nome da criança */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--color-kreds-text)',
          }}
        >
          {name}
        </div>
      </div>

      {/* Badge de moedas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-kreds-card)',
          border: '1px solid var(--color-kreds-border)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 12px',
        }}
      >
        {/* SVG coin */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" fill="var(--color-kreds-coin)" />
          <text
            x="8"
            y="11.5"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#9A7320"
            fontFamily="sans-serif"
          >
            K
          </text>
        </svg>
        {/* Valor de coins */}
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-kreds-gold)',
          }}
        >
          {coins}
        </span>
      </div>
    </div>
  )
}
