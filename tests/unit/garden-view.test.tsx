// GARD-05, GARD-08: Verifica GardenView — interatividade de tarefas e HarvestButton
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SEED_STAGE_C, SEED_STAGE_D } from '../../src/lib/seed/garden-seed'
// GardenView ainda não implementado — Wave 0 (RED)
// Este import falhará até o Plano 02 implementar o componente
import { GardenView } from '../../src/components/garden/garden-view'

const MOCK_VERSE = {
  id: '00000000-0000-0000-0000-000000000001',
  reference: 'Lucas 6:38',
  text: 'Dai, e ser-vos-á dado.',
  createdAt: new Date(),
}

describe('GardenView — HarvestButton (GARD-08)', () => {
  it('oculta o botão de colheita quando nem todas as tarefas estão concluídas', () => {
    render(<GardenView seed={SEED_STAGE_C} verse={MOCK_VERSE} childId="child-1" />)
    expect(screen.queryByRole('button', { name: /colher frutos/i })).not.toBeInTheDocument()
  })

  it('exibe o botão de colheita quando todas as tarefas estão concluídas', () => {
    render(<GardenView seed={SEED_STAGE_D} verse={MOCK_VERSE} childId="child-1" />)
    expect(screen.getByRole('button', { name: /colher frutos/i })).toBeInTheDocument()
  })
})

describe('GardenView — task toggle (GARD-05)', () => {
  it('clicar em uma tarefa avança o tracker de água', () => {
    render(<GardenView seed={SEED_STAGE_C} verse={MOCK_VERSE} childId="child-1" />)
    // SEED_STAGE_C tem 3 tarefas done; clicar na 4ª deve ir para waterCount=4
    const pendingTask = screen.getByText('Ler a Bíblia')
    fireEvent.click(pendingTask)
    // Após toggle, o tracker deve atualizar (verificado pelo aria-label)
    const tracker = screen.getByLabelText(/tracker de água.*4/i)
    expect(tracker).toBeInTheDocument()
  })
})
