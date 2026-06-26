// Parent Panel tests — Phase 5 (PTASK-01..10)
// Suite RED: componente ParentPanelView ainda não implementado (Wave 0).
// Estes testes DEVEM falhar até o Plano 05-02 implementar o componente.
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MOCK_PARENT_TASKS } from '../../src/lib/seed/parent-seed'
// ParentPanelView ainda não existe — import falhará até o Plano 05-02
import { ParentPanelView } from '../../src/components/parent/parent-panel-view'

const FAMILY_CHILDREN = [
  { id: 'c1', displayName: 'Ana', accentColor: '#3E6B4F', avatarPreset: 'sprout' },
  { id: 'c2', displayName: 'Beto', accentColor: '#B5623F', avatarPreset: 'sprout' },
]

function renderPanel() {
  return render(
    <ParentPanelView
      familyId="fam1"
      familyName="Família Teste"
      currentUserName="João"
      familyChildren={FAMILY_CHILDREN}
      initialTasks={MOCK_PARENT_TASKS}
    />,
  )
}

describe('ParentPanelView — PTASK-01..10', () => {
  it('PTASK-01: renderiza sidebar, main e painel direito com dimensões corretas', () => {
    renderPanel()
    // Sidebar com testid de 80px
    const sidebar = screen.getByTestId('parent-sidebar')
    expect(sidebar).toBeInTheDocument()
    // Main content
    const main = document.querySelector('main')
    expect(main).toBeInTheDocument()
    // Painel direito com testid de 336px
    const formPanel = screen.getByTestId('task-form-panel')
    expect(formPanel).toBeInTheDocument()
  })

  it('PTASK-02: topbar exibe breadcrumb com nome da família e badge do usuário logado', () => {
    renderPanel()
    // Breadcrumb com nome da família
    expect(screen.getByText('Família Teste')).toBeInTheDocument()
    // Badge com nome do usuário
    expect(screen.getByText('João')).toBeInTheDocument()
  })

  it('PTASK-03: filter chips renderizam "Todas" mais um chip por criança da família', () => {
    renderPanel()
    // Chip "Todas"
    expect(screen.getByText('Todas')).toBeInTheDocument()
    // Chip por criança
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Beto')).toBeInTheDocument()
  })

  it('PTASK-04: cada task card tem toggle (role=switch) e botão editar; toggle não abre form', () => {
    renderPanel()
    // Pelo menos um switch de toggle
    const toggles = screen.getAllByRole('switch')
    expect(toggles.length).toBeGreaterThan(0)
    // Pelo menos um botão de editar
    const editButtons = screen.getAllByLabelText(/editar tarefa/i)
    expect(editButtons.length).toBeGreaterThan(0)
    // Clicar no toggle NÃO deve entrar em modo edit (form panel permanece idle)
    fireEvent.click(toggles[0])
    // O painel ainda deve mostrar o estado idle (placeholder ou form fechado)
    expect(screen.queryByText('Editar tarefa')).not.toBeInTheDocument()
  })

  it('PTASK-05: as 5 categorias renderizam com a cor correspondente do CATEGORY_META', () => {
    renderPanel()
    // Verificar que elementos de categoria existem com cores distintas
    // O mock cobre: quarto (#3B6E8F), higiene (#2F8F8A), estudos (#B5623F), casa (#8A6BB0), espiritual (#3E6B4F)
    const categoryElements = document.querySelectorAll('[data-category]')
    expect(categoryElements.length).toBeGreaterThan(0)
    // Verificar presença de ao menos uma cor de categoria no DOM
    const html = document.body.innerHTML
    expect(html).toMatch(/#3B6E8F|#2F8F8A|#B5623F|#8A6BB0|#3E6B4F/)
  })

  it('PTASK-06: clicar "+ Nova tarefa" abre form com campos de título, categoria, recompensa, recorrência, atribuição e aprovação', () => {
    renderPanel()
    // Clicar no botão de nova tarefa
    const newTaskBtn = screen.getByText(/\+ nova tarefa/i)
    fireEvent.click(newTaskBtn)
    // Form deve estar visível com todos os campos esperados
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
    expect(screen.getByText(/recompensa/i)).toBeInTheDocument()
    expect(screen.getByText(/recorrência/i)).toBeInTheDocument()
    expect(screen.getByText(/requer aprovação/i)).toBeInTheDocument()
  })

  it('PTASK-07: stepper com reward=0 mostra "Mordomia"; clicar + incrementa para "R$ 1"', () => {
    renderPanel()
    // Abrir form de nova tarefa (começa em reward=0)
    const newTaskBtn = screen.getByText(/\+ nova tarefa/i)
    fireEvent.click(newTaskBtn)
    // Deve exibir "Mordomia" para reward = 0
    expect(screen.getByText('Mordomia')).toBeInTheDocument()
    // Clicar no botão + incrementa reward
    const incrementBtn = screen.getByRole('button', { name: /incrementar recompensa|\+/i })
    fireEvent.click(incrementBtn)
    // Agora deve mostrar "R$ 1"
    expect(screen.getByText('R$ 1')).toBeInTheDocument()
  })

  it('PTASK-08: clicar uma pill de recorrência alterna seu estado; "Todos os dias" seleciona os 7 dias', () => {
    renderPanel()
    // Abrir form
    const newTaskBtn = screen.getByText(/\+ nova tarefa/i)
    fireEvent.click(newTaskBtn)
    // Pills de recorrência D/S/T/Q/Q/S/S
    const pills = screen.getAllByRole('button', { name: /^[DSTQ]$/ })
    expect(pills.length).toBe(7)
    // Clicar em uma pill alterna estado (aria-pressed)
    const firstPill = pills[0]
    fireEvent.click(firstPill)
    expect(firstPill).toHaveAttribute('aria-pressed', 'true')
    // Botão "Todos os dias" seleciona todas as pills
    const allDaysBtn = screen.getByText('Todos os dias')
    fireEvent.click(allDaysBtn)
    const pressedPills = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-pressed') === 'true' && /^[DSTQ]$/.test(btn.textContent ?? ''),
    )
    expect(pressedPills.length).toBe(7)
  })

  it('PTASK-09: após criar tarefa, o card recebe animation contendo kreds-new', () => {
    renderPanel()
    // Abrir form de nova tarefa
    const newTaskBtn = screen.getByText(/\+ nova tarefa/i)
    fireEvent.click(newTaskBtn)
    // Preencher título
    const titleInput = screen.getByLabelText(/título/i)
    fireEvent.change(titleInput, { target: { value: 'Tarefa Nova' } })
    // Selecionar uma criança para habilitar o CTA
    const childToggle = screen.getByText('Ana')
    fireEvent.click(childToggle)
    // Clicar em "Adicionar tarefa"
    const addBtn = screen.getByRole('button', { name: /adicionar tarefa/i })
    fireEvent.click(addBtn)
    // Card recém-adicionado deve ter animação kredsNew
    const newCard = screen.getByText('Tarefa Nova').closest('[data-testid="parent-task-card"]')
    const style = newCard?.getAttribute('style') ?? ''
    const className = newCard?.getAttribute('class') ?? ''
    expect(style + className).toMatch(/kreds-new|kredsNew|animate-kreds-new/)
  })

  it('PTASK-10: botão "Excluir tarefa" não aparece em modo create; aparece em modo edit', () => {
    renderPanel()
    // Modo create: clicar em "+ Nova tarefa"
    const newTaskBtn = screen.getByText(/\+ nova tarefa/i)
    fireEvent.click(newTaskBtn)
    // Botão de excluir NÃO deve aparecer no form de criação
    expect(screen.queryByText('Excluir tarefa')).not.toBeInTheDocument()
    // Modo edit: clicar no lápis de um task card existente
    const editButtons = screen.getAllByLabelText(/editar tarefa/i)
    fireEvent.click(editButtons[0])
    // Agora o botão "Excluir tarefa" deve aparecer
    expect(screen.getByText('Excluir tarefa')).toBeInTheDocument()
  })
})
