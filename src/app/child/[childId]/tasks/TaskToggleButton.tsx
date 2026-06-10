'use client'

import { useState } from 'react'

export function TaskToggleButton({
  taskId,
  childId,
  initialStatus,
}: {
  taskId: string
  childId: string
  initialStatus: 'pending' | 'completed'
}) {
  const [status, setStatus] = useState<'pending' | 'completed'>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)

    try {
      const action = status === 'pending' ? 'complete' : 'uncomplete'
      const res = await fetch(
        `/api/child/${childId}/tasks/${taskId}/toggle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        },
      )

      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
      } else {
        setError('Erro ao atualizar. Tente novamente.')
      }
    } catch (err) {
      setError('Erro ao atualizar. Tente novamente.')
      console.error('Toggle error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'pending') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            border: '1px solid #2d5a27',
            background: 'transparent',
            color: '#2d5a27',
            borderRadius: '9999px',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(45,90,39,0.08)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {loading ? '...' : 'Marcar como feita'}
        </button>
        {error && (
          <p
            style={{
              color: '#dc2626',
              fontSize: '12px',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(59,105,52,0.15)',
          color: '#3b6934',
          borderRadius: '9999px',
          padding: '4px 12px',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '13px' }}>✓ Feita</span>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            color: '#72796e',
            fontSize: '12px',
            cursor: loading ? 'default' : 'pointer',
            border: 'none',
            background: 'none',
            padding: '4px 0 4px 8px',
            fontWeight: 500,
            textDecoration: 'underline',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.opacity = '0.7'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {loading ? '...' : 'Desmarcar'}
        </button>
      </div>
      {error && (
        <p
          style={{
            color: '#dc2626',
            fontSize: '12px',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
