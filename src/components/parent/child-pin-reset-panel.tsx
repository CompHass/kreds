'use client'

// Phase 8, Plan 04 (D-10): ChildPinResetPanel — non-fullscreen panel wrapping the
// existing NumericKeypad (CAUTH-01) to emit a 4-digit PIN. Reuses the keypad
// button styling as-is (border-radius 50%, bg #FBFAF5, box-shadow), does not
// redesign it — only the panel/container context changes.

import { useState } from 'react'
import { NumericKeypad } from '@/components/auth/numeric-keypad'

interface ChildPinResetPanelProps {
  childName: string
  onSubmit: (pin: string) => void
  onCancel: () => void
}

const PIN_LENGTH = 4

export function ChildPinResetPanel({ childName, onSubmit, onCancel }: ChildPinResetPanelProps) {
  const [digits, setDigits] = useState('')

  function handleDigit(d: string) {
    if (digits.length >= PIN_LENGTH) return
    const next = digits + d
    setDigits(next)
    if (next.length === PIN_LENGTH) {
      onSubmit(next)
    }
  }

  function handleBackspace() {
    setDigits((prev) => prev.slice(0, -1))
  }

  const containerStyle: React.CSSProperties = {
    width: 336,
    flexShrink: 0,
    padding: 20,
    borderRadius: 20,
    background: '#ffffff',
    boxShadow: '0 16px 36px -26px rgba(40,55,45,.5)',
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  }

  return (
    <aside data-testid="child-pin-reset-panel" style={containerStyle}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#27372C',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Redefinir PIN de {childName}
        </h3>
        <button
          type="button"
          aria-label="Cancelar"
          onClick={onCancel}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1.5px solid #E2DECF',
            background: 'var(--color-kreds-card)',
            color: 'var(--color-kreds-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Indicadores de progresso — 4 posições preenchidas/vazias */}
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            data-testid={`pin-dot-${i}`}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i < digits.length ? 'var(--color-kreds-primary)' : '#E2DECF',
            }}
          />
        ))}
      </div>

      <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
    </aside>
  )
}
