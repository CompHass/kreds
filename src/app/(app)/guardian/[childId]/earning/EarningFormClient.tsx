'use client'

import { useState } from 'react'

export default function EarningFormClient({ childId }: { childId: string }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const commandId = crypto.randomUUID()

    try {
      const response = await fetch(`/api/ledger/${childId}/post-earning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId,
          amount: Number.parseInt(amount, 10),
          note: note || undefined,
        }),
      })

      if (response.ok) {
        setStatus('success')
        setAmount('')
        setNote('')
        return
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      setErrorMessage(payload?.error || 'Não foi possível registrar o ganho')
      setStatus('error')
    } catch {
      setErrorMessage('Não foi possível registrar o ganho')
      setStatus('error')
    }
  }

  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="amount" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted, #42493e)', textTransform: 'uppercase' }}>
          Valor do Ganho (Kreds)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="1"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Ex: 50"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            background: 'rgba(255,255,255,0.5)',
            fontSize: '0.9375rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="note" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted, #42493e)', textTransform: 'uppercase' }}>
          Observação / Tarefa
        </label>
        <textarea
          id="note"
          name="note"
          placeholder="Ex: Limpeza do jardim ou tarefa semanal concluída"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          style={{
            minHeight: '100px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            background: 'rgba(255,255,255,0.5)',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '14px',
          borderRadius: '99px',
          background: 'linear-gradient(135deg, #3b6934, #154212)',
          color: '#fff',
          fontWeight: 700,
          border: 'none',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          boxShadow: '0 8px 20px rgba(45,90,39,0.15)',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
      >
        {status === 'loading' ? 'Registrando...' : 'Registrar Ganho'}
      </button>

      {status === 'success' && (
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success, #3b6934)', textAlign: 'center', margin: 0 }}>
          ✓ Ganho registrado com sucesso!
        </p>
      )}
      {status === 'error' && errorMessage && (
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger, #ba1a1a)', textAlign: 'center', margin: 0 }}>
          ✕ {errorMessage}
        </p>
      )}
    </form>
  )
}
