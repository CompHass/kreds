'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthInput } from '@/components/auth/auth-input'
import { SpinnerButton } from '@/components/auth/spinner-button'
import { signupGuardian } from '@/app/actions/guardian-signup'

export function GuardianSignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const mismatch = Boolean(confirmPassword) && password !== confirmPassword

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password || mismatch) return
    setLoading(true); setError(null)
    try {
      const data = new FormData(event.currentTarget)
      const result = await signupGuardian(data)
      if (!result.ok) {
        setError(result.error)
      } else {
        // Account created + ZITADEL has emailed a verification code.
        // Send the user to the in-app verify screen.
        router.push(`/verify?userID=${encodeURIComponent(result.userId)}`)
      }
    } catch (caught) {
      if (caught && typeof caught === 'object' && 'digest' in caught && String((caught as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) throw caught
      setError('Não foi possível criar a conta. Tente novamente.')
    } finally { setLoading(false) }
  }

  const icon = <span aria-hidden="true" style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
  return <form onSubmit={submit} className="flex flex-col" style={{ gap: '18px' }}>
    <div><h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-kreds-text)' }}>Criar conta</h1><p style={{ color: 'var(--color-kreds-muted)' }}>Comece a cuidar da sua família</p></div>
    <AuthInput id="signup-email" name="email" icon={icon} label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
    <AuthInput id="signup-password" name="password" icon={icon} label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
    <AuthInput id="signup-confirm-password" name="confirmPassword" icon={icon} label="Confirmar senha" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
    {mismatch && <p role="alert" style={{ color: 'var(--color-kreds-error)', fontSize: '13px' }}>As senhas precisam ser iguais.</p>}
    {error && <p role="alert" style={{ color: 'var(--color-kreds-error)', fontSize: '13px' }}>{error}</p>}
    <SpinnerButton loading={loading} disabled={!email.trim() || !password || mismatch}>Criar conta</SpinnerButton>
    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-kreds-muted)' }}>Já tem conta? <Link href="/login" style={{ color: '#3E6B4F' }}>Entrar</Link></p>
  </form>
}
