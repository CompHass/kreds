'use client'

// GARD-10: Overlay de celebração com confetes + versículo + botão voltar
import { ConfettiField } from './confetti-field'

interface Verse {
  id: string
  reference: string
  text: string
  createdAt: Date
}

interface CelebrationOverlayProps {
  visible: boolean
  verse: Verse | null
  onClose: () => void
}

export function CelebrationOverlay({
  visible,
  verse,
  onClose,
}: CelebrationOverlayProps) {
  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
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
        overflow: 'hidden',
      }}
    >
      {/* 20 confetes animados */}
      <ConfettiField />

      {/* Card do versículo */}
      <div
        style={{
          background: 'var(--color-kreds-card)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          maxWidth: 360,
          width: '100%',
          animation: 'var(--animate-kreds-cele)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Título */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--color-kreds-text)',
            margin: 0,
          }}
        >
          Parabéns! Você colheu seu jardim!
        </h2>

        {/* Texto do versículo */}
        {verse && (
          <>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.5,
                color: 'var(--color-kreds-text)',
                margin: 0,
              }}
            >
              {verse.text}
            </p>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.4,
                color: 'var(--color-kreds-muted)',
              }}
            >
              {verse.reference}
            </span>
          </>
        )}

        {/* Botão "Voltar ao jardim" */}
        <button
          onClick={onClose}
          style={{
            height: 52,
            borderRadius: 13,
            background: 'var(--color-kreds-primary)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cta)',
            marginTop: 8,
          }}
        >
          Voltar ao jardim
        </button>
      </div>
    </div>
  )
}
