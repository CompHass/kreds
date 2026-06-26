'use client'

// PTASK-06, PTASK-10: TaskFormPanel — painel direito 336px com estados idle/create/edit.
// Controlado: recebe formData + onChange + callbacks do ParentPanelView (Plano 04).
// DeleteButton renderizado SOMENTE em mode='edit' (PTASK-10 — invariante crítico).

import { CategoryChips } from './category-chips'
import { RewardStepper } from './reward-stepper'
import { RecurrencePills } from './recurrence-pills'
import { AssigneeSelector } from './assignee-selector'
import { TaskToggle } from './task-toggle'
import type { ParentTask, Category } from '@/lib/seed/parent-seed'

// Contrato de dados do form — consumido pelo Plano 04 (ParentPanelView)
export interface TaskFormData {
  title: string
  category: Category | null
  reward: number
  days: string[]
  assigned: string[]
  approval: boolean
}

export const EMPTY_FORM: TaskFormData = {
  title: '',
  category: null,
  reward: 0,
  days: [],
  assigned: [],
  approval: false,
}

// Mapeia uma ParentTask existente para o formData para o modo edit
export function taskToFormData(task: ParentTask): TaskFormData {
  return {
    title: task.title,
    category: task.category,
    reward: task.reward,
    days: task.days,
    assigned: task.assigned,
    approval: task.approval,
  }
}

interface FamilyChild {
  id: string
  displayName: string
  accentColor: string
  avatarPreset: string
}

interface TaskFormPanelProps {
  mode: 'idle' | 'create' | 'edit'
  formData: TaskFormData
  onChange: (data: TaskFormData) => void
  onSave: () => void
  onDelete: () => void
  onCancel: () => void
  familyChildren: FamilyChild[]
}

export function TaskFormPanel({
  mode,
  formData,
  onChange,
  onSave,
  onDelete,
  onCancel,
  familyChildren,
}: TaskFormPanelProps) {
  const isCtaEnabled = formData.assigned.length > 0

  // Container base — largura fixa 336px para evitar layout shift entre estados (D-05)
  const containerStyle: React.CSSProperties = {
    width: 336,
    flexShrink: 0,
    padding: 20,
    borderRadius: 20,
    background: '#ffffff',
    boxShadow: '0 16px 36px -26px rgba(40,55,45,.5)',
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  // Modo idle: placeholder elegante, sem campos de form
  if (mode === 'idle') {
    return (
      <aside
        data-testid="task-form-panel"
        style={{
          ...containerStyle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#27372C',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Nova tarefa
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-kreds-muted)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Selecione uma tarefa ou clique em + para criar
          </p>
        </div>
      </aside>
    )
  }

  // Modos create e edit: form completo
  const headerLabel = mode === 'create' ? 'Nova tarefa' : 'Editar tarefa'
  const ctaLabel = isCtaEnabled
    ? mode === 'create'
      ? 'Adicionar tarefa'
      : 'Salvar alterações'
    : 'Selecione uma criança'

  return (
    <aside
      data-testid="task-form-panel"
      style={containerStyle}
    >
      {/* Header dinâmico */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#27372C',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {headerLabel}
        </h3>

        {/* Botão X — cancelar (disponível em create e edit) */}
        <button
          aria-label="Cancelar"
          onClick={onCancel}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1.5px solid #E2DECF',
            background: 'var(--color-kreds-card)',
            color: 'var(--color-kreds-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Campo título */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          htmlFor="task-title"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-kreds-muted)',
          }}
        >
          Título
        </label>
        <input
          id="task-title"
          aria-label="Título da tarefa"
          type="text"
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Nome da tarefa..."
          style={{
            height: 46,
            borderRadius: 12,
            border: '1.5px solid #E2DECF',
            background: 'var(--color-kreds-card)',
            padding: '0 14px',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--color-kreds-text)',
            outline: 'none',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3E6B4F'
            e.target.style.background = '#ffffff'
            e.target.style.boxShadow = '0 0 0 3px rgba(62,107,79,.13)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E2DECF'
            e.target.style.background = 'var(--color-kreds-card)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Categoria */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
          Categoria
        </span>
        <CategoryChips
          value={formData.category}
          onChange={(category) => onChange({ ...formData, category })}
        />
      </div>

      {/* Recompensa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
          Recompensa
        </span>
        <RewardStepper
          value={formData.reward}
          onChange={(reward) => onChange({ ...formData, reward })}
        />
      </div>

      {/* Recorrência */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
          Recorrência
        </span>
        <RecurrencePills
          value={formData.days}
          onChange={(days) => onChange({ ...formData, days })}
        />
      </div>

      {/* Atribuição */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}>
          Atribuir a
        </span>
        <AssigneeSelector
          familyChildren={familyChildren}
          value={formData.assigned}
          onChange={(assigned) => onChange({ ...formData, assigned })}
        />
      </div>

      {/* Toggle de aprovação */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-kreds-text)' }}>
          Requer aprovação
        </span>
        <TaskToggle
          checked={formData.approval}
          onChange={() => onChange({ ...formData, approval: !formData.approval })}
          label="Requer aprovação"
        />
      </div>

      {/* FormCTA — habilitado quando ≥1 criança selecionada */}
      <button
        onClick={isCtaEnabled ? onSave : undefined}
        disabled={!isCtaEnabled}
        aria-disabled={!isCtaEnabled ? 'true' : undefined}
        style={{
          height: 44,
          borderRadius: 13,
          border: 'none',
          background: isCtaEnabled
            ? 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)'
            : '#C2C9BC',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          cursor: isCtaEnabled ? 'pointer' : 'not-allowed',
          boxShadow: isCtaEnabled ? 'var(--shadow-cta)' : 'none',
          transition: 'background .2s ease',
          width: '100%',
        }}
      >
        {ctaLabel}
      </button>

      {/* DeleteButton — SOMENTE em modo edit (PTASK-10 — invariante crítico) */}
      {mode === 'edit' && (
        <button
          aria-label="Excluir tarefa"
          onClick={onDelete}
          style={{
            height: 44,
            borderRadius: 13,
            border: '1.5px solid #E6CFC4',
            background: '#FBF1EC',
            color: '#B14A2E',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F6E4DC'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FBF1EC'
          }}
        >
          {/* Ícone lixeira SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0l-.667 9.333A1.333 1.333 0 0110.667 14.667H5.333A1.333 1.333 0 013.997 13.333L3.333 4"
              stroke="#B14A2E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Excluir tarefa
        </button>
      )}
    </aside>
  )
}
