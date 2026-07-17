'use client'

import { useState } from 'react'
import { confirmGuardianPasswordResetAction } from '@/app/actions/guardian-reset'
import { AuthInput } from '@/components/auth/auth-input'
import { SpinnerButton } from '@/components/auth/spinner-button'

export function GuardianResetConfirmForm({ userId, code }: { userId: string; code: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const icon = <span aria-hidden="true" style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null)
    if (!password || password !== confirmation) { setError('As senhas precisam ser iguais.'); return }
    setLoading(true)
    const result = await confirmGuardianPasswordResetAction({ userId, code, password })
    setLoading(false)
    if (result.ok) setDone(true); else setError(result.error)
  }
  if (done) return <div><h1 style={{ fontSize: 24, fontWeight: 700 }}>Senha redefinida!</h1><p style={{ color: 'var(--color-kreds-muted)' }}>Você já pode entrar com sua nova senha.</p></div>
  return <form onSubmit={submit} className="flex flex-col" style={{ gap: 18 }}>
    <div><h1 style={{ fontSize: 24, fontWeight: 700 }}>Criar nova senha</h1><p style={{ color: 'var(--color-kreds-muted)' }}>Escolha uma senha para sua conta.</p></div>
    <AuthInput id="new-password" icon={icon} label="Nova senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
    <AuthInput id="confirm-password" icon={icon} label="Confirmar senha" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
    {error && <p role="alert" style={{ color: 'var(--color-kreds-error)', fontSize: 13 }}>{error}</p>}
    <SpinnerButton loading={loading} disabled={!password || !confirmation}>Salvar senha</SpinnerButton>
  </form>
}
