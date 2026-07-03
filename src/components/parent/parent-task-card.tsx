'use client'

// PTASK-04, PTASK-05, PTASK-09: Card de tarefa com CategoryIcon, TaskToggle e lápis.
// Toggle e lápis são completamente independentes — clicar no toggle não abre o form.
// justAdded=true aplica animation var(--animate-kreds-new) (flash kredsNew, D-10).

import { type ParentTask } from '@/lib/seed/parent-seed'
import { CategoryIcon } from './category-icon'
import { TaskToggle } from './task-toggle'
import { DayPills } from './recurrence-pills'

interface FamilyChild {
  id: string
  displayName: string
  accentColor: string
  avatarPreset: string
}

interface ParentTaskCardProps {
  task: ParentTask
  justAdded: boolean
  editing: boolean
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  familyChildren: FamilyChild[]
}

// MTA-01: indicador visual de responsável(is) — resolve task.assigned contra
// familyChildren e renderiza um chip por criança encontrada (sem truncar).
// Ids sem correspondência (ex: criança desativada) são filtrados silenciosamente.
function AssigneeAvatars({
  assignedIds,
  familyChildren,
}: {
  assignedIds: string[]
  familyChildren: FamilyChild[]
}) {
  const resolved = assignedIds
    .map((id) => familyChildren.find((c) => c.id === id))
    .filter((c): c is FamilyChild => c !== undefined)

  if (resolved.length === 0) return null

  const names = resolved.map((c) => c.displayName).join(', ')

  return (
    <div
      aria-label={`Atribuída a: ${names}`}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {resolved.map((child, i) => (
        <span
          key={child.id}
          aria-hidden="true"
          style={{
            width: 19,
            height: 19,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: '#ffffff',
            background: child.accentColor,
            border: '1.5px solid #FBFAF5',
            marginLeft: i === 0 ? 0 : -6,
            flexShrink: 0,
          }}
        >
          {child.displayName.charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  )
}

export function ParentTaskCard({
  task,
  justAdded,
  editing,
  onToggle,
  onEdit,
  familyChildren,
}: ParentTaskCardProps) {
  return (
    <div
      data-testid="parent-task-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 16,
        border: `1.5px solid ${editing ? '#3E6B4F' : 'var(--color-kreds-border)'}`,
        background: editing ? '#F4F8F2' : '#FBFAF5',
        opacity: task.active ? 1 : 0.5,
        animation: justAdded ? 'var(--animate-kreds-new)' : undefined,
        marginBottom: 8,
      }}
    >
      {/* Ícone de categoria 44×44px */}
      <CategoryIcon category={task.category} />

      {/* Conteúdo central: título + badges */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-kreds-text)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {task.title}
        </div>

        {/* Badges de recompensa e dias */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          {/* Badge de recompensa — não exibe "Mordomia" como texto para evitar conflito
              com o RewardStepper do form (PTASK-07). Usa "R$ 0" para reward=0. */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: task.reward === 0 ? 'var(--color-kreds-primary)' : 'var(--color-kreds-muted)',
              background: 'var(--color-kreds-bg)',
              borderRadius: 8,
              padding: '2px 8px',
              border: '1px solid var(--color-kreds-border)',
            }}
          >
            {task.reward === 0 ? 'R$ 0' : `R$ ${task.reward}`}
          </span>

          {/* Indicador de dias — mesmos círculos D/S/T/Q/Q/S/S do form de edição
              (RecurrencePills), em versão somente-leitura e compacta (DayPills). */}
          {task.days.length > 0 && <DayPills days={task.days} />}

          {/* MTA-01: avatares de responsável(is) — logo após os dias, antes da aprovação */}
          {task.assigned.length > 0 && (
            <AssigneeAvatars assignedIds={task.assigned} familyChildren={familyChildren} />
          )}

          {/* Badge de aprovação — após os dias */}
          {task.approval && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#7C5C2E',
                background: '#FDF3E3',
                borderRadius: 8,
                padding: '2px 7px',
                border: '1px solid #F0D9B0',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ aprovação
            </span>
          )}
        </div>
      </div>

      {/* Ações: lápis + toggle (independentes) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Botão lápis (EditButton) 32×32px */}
        <button
          aria-label={`Editar tarefa: ${task.title}`}
          aria-pressed={editing}
          onClick={() => onEdit(task.id)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${editing ? '#3E6B4F' : '#E2DECF'}`,
            background: editing ? '#EEF3EA' : '#FBFAF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={editing ? '#3E6B4F' : '#7C8676'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Toggle independente — NÃO chama onEdit */}
        <TaskToggle
          checked={task.active}
          onChange={() => onToggle(task.id)}
          label={`Ativar/desativar tarefa: ${task.title}`}
        />
      </div>
    </div>
  )
}
