'use client'

// CTASK-04: SavingsCard — cofrinho com progress bar animada no mount

import { useState, useEffect } from 'react'

interface SavingsCardProps {
  savings: number
  goal: number
}

export function SavingsCard({ savings, goal }: SavingsCardProps) {
  const [barWidth, setBarWidth] = useState(0)
  const targetWidth = Math.min(100, (savings / goal) * 100)

  // Double requestAnimationFrame: garante que o browser renderiza width:0
  // antes de iniciar a animação (Pitfall 3 — RESEARCH.md)
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBarWidth(targetWidth))
    })
  }, [targetWidth])

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        role="region"
        aria-label="Cofrinho"
        style={{
          background: '#EEF3EA',
          border: '1px solid #D6E2CC',
          borderRadius: 18,
          padding: 16,
        }}
      >
        {/* Cabeçalho: título e meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: '#27372C',
              margin: 0,
            }}
          >
            Cofrinho
          </h3>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#7C8676',
            }}
          >
            Meta: R$ {goal}
          </span>
        </div>

        {/* Valor salvo */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#3E6B4F',
            }}
          >
            R$ {savings}
          </span>
        </div>

        {/* Track da progress bar */}
        <div
          role="progressbar"
          aria-valuenow={savings}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-label={`Cofrinho: R$ ${savings} de R$ ${goal}`}
          style={{
            height: 12,
            borderRadius: 'var(--radius-pill)',
            background: '#D6E2CC',
            overflow: 'hidden',
          }}
        >
          {/* Fill animado */}
          <div
            style={{
              height: '100%',
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(90deg, #5A8A66 0%, #3E6B4F 100%)',
              width: `${barWidth}%`,
              transition: 'width .6s cubic-bezier(.2,.8,.3,1)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
