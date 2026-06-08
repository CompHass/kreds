'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function NewGoalPage() {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amount = parseInt(targetAmount, 10)
    if (!title.trim() || title.trim().length > 100) {
      setError('Título deve ter entre 1 e 100 caracteres.')
      return
    }
    if (!Number.isInteger(amount) || amount < 1 || amount > 99999) {
      setError('Valor alvo deve ser entre 1 e 99.999 Kreds.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/child/${childId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), targetAmount: amount }),
      })

      if (res.ok) {
        router.push(`/child/${childId}/balance`)
        return
      }

      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao criar sonho.')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        background: 'rgba(255,248,245,0.9)',
        backdropFilter: 'blur(20px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(194,201,187,0.2)',
        gap: '16px',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: '#154212',
            fontSize: '20px',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#154212' }}>
          Plantar Novo Sonho
        </h1>
      </header>

      <main style={{
        padding: '96px 24px 40px',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>🌱</div>
          <p style={{ margin: 0, fontSize: '15px', color: '#42493e', lineHeight: 1.5 }}>
            Defina um sonho para guardar Kreds.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#42493e',
            }}>
              Nome do sonho
            </label>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="ex: Bicicleta nova"
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(45,90,39,0.16)',
                background: 'rgba(255,255,255,0.82)',
                fontSize: '15px',
                color: '#154212',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#42493e',
            }}>
              Valor alvo (Kreds)
            </label>
            <input
              type="number"
              min={1}
              max={99999}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              disabled={loading}
              placeholder="ex: 500"
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(45,90,39,0.16)',
                background: 'rgba(255,255,255,0.82)',
                fontSize: '15px',
                color: '#154212',
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px', fontWeight: 600 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !title || !targetAmount}
            style={{
              padding: '16px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '16px',
              cursor: loading || !title || !targetAmount ? 'not-allowed' : 'pointer',
              opacity: loading || !title || !targetAmount ? 0.5 : 1,
              boxShadow: '0 8px 24px rgba(45,90,39,0.2)',
            }}
          >
            {loading ? 'Plantando...' : '🌱 Plantar Sonho'}
          </button>
        </form>
      </main>
    </>
  )
}
