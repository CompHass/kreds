'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function SetPinPage() {
  const { childId } = useParams<{ childId: string }>()
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN deve ter 4 a 6 dígitos numéricos.')
      return
    }
    if (pin !== confirm) {
      setError('Os PINs não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/families/children/${childId}/set-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/family/children'), 1500)
        return
      }

      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao salvar PIN.')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '48px 24px',
      maxWidth: '400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      <div>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #154212)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '24px',
          }}
        >
          ← Voltar
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--color-primary, #154212)',
        }}>
          Definir PIN
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: '#72796e' }}>
          A criança usará este PIN para acessar o app.
        </p>
      </div>

      {success ? (
        <div style={{
          padding: '16px',
          borderRadius: '16px',
          background: 'rgba(59,105,52,0.08)',
          border: '1px solid rgba(59,105,52,0.2)',
          color: '#3b6934',
          fontWeight: 600,
        }}>
          PIN salvo com sucesso! Redirecionando...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#42493e' }}>
              PIN (4 a 6 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              placeholder="••••"
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(45,90,39,0.16)',
                background: 'rgba(255,255,255,0.82)',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#42493e' }}>
              Confirmar PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              placeholder="••••"
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid rgba(45,90,39,0.16)',
                background: 'rgba(255,255,255,0.82)',
                fontSize: '1rem',
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin || !confirm}
            style={{
              padding: '14px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading || !pin || !confirm ? 'not-allowed' : 'pointer',
              opacity: loading || !pin || !confirm ? 0.5 : 1,
            }}
          >
            {loading ? 'Salvando...' : 'Salvar PIN'}
          </button>
        </form>
      )}
    </main>
  )
}
