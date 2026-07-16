'use client'

// Phase 9 — card de resumo semanal por filho: tarefas concluídas, Kreds
// ganhos, dízimo separado e progresso de poupança. Mesma linguagem visual de
// ChildCard (avatar por inicial + accentColor).

import type { ChildWeeklyReport } from '@/types/report'
import { ChildAvatar } from '@/components/avatar/child-avatar'

interface ChildReportCardProps {
  report: ChildWeeklyReport
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 96 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-kreds-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: 17, fontWeight: 700, color: '#27372C' }}>{value}</span>
    </div>
  )
}

export function ChildReportCard({ report }: ChildReportCardProps) {
  const savingsPct =
    report.savingsGoal && report.savingsGoal > 0
      ? Math.min(100, Math.round(((report.savingsAllocated ?? 0) / report.savingsGoal) * 100))
      : null

  return (
    <div
      data-testid="child-report-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        padding: 20,
        borderRadius: 24,
        background: 'var(--color-kreds-card)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ChildAvatar
          displayName={report.displayName}
          accentColor={report.accentColor}
          avatarPreset={report.avatarPreset}
          size={52}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
            {report.displayName}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-kreds-muted)' }}>
            {report.tasksCompleted}/{report.tasksTotal} tarefas concluídas
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Stat label="Kreds ganhos" value={`${report.kredsEarned}`} />
        <Stat label="Dízimo separado" value={`${report.firstfruitsSeparated}`} />
        <Stat
          label="Poupança"
          value={
            report.savingsGoal
              ? `${report.savingsAllocated ?? 0}/${report.savingsGoal}`
              : 'Sem meta'
          }
        />
      </div>

      {savingsPct !== null && (
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
              width: `${savingsPct}%`,
              height: '100%',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-kreds-water)',
              transition: 'width .6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      )}
    </div>
  )
}
