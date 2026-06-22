// GARD-01: Verifica que GardenHeader renderiza avatar, nome e coins corretamente
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
// GardenHeader ainda não implementado — Wave 0 (RED)
// Este import falhará até o Plano 02 implementar o componente
import { GardenHeader } from '../../src/components/garden/garden-header'

describe('GardenHeader', () => {
  it('renderiza o nome da criança', () => {
    render(<GardenHeader name="Maria" initial="M" coins={40} />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
  })

  it('renderiza a inicial do avatar', () => {
    render(<GardenHeader name="Maria" initial="M" coins={40} />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('renderiza o valor de coins', () => {
    render(<GardenHeader name="Maria" initial="M" coins={40} />)
    expect(screen.getByText(/40/)).toBeInTheDocument()
  })
})
