'use client'

import { signOut } from 'next-auth/react'

export interface GuardianProfileDrawerProps {
  open: boolean
  guardianName: string
  guardianEmail: string
  onClose: () => void
}

export function GuardianProfileDrawer({
  open,
  guardianName,
  guardianEmail,
  onClose,
}: GuardianProfileDrawerProps) {
  return (
    <>
      {/* Backdrop — fecha ao clicar fora do painel */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(39, 55, 44, 0.25)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          zIndex: 40,
        }}
      />

      {/* Painel do drawer — desliza da direita */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Perfil do responsável"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          background: 'var(--color-kreds-card)',
          borderLeft: '1px solid var(--color-kreds-border)',
          boxShadow: 'var(--shadow-card)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(.76, 0, .24, 1)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          gap: 16,
        }}
      >
        {/* Avatar circular com inicial do nome */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            color: '#ffffff',
            flexShrink: 0,
            alignSelf: 'center',
          }}
        >
          {guardianName.charAt(0).toUpperCase()}
        </div>

        {/* Nome do guardian */}
        <div
          style={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 18,
            color: '#27372C',
          }}
        >
          {guardianName}
        </div>

        {/* Email do guardian */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--color-kreds-muted)',
          }}
        >
          {guardianEmail}
        </div>

        {/* Separador */}
        <div
          style={{
            height: 1,
            background: 'var(--color-kreds-border)',
            margin: '8px 0',
          }}
        />

        {/* Botão de logout — empurrado para o final do painel */}
        <button
          autoFocus
          onClick={() => signOut({ redirectTo: '/login' })}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 13,
            background: 'var(--color-kreds-primary)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cta)',
            marginTop: 'auto',
          }}
        >
          Sair
        </button>
      </div>
    </>
  )
}
