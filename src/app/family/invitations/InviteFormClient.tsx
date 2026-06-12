'use client'

import { useState } from 'react'

export default function InviteFormClient() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setInviteLink(null)

    try {
      const res = await fetch('/api/families/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar convite.')
        return
      }

      setInviteLink(data.inviteLink)
      setEmail('')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            htmlFor="email"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-text-muted, #42493e)',
              textTransform: 'uppercase',
            }}
          >
            Endereço de E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              background: 'rgba(255,255,255,0.5)',
              fontSize: '0.9375rem',
            }}
          />
        </div>

        {error ? (
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px',
            borderRadius: '99px',
            background: 'linear-gradient(135deg, #3b6934, #154212)',
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            boxShadow: '0 8px 20px rgba(45,90,39,0.15)',
          }}
        >
          {submitting ? 'Enviando...' : 'Enviar Convite'}
        </button>
      </form>

      {inviteLink ? (
        <div
          style={{
            background: 'rgba(59,105,52,0.06)',
            border: '1px solid rgba(59,105,52,0.2)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#3b6934' }}>
            ✓ Convite criado! Compartilhe o link:
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--color-text-soft, #72796e)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}
          >
            {inviteLink}
          </p>
          <button
            type="button"
            onClick={copyLink}
            style={{
              padding: '8px 16px',
              borderRadius: '99px',
              background: copied ? '#3b6934' : 'rgba(59,105,52,0.1)',
              color: copied ? '#fff' : '#3b6934',
              fontWeight: 700,
              fontSize: '0.8125rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
