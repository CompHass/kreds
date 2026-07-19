'use client'

// Phase 13 — Guardian step-up PIN screen. Espelho estrutural de pin-screen.tsx
// (CAUTH-01..04), reaproveitando PinDots / NumericKeypad / GateLock para manter
// a UX simétrica criança ↔ guardião. Diferenciais:
//  - chama verifyGuardianPin (family-shared PIN), não verifyChildPin;
//  - em sucesso redireciona ao painel /family/{id}/tasks (não ao jardim);
//  - sem o link "Trocar perfil" (o guardião usa o header do painel para sair).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyGuardianPin } from '@/app/actions/guardian-pin'
import { PinDots } from './pin-dots'
import { NumericKeypad } from './numeric-keypad'
import { GateLock } from './gate-lock'

interface GuardianPinScreenProps {
  familyId: string
  guardianName: string
}

export function GuardianPinScreen({ familyId, guardianName }: GuardianPinScreenProps) {
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
        const result = await verifyGuardianPin(familyId, newPin)

        if ('success' in result && result.success) {
          // Animação de portão + redirect ao painel após 1.1s (mesmo padrão CAUTH-03)
          setGateOpen(true)
          setTimeout(() => {
            router.push(`/family/${familyId}/tasks`)
          }, 1100)
        } else {
          // Shake + reset (SEM texto de erro — consistente com 02-UI-SPEC Copywriting)
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

  function handleBack() {
    router.push(`/family/access/${familyId}`)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(120% 100% at 50% 0%, #ECE7DB 0%, #E0DACB 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. Logo */}
      <div>
        <svg
          width="80"
          height="32"
          viewBox="0 0 80 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Kreds"
        >
          <path
            d="M12 4 C12 4 4 10 4 16 C4 22 8 26 12 26 C16 26 20 22 20 16 C20 10 12 4 12 4Z"
            fill="#3E6B4F"
          />
          <path
            d="M12 4 C12 4 20 10 20 16 C20 22 16 26 12 26 L12 4Z"
            fill="#5A8A66"
          />
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

      {/* Espaço flexível: mínimo 24px em viewports baixos (Safari iOS), até 120px em telas altas */}
      <div aria-hidden="true" style={{ flexGrow: 1, minHeight: 24, maxHeight: 120 }} />

      {/* 2. Plant hero SVG — kredsBreath */}
      <div
        style={{
          marginBottom: 24,
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
          <rect x="28" y="78" width="24" height="16" rx="3" fill="#C3B99A" />
          <rect x="25" y="74" width="30" height="6" rx="2" fill="#B5A98A" />
          <ellipse cx="40" cy="78" rx="12" ry="3" fill="#7A6B4F" />
          <line x1="40" y1="78" x2="40" y2="45" stroke="#5A8A66" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 60 C30 55 22 45 26 36 C30 27 40 35 40 50" fill="#3E6B4F" />
          <path d="M40 60 C50 55 58 45 54 36 C50 27 40 35 40 50" fill="#5A8A66" />
          <path d="M40 48 C32 44 28 37 31 31 C34 25 40 32 40 44" fill="#3E6B4F" />
          <path d="M40 48 C48 44 52 37 49 31 C46 25 40 32 40 44" fill="#5A8A66" />
          <circle cx="40" cy="32" r="6" fill="#5A8A66" />
          <circle cx="40" cy="26" r="4" fill="#3E6B4F" />
        </svg>
      </div>

      {/* 3. Saudação */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--color-kreds-text)',
          margin: 0,
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        Olá, {guardianName}!
      </h1>

      {/* 4. Dots do PIN */}
      <div style={{ marginBottom: 24 }}>
        <PinDots count={pin.length} error={error} />
      </div>

      {/* 5. Teclado numérico */}
      <div style={{ marginBottom: 16 }}>
        <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>

      {/* 6. Voltar ao seletor de perfis */}
      <button
        type="button"
        onClick={handleBack}
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
      >
        Voltar
      </button>

      {/* Overlay de portão */}
      <GateLock open={gateOpen} />
    </div>
  )
}
