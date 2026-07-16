'use client'

// Phase 9 — Client Component raiz do painel /reports. Clone estrutural de
// children-panel-view.tsx: Sidebar + Topbar + GuardianProfileDrawer
// page-local, com a área de conteúdo trocada por navegação de ciclo +
// lista de ChildReportCard.

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { GuardianProfileDrawer } from './guardian-profile-drawer'
import { ChildReportCard } from './child-report-card'
import type { FamilyWeeklyReport } from '@/types/report'
import { getPreviousCycleStart, getNextCycleStart, getCurrentCycleStart } from '@/lib/cycles/current-cycle'

interface ReportsPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string
  report: FamilyWeeklyReport
  recentCycles: string[]
}

function formatCycleLabel(cycleStart: string): string {
  const start = new Date(`${cycleStart}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function ReportsPanelView({
  familyId,
  familyName,
  currentUserName,
  guardianEmail,
  report,
  recentCycles,
}: ReportsPanelViewProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const guardianInitial = currentUserName.charAt(0).toUpperCase()
  const isCurrentCycle = report.cycleStart === getCurrentCycleStart()

  function goToCycle(cycleStart: string) {
    router.push(`/family/${familyId}/reports?cycle=${cycleStart}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-kreds-bg)',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <ParentSidebar
        guardianInitial={guardianInitial}
        onOpenProfile={() => setProfileOpen(true)}
        familyId={familyId}
        activeRoute="reports"
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ParentTopbar
          familyName={familyName}
          currentUserName={currentUserName}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Navegação de ciclo: anterior / rótulo / próximo (D-esco: histórico navegável) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              aria-label="Ciclo anterior"
              onClick={() => goToCycle(getPreviousCycleStart(report.cycleStart))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: '1px solid var(--color-kreds-border)',
                background: 'var(--color-kreds-card)',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>

            <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C', minWidth: 140, textAlign: 'center' }}>
              {formatCycleLabel(report.cycleStart)}
            </span>

            <button
              aria-label="Próximo ciclo"
              onClick={() => goToCycle(getNextCycleStart(report.cycleStart))}
              disabled={isCurrentCycle}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: '1px solid var(--color-kreds-border)',
                background: 'var(--color-kreds-card)',
                cursor: isCurrentCycle ? 'default' : 'pointer',
                opacity: isCurrentCycle ? 0.4 : 1,
              }}
            >
              ›
            </button>

            <div style={{ flex: 1 }} />

            {/* Atalhos para os últimos ciclos */}
            <select
              aria-label="Selecionar ciclo"
              value={report.cycleStart}
              onChange={(e) => goToCycle(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                border: '1px solid var(--color-kreds-border)',
                background: 'var(--color-kreds-card)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-kreds-text)',
              }}
            >
              {recentCycles.map((c) => (
                <option key={c} value={c}>
                  {formatCycleLabel(c)}
                </option>
              ))}
            </select>
          </div>

          {report.children.length === 0 ? (
            <span style={{ fontSize: 14, color: 'var(--color-kreds-muted)' }}>
              Nenhuma criança ativa nesta família.
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {report.children.map((child) => (
                <ChildReportCard key={child.childId} report={child} />
              ))}
            </div>
          )}
        </div>
      </main>

      <GuardianProfileDrawer
        open={profileOpen}
        guardianName={currentUserName}
        guardianEmail={guardianEmail}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  )
}
