'use client'

// Phase 13 — Guardian first-time PIN setup screen. Cliente.
// Pede o PIN duas vezes (criar + confirmar), chama setGuardianPin, e em sucesso
// a action já emite o guardian-session — redirecionamos direto ao painel.
//
// Visual intencionalmente sóbrio (sem plantas/animações): este é um setup de
// segurança, não um onboarding lúdico. Cores e raios seguem o design system
// (var(--color-kreds-*), radius-pill) já usado em settings-panel-view.tsx.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setGuardianPin } from '@/app/actions/guardian-pin'

interface GuardianSetupScreenProps {
  familyId: string
}

export function GuardianSetupScreen({ familyId }: GuardianSetupScreenProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [firstPin, setFirstPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  function isValidPin(pin: string) {
    return /^\d{4,6}$/.test(pin)
  }

  async function handleConfirm() {
    setError(null)
    if (!isValidPin(firstPin)) {
      setError('O PIN deve ter entre 4 e 6 dígitos.')
      return
    }
    if (firstPin !== confirmPin) {
      setError('Os PINs não coincidem.')
      return
    }
    setPending(true)
    try {
      const result = await setGuardianPin(familyId, firstPin, confirmPin)
      if ('success' in result && result.success) {
        // guardian-session já emitido pela action — direto ao painel.
        router.push(`/family/${familyId}/tasks`)
      } else if ('error' in result) {
        if (result.error === 'unauthorized') {
          setError('Não autorizado. Faça login novamente.')
        } else if (result.error === 'mismatch') {
          setError('Os PINs não coincidem.')
        } else if (result.error === 'invalid') {
          setError('O PIN deve ter entre 4 e 6 dígitos.')
        } else {
          setError('Não foi possível salvar o PIN. Tente novamente.')
        }
      }
    } finally {
      setPending(false)
    }
  }

  function handleDigit(d: string, target: 'create' | 'confirm') {
    const setter = target === 'create' ? setFirstPin : setConfirmPin
    const value = target === 'create' ? firstPin : confirmPin
    if (value.length >= 6) return
    setter(value + d)
    setError(null)
  }

  function handleBackspace(target: 'create' | 'confirm') {
    const setter = target === 'create' ? setFirstPin : setConfirmPin
    const value = target === 'create' ? firstPin : confirmPin
    setter(value.slice(0, -1))
    setError(null)
  }

  // Keypad reúsa o mesmo NumericKeypad do PIN da criança — UX consistente.
  const currentPin = step === 'create' ? firstPin : confirmPin
  const digitsShown = step === 'create' ? firstPin.length : confirmPin.length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(120% 100% at 50% 0%, #ECE7DB 0%, #E0DACB 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 48,
      }}
    >
      <div style={{ marginBottom: 64 }}>
        <svg width="80" height="32" viewBox="0 0 80 32" fill="none" aria-label="Kreds">
          <path
            d="M12 4 C12 4 4 10 4 16 C4 22 8 26 12 26 C16 26 20 22 20 16 C20 10 12 4 12 4Z"
            fill="#3E6B4F"
          />
          <path
            d="M12 4 C12 4 20 10 20 16 C20 22 16 26 12 26 L12 4Z"
            fill="#5A8A66"
          />
          <text x="26" y="21" fontFamily="inherit" fontSize="15" fontWeight="500" fill="#27372C">
            kreds
          </text>
        </svg>
      </div>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--color-kreds-text)',
          margin: 0,
          marginBottom: 8,
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        {step === 'create' ? 'Crie seu PIN de responsável' : 'Confirme o PIN'}
      </h1>
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-kreds-muted)',
          margin: 0,
          marginBottom: 32,
          textAlign: 'center',
          maxWidth: 280,
        }}
      >
        {step === 'create'
          ? 'Usado para acessar o painel de gerenciamento. Não compartilhe com as crianças.'
          : 'Digite novamente o PIN para confirmar.'}
      </p>

      {/* Dots — espelha PinDots visualmente, inline para não acoplar estado */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i < digitsShown ? 'var(--color-kreds-text)' : 'transparent',
              border: `1.5px solid var(--color-kreds-text)`,
              opacity: i < digitsShown ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <Keypad
        onDigit={(d) => handleDigit(d, step)}
        onBackspace={() => handleBackspace(step)}
      />

      {error && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-kreds-error)',
            marginTop: 16,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {step === 'confirm' && (
          <button
            type="button"
            onClick={() => {
              setStep('create')
              setFirstPin('')
              setConfirmPin('')
              setError(null)
            }}
            disabled={pending}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-pill)',
              border: '1.5px solid var(--color-kreds-border)',
              background: 'transparent',
              color: 'var(--color-kreds-text)',
              fontSize: 14,
              fontWeight: 700,
              cursor: pending ? 'default' : 'pointer',
            }}
          >
            Voltar
          </button>
        )}

        {step === 'create' ? (
          <button
            type="button"
            onClick={() => {
              if (isValidPin(firstPin)) {
                setStep('confirm')
                setError(null)
              } else {
                setError('O PIN deve ter entre 4 e 6 dígitos.')
              }
            }}
            disabled={pending}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'var(--color-kreds-primary)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: pending ? 'default' : 'pointer',
            }}
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending || !isValidPin(confirmPin)}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background:
                pending || !isValidPin(confirmPin)
                  ? 'var(--color-kreds-border)'
                  : 'var(--color-kreds-primary)',
              color: pending || !isValidPin(confirmPin) ? 'var(--color-kreds-muted)' : '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: pending || !isValidPin(confirmPin) ? 'default' : 'pointer',
            }}
          >
            {pending ? 'Salvando…' : 'Salvar PIN'}
          </button>
        )}
      </div>
    </div>
  )
}

// Keypad local — mesmo leiaute do NumericKeypad mas importá-lo exigiria expandir
// sua API (target). Mantemos aqui para o setup ficar autocontido.
function Keypad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 72px)',
        gap: 12,
        marginBottom: 16,
      }}
    >
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onDigit(k)}
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            border: 'none',
            background: '#ffffff',
            color: 'var(--color-kreds-text)',
            fontSize: 28,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {k}
        </button>
      ))}
      <div />
      <button
        type="button"
        onClick={() => onDigit('0')}
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          border: 'none',
          background: '#ffffff',
          color: 'var(--color-kreds-text)',
          fontSize: 28,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        0
      </button>
      <button
        type="button"
        onClick={onBackspace}
        aria-label="Apagar"
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          border: 'none',
          background: 'transparent',
          color: 'var(--color-kreds-muted)',
          fontSize: 24,
          cursor: 'pointer',
        }}
      >
        ⌫
      </button>
    </div>
  )
}
