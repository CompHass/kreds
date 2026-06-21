'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyChildPin } from '@/app/actions/child-auth'
import { PinDots } from './pin-dots'
import { NumericKeypad } from './numeric-keypad'
import { GateLock } from './gate-lock'

interface PinScreenProps {
  childId: string
  familyId: string
  displayName: string
}

export function PinScreen({ childId, familyId, displayName }: PinScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleDigit(d: string) {
    if (error || gateOpen || pending) return
    if (pin.length >= 4) return

    const newPin = pin + d

    if (newPin.length === 4) {
      setPin(newPin)
      setPending(true)
      try {
        const result = await verifyChildPin(childId, newPin)

        if ('success' in result && result.success) {
          // CAUTH-03: animação de portão + redirect após 1.1s
          setGateOpen(true)
          setTimeout(() => {
            router.push(`/child/${childId}/garden`)
          }, 1100)
        } else {
          // CAUTH-02: shake + reset após 950ms (SEM texto de erro — 02-UI-SPEC Copywriting)
          setError(true)
          setTimeout(() => {
            setPin('')
            setError(false)
          }, 950)
        }
      } finally {
        setPending(false)
      }
    } else {
      setPin(newPin)
    }
  }

  function handleBackspace() {
    if (error || gateOpen || pending) return
    setPin((p) => p.slice(0, -1))
  }

  function handleTrocarPerfil() {
    setPin('')
    setError(false)
    router.push(`/family/access/${familyId}`)
  }

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. Logo */}
      <div style={{ marginBottom: 120 }}>
        <svg
          width="80"
          height="32"
          viewBox="0 0 80 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Kreds"
        >
          {/* Folha bicolor */}
          <path
            d="M12 4 C12 4 4 10 4 16 C4 22 8 26 12 26 C16 26 20 22 20 16 C20 10 12 4 12 4Z"
            fill="#3E6B4F"
          />
          <path
            d="M12 4 C12 4 20 10 20 16 C20 22 16 26 12 26 L12 4Z"
            fill="#5A8A66"
          />
          {/* Wordmark "kreds" */}
          <text
            x="26"
            y="21"
            fontFamily="inherit"
            fontSize="15"
            fontWeight="500"
            fill="#27372C"
          >
            kreds
          </text>
        </svg>
      </div>

      {/* 2. Plant hero SVG — kredsBreath */}
      <div
        style={{
          marginBottom: 32,
          animation: 'var(--animate-kreds-breath)',
        }}
      >
        <svg
          width="80"
          height="100"
          viewBox="0 0 80 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Vaso */}
          <rect x="28" y="78" width="24" height="16" rx="3" fill="#C3B99A" />
          <rect x="25" y="74" width="30" height="6" rx="2" fill="#B5A98A" />
          {/* Terra */}
          <ellipse cx="40" cy="78" rx="12" ry="3" fill="#7A6B4F" />
          {/* Caule principal */}
          <line x1="40" y1="78" x2="40" y2="45" stroke="#5A8A66" strokeWidth="3" strokeLinecap="round" />
          {/* Folha esquerda grande */}
          <path d="M40 60 C30 55 22 45 26 36 C30 27 40 35 40 50" fill="#3E6B4F" />
          {/* Folha direita grande */}
          <path d="M40 60 C50 55 58 45 54 36 C50 27 40 35 40 50" fill="#5A8A66" />
          {/* Folha esquerda pequena */}
          <path d="M40 48 C32 44 28 37 31 31 C34 25 40 32 40 44" fill="#3E6B4F" />
          {/* Folha direita pequena */}
          <path d="M40 48 C48 44 52 37 49 31 C46 25 40 32 40 44" fill="#5A8A66" />
          {/* Broto no topo */}
          <circle cx="40" cy="32" r="6" fill="#5A8A66" />
          <circle cx="40" cy="26" r="4" fill="#3E6B4F" />
        </svg>
      </div>

      {/* 3. Saudação — CAUTH-01 */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--color-kreds-text)',
          margin: 0,
          marginBottom: 24,
          letterSpacing: '-0.01em',
        }}
      >
        Olá, {displayName}!
      </h1>

      {/* 4. Dots do PIN — CAUTH-02 (shake no container) */}
      <div style={{ marginBottom: 32 }}>
        <PinDots count={pin.length} error={error} />
      </div>

      {/* 5. Teclado numérico */}
      <div style={{ marginBottom: 24 }}>
        <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>

      {/* 6. Link "Trocar perfil" — CAUTH-04 */}
      <button
        type="button"
        onClick={handleTrocarPerfil}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-kreds-hint)',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontFamily: 'inherit',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'
        }}
      >
        Trocar perfil
      </button>

      {/* Overlay de portão — CAUTH-03 */}
      <GateLock open={gateOpen} />
    </div>
  )
}
