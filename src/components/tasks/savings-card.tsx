'use client'

// CTASK-04: SavingsCard — cofrinho com progress bar animada ao entrar na viewport

import { useState, useEffect, useRef } from 'react'

interface SavingsCardProps {
  savings: number
  goal: number
}

export function SavingsCard({ savings, goal }: SavingsCardProps) {
  const [animated, setAnimated] = useState(false)
  const targetWidth = Math.min(100, goal > 0 ? (savings / goal) * 100 : 0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Dispara animação quando o card entra na viewport.
  // double-rAF após IntersectionObserver garante que o browser pintou
  // width:0% antes de aplicar width:targetWidth%.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let raf1: number
    let raf2: number
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect()
          raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setAnimated(true))
          })
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ padding: '0 16px' }}>
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
              width: `${animated ? targetWidth : 0}%`,
              transition: 'width .6s cubic-bezier(.2,.8,.3,1)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
