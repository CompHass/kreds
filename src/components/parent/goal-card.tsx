'use client'

// Phase 11 — GoalCard: mostra a meta ativa de um filho (ou "sem meta" com
// botão criar). Mesma linguagem visual de child-report-card.tsx.

import type { GoalView } from '@/types/goal'

interface GoalCardProps {
  childId: string
  displayName: string
  accentColor: string
  goal: GoalView | null
  onCreate: () => void
  onEdit: () => void
  onArchive: () => void
}

function formatDueDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-')
  return `${d}/${m}/${y}`
}

export function GoalCard({ childId: _childId, displayName, accentColor, goal, onCreate, onEdit, onArchive }: GoalCardProps) {
  const pct =
    goal && goal.targetAmount > 0
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
        padding: 20,
        borderRadius: 24,
        background: 'var(--color-kreds-card)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            fontWeight: 700,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>{displayName}</span>
        <div style={{ flex: 1 }} />
        {goal ? (
          <>
            <button
              aria-label={`Editar meta de ${displayName}`}
              onClick={onEdit}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-kreds-border)',
                background: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-kreds-text)',
                cursor: 'pointer',
              }}
            >
              Editar
            </button>
            <button
              aria-label={`Arquivar meta de ${displayName}`}
              onClick={onArchive}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-kreds-border)',
                background: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-kreds-orange)',
                cursor: 'pointer',
              }}
            >
              Arquivar
            </button>
          </>
        ) : (
          <button
            aria-label={`Criar meta para ${displayName}`}
            onClick={onCreate}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'var(--color-kreds-primary)',
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            + Criar meta
          </button>
        )}
      </div>

      {goal ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-kreds-text)' }}>
              {goal.title}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
              {goal.allocatedAmount}/{goal.targetAmount} Kreds
              {goal.dueDate ? ` · até ${formatDueDate(goal.dueDate)}` : ''}
            </span>
          </div>
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
        </>
      ) : (
        <span style={{ fontSize: 13, color: 'var(--color-kreds-muted)' }}>Sem meta ativa</span>
      )}
    </div>
  )
}
