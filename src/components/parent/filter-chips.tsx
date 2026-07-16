'use client'

// PTASK-03: FilterChips — chip "Todas" + um chip por criança.
// Chip selecionado: bg #3E6B4F, texto branco. Chip inativo: bg #FBFAF5, border #E2DECF.
// aria-pressed em cada chip; apenas um ativo por vez (controlado pelo pai).

import { ChildAvatar } from '@/components/avatar/child-avatar'

interface ChildChip {
  id: string
  displayName: string
  accentColor: string
  avatarPreset: string
}

interface FilterChipsProps {
  familyChildren: ChildChip[]
  active: 'all' | string
  onChange: (filter: 'all' | string) => void
}

export function FilterChips({ familyChildren, active, onChange }: FilterChipsProps) {
  const allChips: Array<{
    id: string
    displayName: string
    accentColor?: string
    avatarPreset?: string
  }> = [{ id: 'all', displayName: 'Todas' }, ...familyChildren]

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '16px 0',
        flexWrap: 'wrap',
      }}
    >
      {allChips.map((chip) => {
        const isActive = active === chip.id

        return (
          <button
            key={chip.id}
            onClick={() => onChange(chip.id as 'all' | string)}
            aria-pressed={isActive}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isActive ? '#3E6B4F' : 'var(--color-kreds-card)',
              border: `1px solid ${isActive ? '#3E6B4F' : '#E2DECF'}`,
              color: isActive ? '#ffffff' : 'var(--color-kreds-text)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {/* Mini avatar 24px para chips de criança — preset ilustrado (Phase 14) */}
            {chip.id !== 'all' && chip.accentColor && (
              <ChildAvatar
                displayName={chip.displayName}
                accentColor={chip.accentColor}
                avatarPreset={chip.avatarPreset ?? 'initial'}
                size={24}
                background={chip.accentColor}
              />
            )}
            {chip.displayName}
          </button>
        )
      })}
    </div>
  )
}
