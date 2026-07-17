'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AuthInput } from '@/components/auth/auth-input'
import { SpinnerButton } from '@/components/auth/spinner-button'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { loginWithCredentials } from '@/app/actions/guardian-auth'

/** Ícone envelope (e-mail) */
function IconEnvelope() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M1 4l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Ícone cadeado (senha) */
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 7V5a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
    </svg>
  )
}

/** Ícone olho aberto */
function IconEyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Ícone olho fechado */
function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2l12 12M6.5 6.5A2 2 0 0 0 9.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 4.5C2.5 5.7 1 8 1 8s2.5 5 7 5c1.5 0 2.8-.4 3.9-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12.5 11.5C13.7 10.3 15 8 15 8s-2.5-5-7-5c-.7 0-1.4.1-2 .3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Formulário de login do responsável.
 * GAUTH-01: e-mail/senha via signIn('zitadel') (Server Action loginWithCredentials).
 * GAUTH-02: botões sociais Google/Apple/Passkey via SocialAuthButtons.
 * GAUTH-04: SpinnerButton com kredsSpin durante loading.
 */
export function GuardianLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmpty = !email.trim() || !password.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isEmpty) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      const result = await loginWithCredentials(formData)
      if (!result.ok) setError(result.error)
    } catch (e) {
      // signIn() throws NEXT_REDIRECT to trigger navigation — must re-throw
      if (e && typeof e === 'object' && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) {
        throw e
      }
      const msg = e instanceof Error ? e.message : String(e ?? 'Erro ao fazer login')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '20px' }}>
      {/* Título e subtítulo */}
      <div className="flex flex-col gap-1">
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--color-kreds-text)',
          }}
        >
          Bem-vindo de volta
        </h1>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--color-kreds-muted)',
          }}
        >
          Entre com sua conta familiar
        </p>
      </div>

      {/* Campos e-mail e senha */}
      <div className="flex flex-col gap-3">
        <AuthInput
          id="email"
          label="E-mail"
          icon={<IconEnvelope />}
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <AuthInput
          id="password"
          label="Senha"
          icon={<IconLock />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-kreds-muted)',
              }}
            >
              {showPassword ? <IconEyeOff /> : <IconEyeOpen />}
            </button>
          }
        />
      </div>

      {/* Esqueci senha */}
      <div className="flex items-center justify-end">
        <Link
          href="/login/reset"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#3E6B4F',
            textDecoration: 'none',
          }}
        >
          Esqueci minha senha
        </Link>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div
          role="alert"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-kreds-error)',
            backgroundColor: 'rgba(177,74,46,.08)',
            borderRadius: '8px',
            padding: '10px 12px',
          }}
        >
          {error}
        </div>
      )}

      {/* Botão Entrar */}
      <SpinnerButton loading={loading} disabled={isEmpty}>
        Entrar na conta
      </SpinnerButton>

      {/* Divisor */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ECE7DB' }} />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-kreds-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          ou continue com
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ECE7DB' }} />
      </div>

      {/* Botões sociais */}
      <SocialAuthButtons />

      {/* Rodapé */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-kreds-muted)',
        }}
      >
        Não tem conta?{' '}
        <Link
          href="/signup"
          style={{
            color: '#3E6B4F',
            textDecoration: 'none',
          }}
        >
          Criar conta
        </Link>
      </p>
    </form>
  )
}
