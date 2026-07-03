'use client'

// PTASK-01: Sidebar fixa 80px com logo, 5 nav icons SVG inline e avatar no rodapé.
// Ícones com aria-label obrigatório (sem texto visível). Item ativo calculado via usePathname.
//
// BUGFIX (os-menus-laterais-nao-estao-fu): sidebar original não tinha nenhuma navegação —
// botões eram puramente decorativos (sem onClick/Link). Apenas "Tarefas" e "Crianças" têm
// rota real dentro do painel do responsável hoje; os demais ícones (Jardim, Relatórios,
// Configurações) ainda não têm seção implementada e ficam desabilitados (mesmo padrão de
// aria-disabled usado em src/components/tasks/bottom-nav.tsx), evitando linkar para uma
// rota que não representa a funcionalidade esperada (ex.: /family/dashboard é só um
// redirect stub de volta para /family/[familyId]/tasks, não uma seção "Jardim" real).

import type { CSSProperties, ReactElement } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ParentSidebarProps {
  familyId: string
}

interface NavItemDef {
  key: string
  label: string
  href: string | null
}

// SVGs inline por ícone — preservados do design original (PTASK-01).
const NAV_ICONS: Record<string, (color: string) => ReactElement> = {
  tasks: (color) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
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
  ),
  children: (color) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </svg>
  ),
  garden: (color) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22V12" />
      <path d="M12 12C12 12 8 9 8 5a4 4 0 0 1 8 0c0 4-4 7-4 7z" />
      <path d="M5 22h14" />
    </svg>
  ),
  reports: (color) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  settings: (color) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

export function ParentSidebar({ familyId }: ParentSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItemDef[] = [
    { key: 'tasks', label: 'Tarefas', href: `/family/${familyId}/tasks` },
    { key: 'children', label: 'Crianças', href: '/family/children' },
    { key: 'garden', label: 'Jardim', href: null },
    { key: 'reports', label: 'Relatórios', href: null },
    { key: 'settings', label: 'Configurações', href: null },
  ]

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
        {navItems.map((item) => {
          const isActive = item.href !== null && pathname === item.href
          const iconColor = isActive ? '#3E6B4F' : '#9AA092'
          const buttonStyle: CSSProperties = {
            width: 44,
            height: 44,
            borderRadius: 12,
            background: isActive ? '#E7EFE8' : 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: item.href ? 'pointer' : 'default',
            flexShrink: 0,
          }

          const icon = NAV_ICONS[item.key](iconColor)

          if (item.href === null) {
            // Seção ainda não implementada no painel novo (Claude's Discretion,
            // mesmo padrão de bottom-nav.tsx) — desabilitado, sem navegação falsa.
            return (
              <button
                key={item.key}
                aria-label={item.label}
                aria-disabled="true"
                tabIndex={-1}
                onClick={() => {}}
                style={buttonStyle}
              >
                {icon}
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={buttonStyle}
            >
              {icon}
            </Link>
          )
        })}
      </div>

      {/* Avatar 38px no rodapé */}
      <div
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
        }}
      >
        P
      </div>
    </aside>
  )
}
