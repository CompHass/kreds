'use client'

// CTASK-04 area / Phase 8, Plan 04 (D-06, D-07, D-09): ChildFormPanel — right-side
// add-child panel cloned from TaskFormPanel's shell (336px, 20px padding, borderRadius
// 20, same boxShadow, minHeight 400). NOT a modal (D-09). Edit mode added post-Phase-8
// to close the D-06 gap (name/age/color only — avatar stays derived, D-08). No delete
// button (deactivate lives on ChildCard). Uses react-hook-form + zodResolver(CreateChildSchema)
// (D-07's native color picker is exactly the RHF register use case).

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateChildSchema } from '@/types/child'

// Contrato de dados do form — consumido pelo Plano 05 (ChildrenPanelView)
export interface ChildFormData {
  displayName: string
  ageYears: number
  accentColor: string
}

export const EMPTY_CHILD_FORM: ChildFormData = {
  displayName: '',
  ageYears: 6,
  accentColor: '#3E6B4F',
}

interface ChildFormPanelProps {
  mode: 'idle' | 'create' | 'edit'
  initialData?: ChildFormData
  onSave: (data: ChildFormData) => void
  onCancel: () => void
}

export function ChildFormPanel({ mode, initialData, onSave, onCancel }: ChildFormPanelProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChildFormData>({
    resolver: zodResolver(CreateChildSchema),
    defaultValues: initialData ?? EMPTY_CHILD_FORM,
  })

  // Container base — clonado verbatim de TaskFormPanel (largura fixa 336px, padding
  // 20px — exceção documentada em 08-UI-SPEC.md, NÃO arredondar para 16/24).
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

  // Modo idle: placeholder centralizado, sem campos de form
  if (mode === 'idle') {
    return (
      <aside
        data-testid="child-form-panel"
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
            Adicionar filho
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-kreds-muted)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Adicione o primeiro filho da família para começar a atribuir tarefas e acompanhar o
            jardim.
          </p>
        </div>
      </aside>
    )
  }

  // Modo create: form completo (RHF + Zod)
  return (
    <aside data-testid="child-form-panel" style={containerStyle}>
      <form
        onSubmit={handleSubmit(onSave)}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {/* Header + botão X cancelar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#27372C',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {mode === 'edit' ? 'Editar filho' : 'Adicionar filho'}
          </h3>
          <button
            type="button"
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

        {/* Campo Nome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            htmlFor="child-display-name"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}
          >
            Nome
          </label>
          <input
            id="child-display-name"
            aria-label="Nome"
            type="text"
            placeholder="Nome do filho..."
            {...register('displayName')}
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
          />
          {errors.displayName && (
            <span style={{ fontSize: 12, color: '#B14A2E' }}>{errors.displayName.message}</span>
          )}
        </div>

        {/* Campo Idade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            htmlFor="child-age-years"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}
          >
            Idade
          </label>
          <input
            id="child-age-years"
            aria-label="Idade"
            type="number"
            {...register('ageYears', { valueAsNumber: true })}
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
          />
          {errors.ageYears && (
            <span style={{ fontSize: 12, color: '#B14A2E' }}>{errors.ageYears.message}</span>
          )}
        </div>

        {/* Campo Cor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            htmlFor="child-accent-color"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-kreds-muted)' }}
          >
            Cor
          </label>
          <input
            id="child-accent-color"
            aria-label="Cor"
            type="color"
            {...register('accentColor')}
            style={{
              height: 46,
              width: '100%',
              borderRadius: 12,
              border: '1.5px solid #E2DECF',
              background: 'var(--color-kreds-card)',
              padding: 4,
              cursor: 'pointer',
            }}
          />
          {errors.accentColor && (
            <span style={{ fontSize: 12, color: '#B14A2E' }}>{errors.accentColor.message}</span>
          )}
        </div>

        {/* CTA — Adicionar/Salvar filho */}
        <button
          type="submit"
          style={{
            height: 44,
            borderRadius: 13,
            border: 'none',
            background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cta)',
            transition: 'background .2s ease',
            width: '100%',
          }}
        >
          {mode === 'edit' ? 'Salvar alterações' : 'Adicionar filho'}
        </button>
      </form>
    </aside>
  )
}
