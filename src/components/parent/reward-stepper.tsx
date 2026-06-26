'use client'

// PTASK-07: RewardStepper — stepper ± com label Mordomia / R$ X.
// value=0 → "Mordomia" em verde; value>0 → "R$ X" em #27372C.
// Clamp em 0 (não desce abaixo de zero).

import { rewardLabel } from '@/lib/seed/parent-seed'

interface RewardStepperProps {
  value: number
  onChange: (value: number) => void
}

export function RewardStepper({ value, onChange }: RewardStepperProps) {
  const label = rewardLabel(value)
  const isMordomia = value === 0

  function handleDecrement() {
    if (value > 0) {
      onChange(value - 1)
    }
  }

  function handleIncrement() {
    onChange(value + 1)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Botão − */}
      <button
        aria-label="Diminuir recompensa"
        onClick={handleDecrement}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1.5px solid #E2DECF',
          background: 'var(--color-kreds-card)',
          color: value === 0 ? '#C2C9BC' : 'var(--color-kreds-text)',
          fontSize: 20,
          fontWeight: 700,
          cursor: value === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        −
      </button>

      {/* Valor central */}
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: isMordomia ? 'var(--color-kreds-primary)' : '#27372C',
          minWidth: 90,
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>

      {/* Botão + */}
      <button
        aria-label="Aumentar recompensa"
        onClick={handleIncrement}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1.5px solid #E2DECF',
          background: 'var(--color-kreds-card)',
          color: 'var(--color-kreds-text)',
          fontSize: 20,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  )
}
