'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AuthInput } from '@/components/auth/auth-input'
import { SpinnerButton } from '@/components/auth/spinner-button'
import { resendGuardianEmailCodeAction, verifyGuardianEmailAction } from '@/app/actions/guardian-verify-email'

const RESEND_COOLDOWN = 60 // seconds — client-side rate limit between resends

export function GuardianVerifyForm({ userId }: { userId: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [info, setInfo] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // No pending cookie → the user landed here without a fresh signup (cookie
  // expired or they came directly). Nothing to verify; show a safe fallback.
  const noPending = !userId

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCooldown() {
    setResendIn(RESEND_COOLDOWN)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return n - 1
      })
    }, 1000)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (noPending) { setError('Sua sessão expirou. Cadastre-se novamente.'); return }
    if (!code.trim()) return
    setLoading(true); setError(null); setInfo(null)
    try {
      const result = await verifyGuardianEmailAction({ code })
      if (!result.ok) setError(result.error)
      // On ok: signIn throws NEXT_REDIRECT → handled below by re-throw.
    } catch (caught) {
      if (caught && typeof caught === 'object' && 'digest' in caught
        && String((caught as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) throw caught
      setError('Não foi possível verificar o código. Tente novamente.')
    } finally { setLoading(false) }
  }

  async function resend() {
    if (resendIn > 0 || resending) return
    setResending(true); setError(null); setInfo(null)
    try {
      const result = await resendGuardianEmailCodeAction()
      if (result.ok) {
        setInfo('Enviamos um novo código para o seu e-mail.')
        startCooldown()
      } else {
        setError(result.error)
      }
    } catch {
      setError('Não foi possível reenviar o código. Tente novamente em instantes.')
    } finally { setResending(false) }
  }

  const dotIcon = <span aria-hidden="true" style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />

  if (noPending) {
    return (
      <form className="flex flex-col" style={{ gap: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-kreds-text)' }}>Verificar e-mail</h1>
          <p style={{ color: 'var(--color-kreds-muted)' }}>Sua sessão expirou. Cadastre-se novamente para receber um novo código.</p>
        </div>
        <Link href="/signup" style={{ color: '#3E6B4F', fontSize: 14, fontWeight: 500 }}>Ir para o cadastro</Link>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-kreds-text)' }}>Verifique seu e-mail</h1>
        <p style={{ color: 'var(--color-kreds-muted)' }}>Digite o código de 6 dígitos que enviamos para o seu e-mail.</p>
      </div>
      <AuthInput
        id="verify-code"
        name="code"
        icon={dotIcon}
        label="Código de verificação"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={20}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error && <p role="alert" style={{ color: 'var(--color-kreds-error)', fontSize: 13 }}>{error}</p>}
      {info && !error && <p role="status" style={{ color: '#3E6B4F', fontSize: 13 }}>{info}</p>}
      <SpinnerButton loading={loading} disabled={!code.trim()}>Verificar</SpinnerButton>
      <button
        type="button"
        onClick={resend}
        disabled={resendIn > 0 || resending}
        style={{
          background: 'none',
          border: 'none',
          cursor: resendIn > 0 || resending ? 'default' : 'pointer',
          fontSize: 13,
          fontWeight: 500,
          color: resendIn > 0 ? 'var(--color-kreds-muted)' : '#3E6B4F',
          padding: 0,
        }}
      >
        {resending ? 'Enviando…' : resendIn > 0 ? `Reenviar código em ${resendIn}s` : 'Reenviar código'}
      </button>
    </form>
  )
}
