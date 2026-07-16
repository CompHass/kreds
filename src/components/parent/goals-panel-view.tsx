'use client'

// Phase 11 — Client Component raiz do painel /goals. Clone estrutural de
// children-panel-view.tsx: Sidebar + Topbar + GuardianProfileDrawer
// page-local, lista de GoalCard por filho + GoalFormPanel à direita.

import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { GuardianProfileDrawer } from './guardian-profile-drawer'
import { GoalCard } from './goal-card'
import { GoalFormPanel, EMPTY_GOAL_FORM } from './goal-form-panel'
import { createGoal, updateGoal, archiveGoal } from '@/app/actions/goals'
import type { GoalFormData, GoalView } from '@/types/goal'

interface ChildSummary {
  id: string
  displayName: string
  accentColor: string
}

interface GoalsPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string
  children: ChildSummary[]
  initialGoals: Record<string, GoalView | null>
}

export function GoalsPanelView({
  familyId,
  familyName,
  currentUserName,
  guardianEmail,
  children,
  initialGoals,
}: GoalsPanelViewProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [goals, setGoals] = useState(initialGoals)
  // editingChildId: qual filho tem o GoalFormPanel aberto; null = nenhum
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [editingMode, setEditingMode] = useState<'create' | 'edit'>('create')

  const guardianInitial = currentUserName.charAt(0).toUpperCase()
  const editingChild = children.find((c) => c.id === editingChildId) ?? null
  const editingGoal = editingChildId ? goals[editingChildId] : null

  async function handleSave(data: GoalFormData) {
    if (!editingChildId) return
    try {
      if (editingMode === 'create') {
        const saved = await createGoal(familyId, editingChildId, data)
        setGoals((prev) => ({
          ...prev,
          [editingChildId]: {
            id: saved.id,
            childId: editingChildId,
            title: saved.title,
            targetAmount: saved.targetAmount,
            allocatedAmount: saved.allocatedAmount,
            status: saved.status,
            dueDate: saved.dueDate,
          },
        }))
      } else if (editingGoal) {
        const saved = await updateGoal(editingGoal.id, familyId, data)
        setGoals((prev) => ({
          ...prev,
          [editingChildId]: {
            ...prev[editingChildId]!,
            title: saved.title,
            targetAmount: saved.targetAmount,
            dueDate: saved.dueDate,
          },
        }))
      }
    } catch (err) {
      console.error('saveGoal failed', err)
    }
    setEditingChildId(null)
  }

  async function handleArchive(childId: string) {
    const goal = goals[childId]
    if (!goal) return
    try {
      await archiveGoal(goal.id, familyId)
      setGoals((prev) => ({ ...prev, [childId]: null }))
    } catch (err) {
      console.error('archiveGoal failed', err)
    }
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
        activeRoute="goals"
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ParentTopbar
          familyName={familyName}
          currentUserName={currentUserName}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <div style={{ display: 'flex', flex: 1 }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {children.length === 0 ? (
              <span style={{ fontSize: 14, color: 'var(--color-kreds-muted)' }}>
                Nenhuma criança ativa nesta família.
              </span>
            ) : (
              children.map((child) => (
                <GoalCard
                  key={child.id}
                  childId={child.id}
                  displayName={child.displayName}
                  accentColor={child.accentColor}
                  goal={goals[child.id] ?? null}
                  onCreate={() => {
                    setEditingChildId(child.id)
                    setEditingMode('create')
                  }}
                  onEdit={() => {
                    setEditingChildId(child.id)
                    setEditingMode('edit')
                  }}
                  onArchive={() => handleArchive(child.id)}
                />
              ))
            )}
          </div>

          <div style={{ padding: '16px 24px 16px 0' }}>
            <GoalFormPanel
              mode={editingChildId ? editingMode : 'idle'}
              childName={editingChild?.displayName ?? ''}
              initialData={
                editingMode === 'edit' && editingGoal
                  ? {
                      title: editingGoal.title,
                      targetAmount: editingGoal.targetAmount,
                      dueDate: editingGoal.dueDate,
                    }
                  : EMPTY_GOAL_FORM
              }
              onSave={handleSave}
              onCancel={() => setEditingChildId(null)}
            />
          </div>
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
