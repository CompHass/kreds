'use client'

// PTASK-02: Topbar 64px com breadcrumb do nome da família em verde + badge do usuário.
// D-09: Badge clicável abre o drawer de perfil do guardian via onOpenProfile.

interface ParentTopbarProps {
  familyName: string
  currentUserName: string
  onOpenProfile: () => void
}

export function ParentTopbar({ familyName, currentUserName, onOpenProfile }: ParentTopbarProps) {
  return (
    <header
      style={{
        height: 64,
        borderBottom: '1px solid var(--color-kreds-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: 'var(--color-kreds-card)',
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb: nome da família em verde */}
      <span
        style={{
          color: 'var(--color-kreds-primary)',
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        {familyName}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* D-09: Badge do usuário logado — clicável para abrir drawer de perfil */}
      <div
        onClick={onOpenProfile}
        role="button"
        aria-label="Abrir perfil"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpenProfile()}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#ffffff',
          border: '1px solid #ECE7DB',
          borderRadius: 'var(--radius-pill)',
          padding: '5px 10px 5px 14px',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-kreds-muted)',
          }}
        >
          {currentUserName}
        </span>

        {/* Avatar circular 32px com inicial do nome */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {currentUserName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
