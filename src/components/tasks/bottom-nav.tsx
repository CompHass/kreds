'use client'

// CTASK-05: BottomNav fixo 80px com 4 ícones e IntersectionObserver
import React, { useEffect, useState } from 'react'

type Section = 'garden' | 'tasks' | 'savings'

interface NavItem {
  key: string
  label: string
  section?: string
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'garden', label: 'Jardim', section: 'section-garden' },
  { key: 'tasks', label: 'Tarefas', section: 'section-tasks' },
  { key: 'savings', label: 'Cofrinho', section: 'section-savings' },
  { key: 'donate', label: 'Doar', disabled: true },
]

function IconJardim() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M12 12C12 12 8 9 8 5a4 4 0 0 1 8 0c0 4-4 7-4 7z" />
      <path d="M12 12C12 12 16 9.5 18 7" />
      <path d="M12 12C12 12 9 10 7 8" />
      <path d="M5 22h14" />
    </svg>
  )
}

function IconTarefas() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
      <path d="M3 9h18" />
    </svg>
  )
}

function IconCofrinho() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9c0-3.866-3.134-7-7-7S5 5.134 5 9c0 2.13.945 4.04 2.44 5.35L7 20h10l-.44-5.65A6.978 6.978 0 0 0 19 9z" />
      <path d="M12 6v3" />
      <path d="M9.5 20.5h5" />
      <path d="M21 9h-2" />
    </svg>
  )
}

function IconDoar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

const ICONS: Record<string, () => React.ReactElement> = {
  garden: IconJardim,
  tasks: IconTarefas,
  savings: IconCofrinho,
  donate: IconDoar,
}

export function BottomNav() {
  const [active, setActive] = useState<Section>('garden')

  useEffect(() => {
    const gardenEl = document.getElementById('section-garden')
    const tasksEl = document.getElementById('section-tasks')
    const savingsEl = document.getElementById('section-savings')

    const sectionMap = new Map<Element, Section>()
    if (gardenEl) sectionMap.set(gardenEl, 'garden')
    if (tasksEl) sectionMap.set(tasksEl, 'tasks')
    if (savingsEl) sectionMap.set(savingsEl, 'savings')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const section = sectionMap.get(entry.target)
            if (section) setActive(section)
          }
        }
      },
      { threshold: [0, 0.1] },
    )

    sectionMap.forEach((_, el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: 'rgba(248,247,242,0.93)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderTop: '1px solid #E7E2D6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
        maxWidth: 392,
        margin: '0 auto',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = !item.disabled && active === item.key
        const Icon = ICONS[item.key]
        const color = isActive ? '#3E6B4F' : '#9AA092'

        if (item.disabled) {
          return (
            <button
              key={item.key}
              aria-label={item.label}
              aria-disabled="true"
              tabIndex={-1}
              onClick={() => {}}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: '#9AA092',
                cursor: 'default',
                padding: '8px 12px',
                minWidth: 60,
              }}
            >
              <Icon />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9AA092',
                }}
              >
                {item.label}
              </span>
            </button>
          )
        }

        return (
          <button
            key={item.key}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => item.section && scrollTo(item.section)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              color,
              cursor: 'pointer',
              padding: '8px 12px',
              minWidth: 60,
            }}
          >
            <Icon />
            <span
              style={{
                fontSize: 12,
                fontWeight: isActive ? 700 : 600,
                color,
              }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
