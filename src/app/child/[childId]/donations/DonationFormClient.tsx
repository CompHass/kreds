'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  childId: string
}

export function DonationFormClient({ childId }: Props) {
  const router = useRouter()
  const [targetLabel, setTargetLabel] = useState('')
  const [amountKreds, setAmountKreds] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate fields
    if (!targetLabel.trim()) {
      setError('Informe para quem ou quê você quer fazer a doação.')
      return
    }

    const amount = parseInt(amountKreds, 10)
    if (!Number.isInteger(amount) || amount < 1) {
      setError('A quantidade deve ser um número inteiro positivo.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/child/${childId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLabel: targetLabel.trim(), amountKreds: amount }),
      })

      if (res.ok) {
        setTargetLabel('')
        setAmountKreds('')
        router.refresh()
        return
      }

      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao registrar doação.')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '0.5px solid rgba(45,90,39,0.1)',
        boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
        borderRadius: '28px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <label style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#2d5a27',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Para quem ou quê?
        </span>
        <input
          type="text"
          value={targetLabel}
          onChange={(e) => setTargetLabel(e.target.value)}
          disabled={loading}
          placeholder="Ex: Organização beneficente"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(45,90,39,0.2)',
            background: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            color: '#154212',
            fontFamily: 'inherit',
          }}
        />
      </label>

      <label style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#2d5a27',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Quantidade em Kreds
        </span>
        <input
          type="number"
          min={1}
          value={amountKreds}
          onChange={(e) => setAmountKreds(e.target.value)}
          disabled={loading}
          placeholder="Ex: 50"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(45,90,39,0.2)',
            background: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            color: '#154212',
            fontFamily: 'inherit',
          }}
        />
      </label>

      {error && (
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#b91c1c',
          fontWeight: 600,
          padding: '10px 12px',
          background: 'rgba(185,28,28,0.08)',
          borderRadius: '8px',
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !targetLabel.trim() || !amountKreds}
        style={{
          padding: '12px 24px',
          borderRadius: '9999px',
          border: 'none',
          background: '#154212',
          color: '#fff',
          fontWeight: 700,
          fontSize: '14px',
          cursor: loading || !targetLabel.trim() || !amountKreds ? 'not-allowed' : 'pointer',
          opacity: loading || !targetLabel.trim() || !amountKreds ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? '⏳ Registrando...' : '💚 Doe Kreds'}
      </button>
    </form>
  )
}
