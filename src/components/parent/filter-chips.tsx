'use client'

// PTASK-03: FilterChips — chip "Todas" + um chip por criança.
// Chip selecionado: bg #3E6B4F, texto branco. Chip inativo: bg #FBFAF5, border #E2DECF.
// aria-pressed em cada chip; apenas um ativo por vez (controlado pelo pai).

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
  const allChips: Array<{ id: string; displayName: string; accentColor?: string }> = [
    { id: 'all', displayName: 'Todas' },
    ...familyChildren,
  ]

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
            {/* Mini avatar 24px para chips de criança */}
            {chip.id !== 'all' && chip.accentColor && (
              <span
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: chip.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                {chip.displayName.charAt(0).toUpperCase()}
              </span>
            )}
            {chip.displayName}
          </button>
        )
      })}
    </div>
  )
}
