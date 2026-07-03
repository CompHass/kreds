'use client'

// PTASK-05: CategoryIcon — SVG inline por categoria com cor e fundo suave.
// Usa CATEGORY_META do parent-seed para obter color e softBg por categoria.

import { type Category, CATEGORY_META } from '@/lib/seed/parent-seed'

interface CategoryIconProps {
  category: Category
  size?: number
}

function IconQuarto({ stroke }: { stroke: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Cama / quarto */}
      <path d="M3 9v9" />
      <path d="M21 9v9" />
      <path d="M3 13h18" />
      <path d="M3 9a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5" />
      <path d="M7 13v4" />
      <path d="M17 13v4" />
    </svg>
  )
}

function IconHigiene({ stroke }: { stroke: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Escova de dentes / higiene */}
      <path d="M8 3h8" />
      <path d="M12 3v6" />
      <circle cx="12" cy="13" r="4" />
      <path d="M12 17v4" />
    </svg>
  )
}

function IconEstudos({ stroke }: { stroke: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Livro / estudos */}
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h5" />
    </svg>
  )
}

function IconCasa({ stroke }: { stroke: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Casa */}
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconEspiritual({ stroke }: { stroke: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Cruz / espiritual */}
      <path d="M12 2v20" />
      <path d="M5 7h14" />
    </svg>
  )
}

function IconPet({ stroke }: { stroke: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Patinha */}
      <circle cx="7" cy="6" r="1.5" />
      <circle cx="12" cy="4.5" r="1.5" />
      <circle cx="17" cy="6" r="1.5" />
      <circle cx="5" cy="11" r="1.5" />
      <path d="M12 22c-3.5 0-6-2-6-5 0-2.5 2-4 4-5.5.7-.5 1.3-1 2-1s1.3.5 2 1c2 1.5 4 3 4 5.5 0 3-2.5 5-6 5z" />
    </svg>
  )
}

const CATEGORY_ICONS: Record<Category, (props: { stroke: string }) => React.ReactElement> = {
  quarto: IconQuarto,
  higiene: IconHigiene,
  estudos: IconEstudos,
  casa: IconCasa,
  espiritual: IconEspiritual,
  pet: IconPet,
}

import React from 'react'

export function CategoryIcon({ category, size = 44 }: CategoryIconProps) {
  const { color, softBg } = CATEGORY_META[category]
  const Icon = CATEGORY_ICONS[category]

  return (
    <div
      data-category={category}
      style={{
        width: size,
        height: size,
        borderRadius: 13,
        background: softBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon stroke={color} />
    </div>
  )
}
