// ParentTaskCard tests — Phase 5, Plan 02 (PTASK-04, PTASK-05, PTASK-09)
// TDD RED: testa comportamentos de ParentTaskCard antes da implementação final.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParentTaskCard } from '../../src/components/parent/parent-task-card'
import { MOCK_PARENT_TASKS } from '../../src/lib/seed/parent-seed'

const task = MOCK_PARENT_TASKS[0]! // Arrumar o quarto, quarto, active=true

// MTA-01: fixture compartilhada de familyChildren — ids sintéticos c1/c2 já que
// MOCK_PARENT_TASKS[*] tem assigned: [] por padrão.
const familyChildren = [
  { id: 'c1', displayName: 'Ana', accentColor: '#3E6B4F', avatarPreset: 'x' },
  { id: 'c2', displayName: 'Beto', accentColor: '#3B6E8F', avatarPreset: 'y' },
]

describe('ParentTaskCard — PTASK-04, PTASK-05, PTASK-09', () => {
  it('PTASK-04: renderiza CategoryIcon, TaskToggle (role=switch) e botão editar independentes', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    render(
      <ParentTaskCard
        task={task}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    // Toggle como switch acessível
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeInTheDocument()

    // Botão editar com aria-label contendo "Editar tarefa"
    const editBtn = screen.getByLabelText(/editar tarefa/i)
    expect(editBtn).toBeInTheDocument()

    // Clicar no toggle chama onToggle, não onEdit
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledWith(task.id)
    expect(onEdit).not.toHaveBeenCalled()

    // Clicar no lápis chama onEdit, não onToggle
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledWith(task.id)
    // onToggle ainda deve ter sido chamado só 1 vez (não re-chamado pelo lápis)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('PTASK-05: CategoryIcon renderiza com a cor da categoria correta no DOM', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    render(
      <ParentTaskCard
        task={task}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    // Categoria 'quarto' → cor #3B6E8F e softBg #E4EDF2
    const html = document.body.innerHTML
    // Pelo menos um dos tokens de cor da categoria deve estar presente no DOM
    expect(html).toMatch(/#3B6E8F|#E4EDF2/i)
  })

  it('PTASK-09: justAdded=true aplica animation contendo kreds-new ao container', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    render(
      <ParentTaskCard
        task={task}
        justAdded={true}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    // O card deve estar presente no DOM
    const card = screen.getByTestId('parent-task-card')
    const style = card.getAttribute('style') ?? ''
    // Animation deve conter referência à animação kredsNew
    expect(style).toMatch(/kreds-new|kredsNew|animate-kreds-new/i)
  })

  it('PTASK-09: justAdded=false não aplica animation ao container', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    render(
      <ParentTaskCard
        task={task}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    const card = screen.getByTestId('parent-task-card')
    const style = card.getAttribute('style') ?? ''
    expect(style).not.toMatch(/kreds-new|kredsNew|animate-kreds-new/i)
  })

  it('card inativo aplica opacity 0.5; card editing usa border #3E6B4F', () => {
    const inactiveTask = { ...task, active: false }
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    const { rerender } = render(
      <ParentTaskCard
        task={inactiveTask}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    // Opacity 0.5 para tarefa inativa
    const card = screen.getByTestId('parent-task-card')
    const inactiveStyle = card.getAttribute('style') ?? ''
    expect(inactiveStyle).toMatch(/opacity.*0\.5|0\.5.*opacity/i)

    // Modo editing: border verde
    rerender(
      <ParentTaskCard
        task={inactiveTask}
        justAdded={false}
        editing={true}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    const editingStyle = card.getAttribute('style') ?? ''
    // React converte hex para rgb() no DOM, então verificar ambos formatos
    expect(editingStyle).toMatch(/#3E6B4F|rgb\(62,\s*107,\s*79\)/i)
  })

  it('exibe título da tarefa e badge de recompensa (rewardLabel)', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    render(
      <ParentTaskCard
        task={task}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    // Título visível
    expect(screen.getByText(task.title)).toBeInTheDocument()
    // Recompensa (task.reward = 5 → "R$ 5")
    expect(screen.getByText('R$ 5')).toBeInTheDocument()
  })

  it('MTA-01: exibe indicador de responsável quando task.assigned tem 1 criança correspondente', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()
    const assignedTask = { ...task, assigned: ['c1'] }

    render(
      <ParentTaskCard
        task={assignedTask}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    const indicator = screen.getByLabelText(/atribuída a/i)
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveAccessibleName(/ana/i)
  })

  it('MTA-01: exibe indicador para TODAS as crianças quando múltiplos assignees, sem truncar', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()
    const assignedTask = { ...task, assigned: ['c1', 'c2'] }

    render(
      <ParentTaskCard
        task={assignedTask}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    const indicator = screen.getByLabelText(/atribuída a/i)
    expect(indicator).toHaveAccessibleName(/ana/i)
    expect(indicator).toHaveAccessibleName(/beto/i)
  })

  it('MTA-01: não exibe indicador quando assigned vazio ou ids não correspondem a familyChildren', () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()

    const { rerender } = render(
      <ParentTaskCard
        task={{ ...task, assigned: [] }}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    expect(screen.queryByLabelText(/atribuída a/i)).not.toBeInTheDocument()

    // Id não presente em familyChildren (ex: criança desativada)
    rerender(
      <ParentTaskCard
        task={{ ...task, assigned: ['deactivated-child-id'] }}
        justAdded={false}
        editing={false}
        onToggle={onToggle}
        onEdit={onEdit}
        familyChildren={familyChildren}
      />,
    )

    expect(screen.queryByLabelText(/atribuída a/i)).not.toBeInTheDocument()
  })
})
