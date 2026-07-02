// CTASK-01, CTASK-02: TaskCard — toggle de tarefas
// CTASK-03: TitheCard — card de dízimo
// CTASK-04: SavingsCard — card de cofrinho com progress bar
// Wave 0 (RED) — componentes ainda não implementados; testes falham por módulo ausente
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SEED_STAGE_C } from '../../src/lib/seed/garden-seed'
import { TaskCard } from '../../src/components/tasks/task-card'
import { TitheCard } from '../../src/components/tasks/tithe-card'
import { SavingsCard } from '../../src/components/tasks/savings-card'

// Tarefa pendente (extraída do SEED_STAGE_C)
const pendingTask = SEED_STAGE_C.tasks.find((t) => !t.done)!
// Tarefa concluída (extraída do SEED_STAGE_C — as 3 primeiras estão done)
const doneTask = SEED_STAGE_C.tasks.find((t) => t.done)!

describe('TaskCard — render (CTASK-01)', () => {
  it('renderiza o título da tarefa', () => {
    render(<TaskCard task={pendingTask} onComplete={vi.fn()} />)
    expect(screen.getByText(pendingTask.title)).toBeInTheDocument()
  })

  it('renderiza o emoji da tarefa', () => {
    render(<TaskCard task={pendingTask} onComplete={vi.fn()} />)
    expect(screen.getByText(pendingTask.emoji)).toBeInTheDocument()
  })

  it('tarefa pendente NÃO tem aria-pressed="true"', () => {
    render(<TaskCard task={pendingTask} onComplete={vi.fn()} />)
    // aria-pressed deve ser false (ou "false") para tarefa pendente
    const button = screen.getByRole('checkbox')
    expect(button).not.toHaveAttribute('aria-pressed', 'true')
  })

  it('tarefa concluída tem estado marcado (aria-pressed="true")', () => {
    render(<TaskCard task={doneTask} onComplete={vi.fn()} />)
    const button = screen.getByRole('checkbox')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('TaskCard — interação (CTASK-02)', () => {
  it('clicar no check de tarefa pendente chama onToggle com task.id', () => {
    const onToggle = vi.fn()
    render(<TaskCard task={pendingTask} onComplete={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(pendingTask.id)
  })

  it('clicar em tarefa concluída chama onToggle com task.id (toggle bidirecional)', () => {
    const onToggle = vi.fn()
    render(<TaskCard task={doneTask} onComplete={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(doneTask.id)
  })

  it('botão de tarefa concluída NÃO está disabled (permite uncheck)', () => {
    render(<TaskCard task={doneTask} onComplete={vi.fn()} />)
    const button = screen.getByRole('checkbox')
    expect(button).not.toBeDisabled()
  })
})

describe('TitheCard — render e interação (CTASK-03)', () => {
  it('renderiza o título "Dízimo"', () => {
    render(<TitheCard done={false} onPlant={vi.fn()} />)
    expect(screen.getByText('Dízimo')).toBeInTheDocument()
  })

  it('com done=false exibe botão "Plantar"', () => {
    render(<TitheCard done={false} onPlant={vi.fn()} />)
    expect(screen.getByText('Plantar')).toBeInTheDocument()
  })

  it('clicar em "Plantar" chama onPlant', () => {
    const onPlant = vi.fn()
    render(<TitheCard done={false} onPlant={onPlant} />)
    fireEvent.click(screen.getByText('Plantar'))
    expect(onPlant).toHaveBeenCalledTimes(1)
  })

  it('com done=true exibe "Feito ✓" e o botão NÃO está desabilitado (permite desfazer)', () => {
    render(<TitheCard done={true} onPlant={vi.fn()} onUnplant={vi.fn()} />)
    const btn = screen.getByText('Feito ✓')
    expect(btn).toBeInTheDocument()
    const button = btn.closest('button')
    expect(button).not.toBeDisabled()
  })

  it('com done=true o botão tem aria-label "Desfazer dízimo plantado"', () => {
    render(<TitheCard done={true} onPlant={vi.fn()} onUnplant={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: 'Desfazer dízimo plantado' }),
    ).toBeInTheDocument()
  })

  it('clicar em "Feito ✓" chama onUnplant', () => {
    const onUnplant = vi.fn()
    render(<TitheCard done={true} onPlant={vi.fn()} onUnplant={onUnplant} />)
    fireEvent.click(screen.getByText('Feito ✓'))
    expect(onUnplant).toHaveBeenCalledTimes(1)
  })

  it('clicar em "Feito ✓" NÃO chama onPlant', () => {
    const onPlant = vi.fn()
    const onUnplant = vi.fn()
    render(<TitheCard done={true} onPlant={onPlant} onUnplant={onUnplant} />)
    fireEvent.click(screen.getByText('Feito ✓'))
    expect(onPlant).not.toHaveBeenCalled()
  })
})

describe('SavingsCard — render (CTASK-04)', () => {
  it('renderiza o título "Cofrinho"', () => {
    render(<SavingsCard savings={25} goal={100} />)
    expect(screen.getByText('Cofrinho')).toBeInTheDocument()
  })

  it('exibe o valor salvo "R$ 25"', () => {
    render(<SavingsCard savings={25} goal={100} />)
    expect(screen.getByText(/R\$\s*25/)).toBeInTheDocument()
  })

  it('exibe a meta "R$ 100"', () => {
    render(<SavingsCard savings={25} goal={100} />)
    expect(screen.getByText(/R\$\s*100/)).toBeInTheDocument()
  })

  it('exibe progressbar com aria-valuenow, aria-valuemax e aria-valuemin', () => {
    render(<SavingsCard savings={25} goal={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-valuenow', '25')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
  })
})
