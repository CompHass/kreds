'use client'

// CTASK-01: Visual de tarefa pendente (bg #ffffff) / concluída (bg #EEF3EA)
// CTASK-02: Check button 38×38px — onComplete(task.id) ao clicar; disabled quando done

import type { GardenTask } from '@/lib/seed/garden-seed'

interface TaskCardProps {
  task: GardenTask
  onComplete: (taskId: string) => void
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  return (
    <button
      role="checkbox"
      onClick={() => !task.done && onComplete(task.id)}
      disabled={task.done}
      aria-pressed={task.done}
      aria-label={
        task.done
          ? `Tarefa concluída: ${task.title}`
          : `Marcar tarefa: ${task.title}`
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 13px',
        borderRadius: 18,
        width: '100%',
        textAlign: 'left',
        cursor: task.done ? 'default' : 'pointer',
        transition: 'background .3s ease, border-color .3s ease',
        background: task.done ? '#EEF3EA' : '#ffffff',
        border: `1px solid ${task.done ? '#D6E2CC' : '#EDE9DF'}`,
        animation: task.done ? 'var(--animate-kreds-new)' : undefined,
      }}
    >
      {/* Check button 38×38px circular (D-08) */}
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: task.done ? 'none' : '2px solid #D7DBCC',
          background: task.done ? '#3E6B4F' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {task.done && (
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 6L6 11L15 1"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* Emoji da tarefa */}
      <span style={{ fontSize: 20 }}>{task.emoji}</span>

      {/* Título da tarefa */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.4,
          color: task.done ? '#4E6E3E' : '#27372C',
        }}
      >
        {task.title}
      </span>
    </button>
  )
}
