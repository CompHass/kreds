// GARD-06: Badge de estação com dot colorido

import { SEASON_DOT_COLORS } from '@/lib/seed/garden-seed'

const SEASON_LABELS: Record<'primavera' | 'verao' | 'outono' | 'inverno', string> = {
  primavera: 'Primavera',
  verao: 'Verão',
  outono: 'Outono',
  inverno: 'Inverno',
}

interface SeasonBadgeProps {
  season: 'primavera' | 'verao' | 'outono' | 'inverno'
}

export function SeasonBadge({ season }: SeasonBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--color-kreds-card)',
        border: '1px solid var(--color-kreds-border)',
        borderRadius: 'var(--radius-pill)',
        padding: '4px 10px',
      }}
    >
      {/* Dot colorido da estação */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: SEASON_DOT_COLORS[season],
          flexShrink: 0,
        }}
      />
      {/* Label da estação */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.4,
          color: 'var(--color-kreds-text)',
        }}
      >
        {SEASON_LABELS[season]}
      </span>
    </div>
  )
}
