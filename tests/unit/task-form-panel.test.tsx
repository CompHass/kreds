// TaskFormPanel tests — Phase 5, Plan 03 (PTASK-06, PTASK-10)
// RED phase: TaskFormPanel ainda não implementado.
// Testa os 3 modos (idle/create/edit), CTA condicional e DeleteButton só-em-edit.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
// TaskFormPanel ainda não existe — este import falhará até a fase GREEN
import { TaskFormPanel, EMPTY_FORM, type TaskFormData } from '../../src/components/parent/task-form-panel'

const FAMILY_CHILDREN = [
  { id: 'c1', displayName: 'Ana', accentColor: '#3E6B4F', avatarPreset: 'sprout' },
  { id: 'c2', displayName: 'Beto', accentColor: '#B5623F', avatarPreset: 'sprout' },
]

function makeForm(overrides: Partial<TaskFormData> = {}): TaskFormData {
  return { ...EMPTY_FORM, ...overrides }
}

describe('TaskFormPanel — PTASK-06, PTASK-10', () => {
  it('modo idle: renderiza placeholder sem campos de form', () => {
    render(
      <TaskFormPanel
        mode="idle"
        formData={makeForm()}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    // Placeholder visível
    expect(screen.getByText(/Selecione uma tarefa ou clique em \+ para criar/i)).toBeInTheDocument()
    // Campos de form NÃO devem aparecer em modo idle
    expect(screen.queryByLabelText(/título/i)).not.toBeInTheDocument()
    // Botão excluir NÃO deve aparecer em modo idle (PTASK-10)
    expect(screen.queryByText('Excluir tarefa')).not.toBeInTheDocument()
  })

  it('modo create: header "Nova tarefa", CTA "Adicionar tarefa", SEM botão excluir (PTASK-10)', () => {
    render(
      <TaskFormPanel
        mode="create"
        formData={makeForm({ assigned: ['c1'] })}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    // Header "Nova tarefa"
    expect(screen.getByText('Nova tarefa')).toBeInTheDocument()
    // CTA com label correto
    expect(screen.getByRole('button', { name: /adicionar tarefa/i })).toBeInTheDocument()
    // Botão excluir NÃO deve aparecer em modo create (PTASK-10) — invariante crítico
    expect(screen.queryByText('Excluir tarefa')).not.toBeInTheDocument()
  })

  it('modo edit: header "Editar tarefa", CTA "Salvar alterações", DeleteButton visível (PTASK-10)', () => {
    render(
      <TaskFormPanel
        mode="edit"
        formData={makeForm({ assigned: ['c1'] })}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    // Header "Editar tarefa"
    expect(screen.getByText('Editar tarefa')).toBeInTheDocument()
    // CTA com label correto
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
    // Botão excluir DEVE aparecer em modo edit (PTASK-10) — invariante crítico
    expect(screen.getByText('Excluir tarefa')).toBeInTheDocument()
  })

  it('CTA desabilitado quando nenhuma criança selecionada: label "Selecione uma criança" + aria-disabled', () => {
    render(
      <TaskFormPanel
        mode="create"
        formData={makeForm({ assigned: [] })}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    const cta = screen.getByRole('button', { name: /selecione uma criança/i })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('aria-disabled', 'true')
  })

  it('painel tem largura fixa 336px com flexShrink 0', () => {
    render(
      <TaskFormPanel
        mode="idle"
        formData={makeForm()}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    const panel = screen.getByTestId('task-form-panel')
    const style = panel.getAttribute('style') ?? ''
    // Verifica que o painel tem largura 336px no style inline
    expect(style).toMatch(/width:\s*336px/)
  })

  it('clicar CTA habilitado chama onSave()', () => {
    const onSave = vi.fn()
    render(
      <TaskFormPanel
        mode="create"
        formData={makeForm({ assigned: ['c1'] })}
        onChange={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /adicionar tarefa/i }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('clicar DeleteButton chama onDelete()', () => {
    const onDelete = vi.fn()
    render(
      <TaskFormPanel
        mode="edit"
        formData={makeForm({ assigned: ['c1'] })}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
        onCancel={vi.fn()}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    fireEvent.click(screen.getByText('Excluir tarefa'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('clicar X em modo edit chama onCancel()', () => {
    const onCancel = vi.fn()
    render(
      <TaskFormPanel
        mode="edit"
        formData={makeForm({ assigned: ['c1'] })}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onCancel={onCancel}
        familyChildren={FAMILY_CHILDREN}
      />,
    )

    fireEvent.click(screen.getByLabelText(/cancelar/i))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
