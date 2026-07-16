'use client'

// Phase 11 — GoalFormPanel: painel de criar/editar meta (nome, valor, prazo
// opcional). Não é modal — mesmo shell 336px de child-form-panel.tsx.

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { GoalFormSchema, type GoalFormData } from '@/types/goal'

export const EMPTY_GOAL_FORM: GoalFormData = {
  title: '',
  targetAmount: 50,
  dueDate: null,
}

interface GoalFormPanelProps {
  mode: 'idle' | 'create' | 'edit'
  childName: string
  initialData?: GoalFormData
  onSave: (data: GoalFormData) => void
  onCancel: () => void
}

export function GoalFormPanel({ mode, childName, initialData, onSave, onCancel }: GoalFormPanelProps) {
  // z.input: dueDate aceita unknown na entrada (z.preprocess normaliza '' → null);
  // o output validado (GoalFormData) sempre carrega string | null | undefined.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof GoalFormSchema>, unknown, GoalFormData>({
    resolver: zodResolver(GoalFormSchema),
    defaultValues: initialData ?? EMPTY_GOAL_FORM,
  })

  useEffect(() => {
    reset(initialData ?? EMPTY_GOAL_FORM)
  }, [initialData, reset, mode])

  if (mode === 'idle') return null

  return (
    <div
      role="region"
      aria-label={mode === 'create' ? 'Criar meta' : 'Editar meta'}
      style={{
        width: 336,
        flexShrink: 0,
        padding: 20,
        borderRadius: 20,
        background: 'var(--color-kreds-card)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
        {mode === 'create' ? `Nova meta para ${childName}` : `Editar meta de ${childName}`}
      </span>

      <form
        onSubmit={handleSubmit(onSave)}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
            Nome da meta
          </span>
          <input
            {...register('title')}
            aria-label="Nome da meta"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--color-kreds-border)',
              background: '#ffffff',
              fontSize: 14,
            }}
          />
          {errors.title && (
            <span style={{ fontSize: 12, color: 'var(--color-kreds-error)' }}>
              {errors.title.message}
            </span>
          )}
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
            Valor da meta (Kreds)
          </span>
          <input
            type="number"
            min={1}
            {...register('targetAmount', { valueAsNumber: true })}
            aria-label="Valor da meta"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--color-kreds-border)',
              background: '#ffffff',
              fontSize: 14,
            }}
          />
          {errors.targetAmount && (
            <span style={{ fontSize: 12, color: 'var(--color-kreds-error)' }}>
              {errors.targetAmount.message}
            </span>
          )}
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
            Prazo (opcional)
          </span>
          <input
            type="date"
            {...register('dueDate')}
            aria-label="Prazo da meta"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--color-kreds-border)',
              background: '#ffffff',
              fontSize: 14,
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'var(--color-kreds-primary)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-kreds-border)',
              background: '#ffffff',
              color: 'var(--color-kreds-text)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
