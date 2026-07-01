'use client'

// PTASK-08: RecurrencePills — 7 pills D/S/T/Q/Q/S/S + link "Todos os dias".
// Seleção por índice de dia (0-6) para evitar colisão entre labels repetidas.
// value e onChange operam com o array ALL_DAYS (subset ou completo).

import { WEEKDAY_LABELS } from '@/lib/seed/parent-seed'

interface RecurrencePillsProps {
  value: number[]
  onChange: (days: number[]) => void
}

export function RecurrencePills({ value, onChange }: RecurrencePillsProps) {
  function toggleDay(index: number) {
    const newValue = value.includes(index)
      ? value.filter(d => d !== index)
      : [...value, index].sort((a, b) => a - b)
    onChange(newValue)
  }

  function selectAll() {
    onChange([0, 1, 2, 3, 4, 5, 6])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {WEEKDAY_LABELS.map((label, index) => {
          const isSelected = value.includes(index)
          return (
            <button
              key={index}
              aria-pressed={isSelected}
              onClick={() => toggleDay(index)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-pill)',
                border: `1.5px solid ${isSelected ? '#3E6B4F' : '#E2DECF'}`,
                background: isSelected ? '#3E6B4F' : 'var(--color-kreds-card)',
                color: isSelected ? '#ffffff' : 'var(--color-kreds-text)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background .15s ease, border-color .15s ease, color .15s ease',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Link "Todos os dias" */}
      <button
        onClick={selectAll}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-kreds-primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
          textAlign: 'left',
          textDecoration: 'underline',
          width: 'fit-content',
        }}
      >
        Todos os dias
      </button>
    </div>
  )
}
