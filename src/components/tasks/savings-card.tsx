'use client'

// CTASK-04: SavingsCard — cofrinho com progress bar animada ao entrar na viewport
// Phase 11: quando há uma meta ativa (goalId), a criança pode alocar Kreds do
// saldo disponível para o cofrinho via onAllocate.

import { useState, useEffect, useRef } from 'react'

interface SavingsCardProps {
  title?: string
  savings: number
  goal: number
  goalId?: string | null
  availableBalance?: number
  onAllocate?: (amount: number) => void
  onDeallocate?: (amount: number) => void
  allocatePending?: boolean
}

export function SavingsCard({
  title = 'Cofrinho',
  savings,
  goal,
  goalId,
  availableBalance = 0,
  onAllocate,
  onDeallocate,
  allocatePending = false,
}: SavingsCardProps) {
  const [animated, setAnimated] = useState(false)
  const [allocateInput, setAllocateInput] = useState('')
  const [deallocateInput, setDeallocateInput] = useState('')
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
            {title}
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

        {/* Phase 11: alocar Kreds do saldo disponível para a meta */}
        {goalId && onAllocate && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <input
              type="number"
              min={1}
              max={availableBalance}
              value={allocateInput}
              onChange={(e) => setAllocateInput(e.target.value)}
              placeholder="Quanto guardar?"
              aria-label="Quanto guardar no cofrinho"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 12,
                border: '1px solid #D6E2CC',
                fontSize: 14,
                minWidth: 0,
              }}
            />
            <button
              type="button"
              disabled={
                allocatePending ||
                !allocateInput ||
                Number(allocateInput) <= 0 ||
                Number(allocateInput) > availableBalance
              }
              onClick={() => {
                const amount = Number(allocateInput)
                if (amount > 0 && amount <= availableBalance) {
                  onAllocate(amount)
                  setAllocateInput('')
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: '#3E6B4F',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                opacity:
                  allocatePending || !allocateInput || Number(allocateInput) <= 0 || Number(allocateInput) > availableBalance
                    ? 0.5
                    : 1,
                flexShrink: 0,
              }}
            >
              Guardar
            </button>
          </div>
        )}

        {/* Phase 11: retirar Kreds da meta de volta pro saldo — corrige meta/valor errado */}
        {goalId && onDeallocate && savings > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <input
              type="number"
              min={1}
              max={savings}
              value={deallocateInput}
              onChange={(e) => setDeallocateInput(e.target.value)}
              placeholder="Quanto retirar?"
              aria-label={`Quanto retirar de ${title}`}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 12,
                border: '1px solid #D6E2CC',
                fontSize: 14,
                minWidth: 0,
              }}
            />
            <button
              type="button"
              disabled={
                allocatePending ||
                !deallocateInput ||
                Number(deallocateInput) <= 0 ||
                Number(deallocateInput) > savings
              }
              onClick={() => {
                const amount = Number(deallocateInput)
                if (amount > 0 && amount <= savings) {
                  onDeallocate(amount)
                  setDeallocateInput('')
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid #D6E2CC',
                background: '#ffffff',
                color: 'var(--color-kreds-orange)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                opacity:
                  allocatePending || !deallocateInput || Number(deallocateInput) <= 0 || Number(deallocateInput) > savings
                    ? 0.5
                    : 1,
                flexShrink: 0,
              }}
            >
              Retirar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
