'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AuthInput } from '@/components/auth/auth-input'
import { SpinnerButton } from '@/components/auth/spinner-button'
import { requestGuardianPasswordResetAction } from '@/app/actions/guardian-reset'

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

/** Ícone seta voltar */
function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Ícone check círculo verde (estado de confirmação) */
function IconCheckCircle() {
  return (
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#E7EFE8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12l4.5 4.5L19 7"
          stroke="#3E6B4F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/**
 * Mascara o e-mail: mantém 3 chars antes de ***, domínio completo.
 * Ex.: ana@email.com → ana***@email.com
 *      ab@email.com  → ab***@email.com
 */
function maskEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex < 0) return email
  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex)
  const visible = local.slice(0, 3)
  return `${visible}***${domain}`
}

/**
 * Formulário de redefinição de senha com 2 estados.
 * GAUTH-05: estado 'form' (input e-mail) → estado 'sent' (confirmação com e-mail mascarado).
 * T-02-ENUM-EMAIL: confirmação genérica — não revela se o e-mail existe.
 */
export function PasswordResetForm() {
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await requestGuardianPasswordResetAction(email)
    } finally {
      setLoading(false)
      setStep('sent')
    }
  }

  if (step === 'sent') {
    return (
      <div className="flex flex-col" style={{ gap: '24px' }}>
        {/* Ícone check */}
        <IconCheckCircle />

        {/* Título e copy */}
        <div className="flex flex-col gap-2">
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: 'var(--color-kreds-text)',
            }}
          >
            E-mail enviado!
          </h1>
          <p
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--color-kreds-muted)',
              lineHeight: 1.5,
            }}
          >
            Enviamos o link para {maskEmail(email)}. Verifique sua caixa de entrada.
          </p>
        </div>

        {/* Botão Reenviar */}
        <button
          type="button"
          onClick={() => {
            setStep('form')
          }}
          style={{
            height: '52px',
            borderRadius: '13px',
            border: '1.5px solid #E2DECF',
            backgroundColor: 'transparent',
            color: '#3E6B4F',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Reenviar e-mail
        </button>

        {/* Link Voltar ao login */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/login"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-kreds-hint)',
              textDecoration: 'underline',
            }}
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  // Estado 'form'
  return (
    <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '24px' }}>
      {/* Seta voltar */}
      <Link
        href="/login"
        aria-label="Voltar"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          border: '1.5px solid #E2DECF',
          backgroundColor: 'transparent',
          color: 'var(--color-kreds-text)',
          textDecoration: 'none',
        }}
      >
        <IconArrowLeft />
      </Link>

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
          Redefinir senha
        </h1>
        <p
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--color-kreds-muted)',
          }}
        >
          Digite seu e-mail para receber o link
        </p>
      </div>

      {/* Campo e-mail */}
      <AuthInput
        id="reset-email"
        label="E-mail"
        icon={<IconEnvelope />}
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      {/* Botão Enviar link */}
      <SpinnerButton loading={loading} disabled={!email.trim()}>
        Enviar link
      </SpinnerButton>
    </form>
  )
}
