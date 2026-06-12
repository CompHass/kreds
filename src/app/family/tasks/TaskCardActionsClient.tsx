'use client'

import { useState } from 'react'

type Props = {
  taskId: string
  taskTitle: string
  kredsValue: number
  isActive: boolean
}

export function TaskCardActionsClient({ taskId, taskTitle, kredsValue, isActive }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(taskTitle)
  const [kreds, setKreds] = useState(String(kredsValue))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function patch(body: object) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/families/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Erro ao atualizar.')
        return false
      }
      return true
    } catch {
      setError('Erro de conexão.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    const k = parseInt(kreds, 10)
    if (!title.trim() || isNaN(k) || k < 1) {
      setError('Título obrigatório e Kreds deve ser maior que 0.')
      return
    }
    const ok = await patch({ action: 'update', title: title.trim(), kredsValue: k })
    if (ok) {
      setOpen(false)
      window.location.reload()
    }
  }

  async function handleToggle() {
    const action = isActive ? 'deactivate' : 'reactivate'
    const ok = await patch({ action })
    if (ok) {
      setOpen(false)
      window.location.reload()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '12px',
          border: '1px solid rgba(194,201,187,0.5)',
          background: 'transparent',
          color: '#154212',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <span>🔄</span>
        Editar Missão
      </button>

      {open ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#154212' }}>
                Editar Missão
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#72796e' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#42493e', textTransform: 'uppercase' }}>
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(45,90,39,0.2)',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#42493e', textTransform: 'uppercase' }}>
                Kreds
              </label>
              <input
                type="number"
                min="1"
                value={kreds}
                onChange={(e) => setKreds(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(45,90,39,0.2)',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            {error ? (
              <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px',
                borderRadius: '99px',
                background: 'linear-gradient(135deg, #3b6934, #154212)',
                color: '#fff',
                fontWeight: 700,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>

            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              style={{
                padding: '10px',
                borderRadius: '99px',
                background: isActive ? 'rgba(186,26,26,0.08)' : 'rgba(59,105,52,0.08)',
                color: isActive ? '#b91c1c' : '#3b6934',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: `1px solid ${isActive ? 'rgba(186,26,26,0.2)' : 'rgba(59,105,52,0.2)'}`,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {isActive ? 'Desativar missão' : 'Reativar missão'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
