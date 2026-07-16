'use client'

// Phase 11 — GoalCard: mostra uma meta (um filho pode ter várias em
// paralelo). Mesma linguagem visual de child-report-card.tsx.

import type { GoalView } from '@/types/goal'

interface GoalCardProps {
  goal: GoalView
  onEdit: () => void
  onArchive: () => void
}

function formatDueDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-')
  return `${d}/${m}/${y}`
}

export function GoalCard({ goal, onEdit, onArchive }: GoalCardProps) {
  const pct =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.allocatedAmount / goal.targetAmount) * 100))
      : 0

  return (
    <div
      data-testid="goal-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        padding: 16,
        borderRadius: 18,
        background: '#ffffff',
        border: '1px solid var(--color-kreds-border)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-kreds-text)' }}>
          {goal.title}
          {goal.status === 'achieved' && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-kreds-primary)' }}>
              ✓ Concluída
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            aria-label={`Editar meta ${goal.title}`}
            onClick={onEdit}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-kreds-border)',
              background: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-kreds-text)',
              cursor: 'pointer',
            }}
          >
            Editar
          </button>
          <button
            aria-label={`Arquivar meta ${goal.title}`}
            onClick={onArchive}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-kreds-border)',
              background: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-kreds-orange)',
              cursor: 'pointer',
            }}
          >
            Arquivar
          </button>
        </div>
      </div>

      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
        {goal.allocatedAmount}/{goal.targetAmount} Kreds
        {goal.dueDate ? ` · até ${formatDueDate(goal.dueDate)}` : ''}
      </span>

      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-kreds-hover)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-kreds-water)',
            transition: 'width .6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}
