'use client'

// Phase 11 — Client Component raiz do painel /goals. Clone estrutural de
// children-panel-view.tsx: Sidebar + Topbar + GuardianProfileDrawer
// page-local. Cada filho pode ter várias metas simultâneas — GoalFormPanel
// à direita cria/edita uma de cada vez.

import { useState } from 'react'
import { ChildAvatar } from '@/components/avatar/child-avatar'
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
  avatarPreset: string
}

interface GoalsPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string
  children: ChildSummary[]
  initialGoals: Record<string, GoalView[]>
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
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null) // null = criar nova

  const guardianInitial = currentUserName.charAt(0).toUpperCase()
  const editingChild = children.find((c) => c.id === editingChildId) ?? null
  const editingGoal = editingGoalId
    ? (goals[editingChildId ?? '']?.find((g) => g.id === editingGoalId) ?? null)
    : null
  const editingMode: 'idle' | 'create' | 'edit' = !editingChildId ? 'idle' : editingGoalId ? 'edit' : 'create'

  function openCreate(childId: string) {
    setEditingChildId(childId)
    setEditingGoalId(null)
  }

  function openEdit(childId: string, goalId: string) {
    setEditingChildId(childId)
    setEditingGoalId(goalId)
  }

  async function handleSave(data: GoalFormData) {
    if (!editingChildId) return
    try {
      if (editingMode === 'create') {
        const saved = await createGoal(familyId, editingChildId, data)
        setGoals((prev) => ({
          ...prev,
          [editingChildId]: [
            ...(prev[editingChildId] ?? []),
            {
              id: saved.id,
              childId: editingChildId,
              title: saved.title,
              targetAmount: saved.targetAmount,
              allocatedAmount: saved.allocatedAmount,
              status: saved.status,
              dueDate: saved.dueDate,
            },
          ],
        }))
      } else if (editingGoal) {
        const saved = await updateGoal(editingGoal.id, familyId, data)
        setGoals((prev) => ({
          ...prev,
          [editingChildId]: (prev[editingChildId] ?? []).map((g) =>
            g.id === editingGoal.id
              ? { ...g, title: saved.title, targetAmount: saved.targetAmount, dueDate: saved.dueDate }
              : g,
          ),
        }))
      }
    } catch (err) {
      console.error('saveGoal failed', err)
    }
    setEditingChildId(null)
    setEditingGoalId(null)
  }

  async function handleArchive(childId: string, goalId: string) {
    try {
      await archiveGoal(goalId, familyId)
      setGoals((prev) => ({
        ...prev,
        [childId]: (prev[childId] ?? []).filter((g) => g.id !== goalId),
      }))
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
              gap: 20,
            }}
          >
            {children.length === 0 ? (
              <span style={{ fontSize: 14, color: 'var(--color-kreds-muted)' }}>
                Nenhuma criança ativa nesta família.
              </span>
            ) : (
              children.map((child) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ChildAvatar
                      displayName={child.displayName}
                      accentColor={child.accentColor}
                      avatarPreset={child.avatarPreset}
                      size={36}
                    />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
                      {child.displayName}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                      aria-label={`Nova meta para ${child.displayName}`}
                      onClick={() => openCreate(child.id)}
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
                      + Nova meta
                    </button>
                  </div>

                  {(goals[child.id] ?? []).length === 0 ? (
                    <span style={{ fontSize: 13, color: 'var(--color-kreds-muted)', paddingLeft: 48 }}>
                      Sem metas ativas
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 48 }}>
                      {(goals[child.id] ?? []).map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={() => openEdit(child.id, goal.id)}
                          onArchive={() => handleArchive(child.id, goal.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '16px 24px 16px 0' }}>
            <GoalFormPanel
              mode={editingMode}
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
              onCancel={() => {
                setEditingChildId(null)
                setEditingGoalId(null)
              }}
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
