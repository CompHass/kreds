// CTASK-05: BottomNav — barra de navegação inferior para crianças
// Wave 0 (RED) — componente ainda não implementado; teste falha por módulo ausente
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../../src/components/tasks/bottom-nav'

describe('BottomNav (CTASK-05)', () => {
  it('renderiza 4 botões de navegação com labels acessíveis', () => {
    render(<BottomNav />)
    expect(screen.getByRole('button', { name: /jardim/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tarefas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cofrinho/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /doar/i })).toBeInTheDocument()
  })

  it('"Jardim" está ativo por padrão (aria-current="page")', () => {
    render(<BottomNav />)
    const jardimBtn = screen.getByRole('button', { name: /jardim/i })
    expect(jardimBtn).toHaveAttribute('aria-current', 'page')
  })

  it('"Tarefas" não está ativo por padrão', () => {
    render(<BottomNav />)
    const tarefasBtn = screen.getByRole('button', { name: /tarefas/i })
    expect(tarefasBtn).not.toHaveAttribute('aria-current', 'page')
  })

  it('"Doar" tem aria-disabled="true"', () => {
    render(<BottomNav />)
    const doarBtn = screen.getByRole('button', { name: /doar/i })
    expect(doarBtn).toHaveAttribute('aria-disabled', 'true')
  })
})
