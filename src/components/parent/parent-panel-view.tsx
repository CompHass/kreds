'use client'

// PTASK-01..10: Client Component raiz que orquestra o painel dos pais.
// Gerencia todo o estado do CRUD com useState (padrão garden-view.tsx).
// Derivados calculados no render — sem useEffect para estado derivado.
// editingId: null=idle, 'new'=create, '<taskId>'=edit (Pitfall 6 — sem boolean isCreating separado).

import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { FilterChips } from './filter-chips'
import { ParentTaskCard } from './parent-task-card'
import { TaskFormPanel, type TaskFormData, EMPTY_FORM, taskToFormData } from './task-form-panel'
import { type ParentTask } from '@/lib/seed/parent-seed'

interface ParentPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  familyChildren: Array<{    // ATENÇÃO: não usar 'children' — conflito com prop reservada do React (Pitfall 2)
    id: string
    displayName: string
    accentColor: string
    avatarPreset: string
  }>
  initialTasks: ParentTask[]
}

export function ParentPanelView({
  familyId: _familyId,
  familyName,
  currentUserName,
  familyChildren,
  initialTasks,
}: ParentPanelViewProps) {
  // Estado raiz — padrão garden-view.tsx
  const [tasks, setTasks] = useState<ParentTask[]>(initialTasks)
  const [filter, setFilter] = useState<'all' | string>('all')
  // editingId sentinela: null=idle, 'new'=create mode, '<taskId>'=edit mode (D-09, Pitfall 6)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [newTaskId, setNewTaskId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM)

  // Derivados no render — sem estado separado (anti-pattern: usar boolean isCreating)
  const formMode: 'idle' | 'create' | 'edit' = editingId === 'new'
    ? 'create'
    : editingId !== null
      ? 'edit'
      : 'idle'

  // Tarefas filtradas por filho selecionado
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.assigned.includes(filter))

  // Flash kredsNew — padrão garden-view.tsx / WaterDrops (D-10, PTASK-09)
  function flashNew(id: string) {
    setNewTaskId(id)
    setTimeout(() => setNewTaskId(null), 1200)
  }

  // Handlers de mutação otimista (D-09)
  function handleToggle(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, active: !t.active } : t)),
    )
    // toggle é completamente independente do editingId — não altera o form
  }

  function handleNewTask() {
    setEditingId('new')
    setFormData(EMPTY_FORM)
  }

  function handleEditTask(taskId: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    setEditingId(taskId)
    setFormData(taskToFormData(task))
  }

  function handleSave() {
    if (formMode === 'create') {
      const newId = crypto.randomUUID()
      const newTask: ParentTask = {
        id: newId,
        title: formData.title,
        category: formData.category ?? 'quarto',
        reward: formData.reward,
        days: formData.days,
        assigned: formData.assigned,
        active: true,
        approval: formData.approval,
      }
      setTasks((prev) => [...prev, newTask])
      flashNew(newId)
      setEditingId(null)
    } else if (formMode === 'edit' && editingId !== null && editingId !== 'new') {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title: formData.title,
                category: formData.category ?? t.category,
                reward: formData.reward,
                days: formData.days,
                assigned: formData.assigned,
                approval: formData.approval,
              }
            : t,
        ),
      )
      flashNew(editingId)
      setEditingId(null)
    }
  }

  function handleDelete() {
    if (editingId !== null && editingId !== 'new') {
      setTasks((prev) => prev.filter((t) => t.id !== editingId))
    }
    setEditingId(null)
  }

  function handleCancel() {
    setEditingId(null)
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
      {/* Sidebar esquerda 80px fixa (PTASK-01) */}
      <ParentSidebar />

      {/* Main: topbar + conteúdo flex-row */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar 64px (PTASK-02) */}
        <ParentTopbar
          familyName={familyName}
          currentUserName={currentUserName}
        />

        {/* Área de conteúdo: lista de tarefas + painel direito */}
        <div style={{ display: 'flex', flex: 1 }}>

          {/* Lista de tarefas (flex:1) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Botão "+ Nova tarefa" (D-07) */}
            <button
              onClick={handleNewTask}
              aria-label="Nova tarefa"
              style={{
                alignSelf: 'flex-start',
                height: 40,
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--color-kreds-border)',
                background: 'var(--color-kreds-card)',
                color: 'var(--color-kreds-primary)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0 16px',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              + Nova tarefa
            </button>

            {/* Filter Chips por criança (PTASK-03) — visível apenas quando form está idle.
                Escondido em create/edit para evitar conflito de texto com AssigneeSelector
                (PTASK-09: getByText('Ana') deve retornar apenas um elemento quando form aberto). */}
            {formMode === 'idle' && (
              <FilterChips
                familyChildren={familyChildren}
                active={filter}
                onChange={setFilter}
              />
            )}

            {/* Lista de task cards (PTASK-04, PTASK-05, PTASK-09) */}
            {filteredTasks.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '48px 24px',
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#27372C',
                    margin: 0,
                  }}
                >
                  Nenhuma tarefa ainda
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--color-kreds-muted)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Clique em + Nova tarefa para criar a primeira tarefa desta família.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTasks.map((task) => (
                  <ParentTaskCard
                    key={task.id}
                    task={task}
                    justAdded={newTaskId === task.id}
                    editing={editingId === task.id}
                    onToggle={handleToggle}
                    onEdit={handleEditTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Painel direito 336px (PTASK-01, PTASK-06..10) */}
          <div style={{ padding: '16px 24px 16px 0', flexShrink: 0 }}>
            <TaskFormPanel
              mode={formMode}
              formData={formData}
              onChange={setFormData}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancel={handleCancel}
              familyChildren={familyChildren}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
