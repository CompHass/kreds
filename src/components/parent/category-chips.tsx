'use client'

// PTASK-06: CategoryChips — chips de categoria no form do painel direito.
// Controlado: recebe value + onChange, sem estado interno.

import { CATEGORY_META, type Category } from '@/lib/seed/parent-seed'

interface CategoryChipsProps {
  value: Category | null
  onChange: (category: Category) => void
}

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  const categories = Object.keys(CATEGORY_META) as Category[]

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
      }}
    >
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat]
        const isSelected = value === cat

        return (
          <button
            key={cat}
            aria-pressed={isSelected}
            onClick={() => onChange(cat)}
            style={{
              border: `1.5px solid ${isSelected ? meta.color : '#E2DECF'}`,
              borderRadius: 'var(--radius-chip)',
              background: isSelected ? meta.color : 'var(--color-kreds-card)',
              color: isSelected ? '#ffffff' : 'var(--color-kreds-text)',
              fontSize: 13,
              fontWeight: 600,
              padding: '5px 12px',
              cursor: 'pointer',
              transition: 'background .15s ease, border-color .15s ease, color .15s ease',
            }}
          >
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
