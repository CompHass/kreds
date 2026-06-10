'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WishlistGoal } from '@/modules/goals/queries'

type Props = {
  goal: WishlistGoal
  childId: string
  availableBalance: number
}

export default function GoalCard({ goal, childId, availableBalance }: Props) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const progress = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.allocatedAmount / goal.targetAmount) * 100))
    : 0
  const remaining = goal.targetAmount - goal.allocatedAmount
  const achieved = goal.status === 'achieved'

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amt = parseInt(amount, 10)
    if (!Number.isInteger(amt) || amt < 1) {
      setError('Valor inválido.')
      return
    }
    if (amt > availableBalance) {
      setError('Saldo disponível insuficiente.')
      return
    }
    if (amt > remaining) {
      setError(`Máximo restante: ${remaining} Kreds.`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/child/${childId}/goals/${goal.id}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })

      if (res.ok) {
        setAmount('')
        setShowForm(false)
        router.refresh()
        return
      }

      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao alocar.')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: achieved ? 'rgba(59,105,52,0.06)' : 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: achieved
        ? '1px solid rgba(59,105,52,0.2)'
        : '0.5px solid rgba(45,90,39,0.1)',
      boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
      borderRadius: '28px',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: 700, color: '#2d5a27' }}>
            {achieved ? '🏆 ' : '🌱 '}{goal.title}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#72796e' }}>
            {goal.allocatedAmount} / {goal.targetAmount} Kreds
          </p>
        </div>
        <span style={{
          fontSize: '22px',
          fontWeight: 800,
          color: achieved ? '#3b6934' : '#154212',
        }}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '8px',
        borderRadius: '9999px',
        background: 'rgba(45,90,39,0.1)',
        overflow: 'hidden',
        marginBottom: achieved ? 0 : '16px',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          borderRadius: '9999px',
          background: achieved
            ? 'linear-gradient(90deg, #3b6934, #65a30d)'
            : 'linear-gradient(90deg, #a1d494, #3b6934)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {!achieved && (
        <>
          {!showForm ? (
            availableBalance > 0 && remaining > 0 ? (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(59,105,52,0.3)',
                  background: 'rgba(59,105,52,0.08)',
                  color: '#3b6934',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Alocar Kreds
              </button>
            ) : (
              <p style={{ margin: 0, fontSize: '12px', color: '#72796e', textAlign: 'center' }}>
                {availableBalance === 0 ? 'Sem saldo disponível' : 'Meta alcançada!'}
              </p>
            )
          ) : (
            <form onSubmit={handleAllocate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min={1}
                  max={Math.min(availableBalance, remaining)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  placeholder={`1 – ${Math.min(availableBalance, remaining)}`}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(45,90,39,0.2)',
                    background: 'rgba(255,255,255,0.9)',
                    fontSize: '14px',
                    color: '#154212',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !amount}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#154212',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: loading || !amount ? 'not-allowed' : 'pointer',
                    opacity: loading || !amount ? 0.5 : 1,
                  }}
                >
                  {loading ? '...' : 'Alocar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(null) }}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid rgba(45,90,39,0.16)',
                    background: 'transparent',
                    color: '#72796e',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ✕
                </button>
              </div>
              {error && (
                <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>{error}</p>
              )}
              <p style={{ margin: 0, fontSize: '11px', color: '#72796e' }}>
                Disponível: {availableBalance} Kreds · Restante: {remaining} Kreds
              </p>
            </form>
          )}
        </>
      )}
    </div>
  )
}
