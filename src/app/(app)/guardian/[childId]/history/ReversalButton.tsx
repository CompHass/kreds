'use client'

import { useState } from 'react'

export default function ReversalButton({ 
  childId, 
  transactionId, 
  transactionType 
}: { 
  childId: string
  transactionId: string
  transactionType: string
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  if (transactionType === 'reversal' || transactionType === 'firstfruits_withholding') {
    return null
  }

  async function handleReversal() {
    if (!confirm('Tem certeza que deseja estornar esta transação?')) {
      return
    }

    setStatus('loading')
    const commandId = crypto.randomUUID()

    try {
      const response = await fetch(`/api/ledger/${childId}/post-reversal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId,
          targetTransactionId: transactionId,
          reason: 'Estorno solicitado pelo guardião',
        }),
      })

      if (response.ok) {
        setStatus('success')
        window.location.reload()
        return
      }

      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      onClick={handleReversal}
      disabled={status === 'loading' || status === 'success'}
      style={{
        fontSize: '0.6875rem',
        color: status === 'error' ? 'var(--color-danger, #ba1a1a)' : 'var(--color-text-soft, #72796e)',
        background: 'rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '99px',
        padding: '2px 10px',
        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        fontWeight: 600,
      }}
    >
      {status === 'loading' ? 'Processando...' : 
       status === 'success' ? 'Estornado' : 
       status === 'error' ? 'Erro' : 'Estornar'}
    </button>
  )
}
