// D-05 (08-02): ParentSidebar route-aware — Crianças navega para /children, estado ativo condicional
// Testa os 3 casos: navegação Crianças, stroke ativo em Crianças, navegação Tarefas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParentSidebar } from '../../src/components/parent/parent-sidebar'

// Mock next/navigation — useRouter não está disponível em jsdom
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

beforeEach(() => {
  pushMock.mockClear()
})

describe('ParentSidebar — D-05 route-aware (08-02)', () => {
  it('(1) clicar em Crianças chama router.push com /family/fam-1/children', () => {
    render(
      <ParentSidebar
        guardianInitial="A"
        onOpenProfile={vi.fn()}
        familyId="fam-1"
        activeRoute="children"
      />,
    )
    const criancasBtn = screen.getByRole('button', { name: 'Crianças' })
    fireEvent.click(criancasBtn)
    expect(pushMock).toHaveBeenCalledWith('/family/fam-1/children')
  })

  it('(2) com activeRoute="children" o svg do botão Crianças tem stroke #3E6B4F', () => {
    render(
      <ParentSidebar
        guardianInitial="A"
        onOpenProfile={vi.fn()}
        familyId="fam-1"
        activeRoute="children"
      />,
    )
    const criancasBtn = screen.getByRole('button', { name: 'Crianças' })
    // O svg filho do botão deve ter stroke ativo
    const svg = criancasBtn.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('stroke')).toBe('#3E6B4F')
  })

  it('(3) com activeRoute="tasks" clicar em Tarefas chama router.push com /family/fam-1/tasks', () => {
    render(
      <ParentSidebar
        guardianInitial="A"
        onOpenProfile={vi.fn()}
        familyId="fam-1"
        activeRoute="tasks"
      />,
    )
    const tarefasBtn = screen.getByRole('button', { name: 'Tarefas' })
    fireEvent.click(tarefasBtn)
    expect(pushMock).toHaveBeenCalledWith('/family/fam-1/tasks')
  })
})
