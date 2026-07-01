'use client'

// PTASK-01: Sidebar fixa 80px com logo, 5 nav icons SVG inline e avatar no rodapé.
// Ícones com aria-label obrigatório (sem texto visível). Primeiro ícone (tarefas) ativo.
// D-08: Botão circular no rodapé com inicial dinâmica abre o drawer de perfil (onOpenProfile).

interface ParentSidebarProps {
  guardianInitial: string
  onOpenProfile: () => void
}

export function ParentSidebar({ guardianInitial, onOpenProfile }: ParentSidebarProps) {
  return (
    <aside
      data-testid="parent-sidebar"
      style={{
        width: 80,
        minHeight: '100vh',
        background: 'var(--color-kreds-card)',
        borderRight: '1px solid var(--color-kreds-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        flexShrink: 0,
      }}
    >
      {/* Logo 40×40px — gradiente verde */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M11 19V11"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M11 11C11 11 7 8 7 4a4 4 0 0 1 8 0c0 4-4 7-4 7z"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 19h14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Nav icons — 5 botões 44×44px com SVG inline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* 1. Tarefas — ativo */}
        <button
          aria-label="Tarefas"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#E7EFE8',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3E6B4F"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
            <path d="M3 9h18" />
          </svg>
        </button>

        {/* 2. Crianças */}
        <button
          aria-label="Crianças"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9AA092"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
          </svg>
        </button>

        {/* 3. Jardim */}
        <button
          aria-label="Jardim"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9AA092"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22V12" />
            <path d="M12 12C12 12 8 9 8 5a4 4 0 0 1 8 0c0 4-4 7-4 7z" />
            <path d="M5 22h14" />
          </svg>
        </button>

        {/* 4. Relatórios */}
        <button
          aria-label="Relatórios"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9AA092"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
        </button>

        {/* 5. Configurações */}
        <button
          aria-label="Configurações"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9AA092"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* D-08: Botão de perfil 38px no rodapé — inicial dinâmica + abre drawer ao clicar */}
      <button
        aria-label="Abrir perfil"
        onClick={onOpenProfile}
        style={{
          marginTop: 'auto',
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: '#ffffff',
          flexShrink: 0,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {guardianInitial}
      </button>
    </aside>
  )
}
