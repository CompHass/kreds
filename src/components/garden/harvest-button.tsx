'use client'

// GARD-08: Botão "Colher Frutos" — visível apenas quando canHarvest=true

interface HarvestButtonProps {
  visible: boolean
  onHarvest: () => void
}

export function HarvestButton({ visible, onHarvest }: HarvestButtonProps) {
  if (!visible) return null

  return (
    <button
      onClick={onHarvest}
      aria-label="Colher os frutos do jardim"
      style={{
        background: 'linear-gradient(135deg, #C77F52 0%, #B5623F 100%)',
        border: 'none',
        borderRadius: 999,
        minHeight: 44,
        padding: '10px 20px',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        animation: 'var(--animate-kreds-fruit)',
        boxShadow: '0 4px 12px rgba(181,98,63,.4)',
      }}
    >
      Colher Frutos
    </button>
  )
}
