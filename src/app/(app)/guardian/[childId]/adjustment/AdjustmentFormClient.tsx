'use client'

import { useState } from 'react'

function parseErrorMessage(responseStatus: number, payload: { error?: string } | null): string {
  if (responseStatus === 422 && payload?.error?.includes('Saldo insuficiente')) {
    return 'Saldo insuficiente para este ajuste'
  }

  if (responseStatus === 422) {
    return 'Revise os campos do formulário'
  }

  return 'Não foi possível registrar o ajuste'
}

export default function AdjustmentFormClient({ childId }: { childId: string }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [restorationNote, setRestorationNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const commandId = crypto.randomUUID()

    try {
      const response = await fetch(`/api/ledger/${childId}/post-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId,
          familyId: '00000000-0000-0000-0000-000000000000',
          guardianIdentityId: '00000000-0000-0000-0000-000000000000',
          childProfileId: childId,
          amount: Number.parseInt(amount, 10),
          reason,
          restorationNote: restorationNote || undefined,
        }),
      })

      if (response.ok) {
        setStatus('success')
        setAmount('')
        setReason('')
        setRestorationNote('')
        return
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      setErrorMessage(parseErrorMessage(response.status, payload))
      setStatus('error')
    } catch {
      setErrorMessage('Não foi possível registrar o ajuste')
      setStatus('error')
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-semibold text-slate-700">
          Valor do ajuste
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="1"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-semibold text-slate-700">
          Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          placeholder="Ex.: Tarefa não completada"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="restorationNote" className="text-sm font-semibold text-slate-700">
          Restoration note
        </label>
        <textarea
          id="restorationNote"
          name="restorationNote"
          placeholder="Opcional: note de restauração"
          value={restorationNote}
          onChange={(event) => setRestorationNote(event.target.value)}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </div>

      <button
        type="submit"
        className="rounded-full bg-amber-700 px-6 py-3 font-semibold text-white"
        disabled={status === 'loading'}
      >
        Registrar Ajuste
      </button>

      {status === 'success' && (
        <p className="text-sm font-medium text-green-600">Ajuste registrado com sucesso</p>
      )}
      {status === 'error' && errorMessage && (
        <p className="text-sm font-medium text-red-600">{errorMessage}</p>
      )}
    </form>
  )
}
