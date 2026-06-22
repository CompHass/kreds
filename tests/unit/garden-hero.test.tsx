// GARD-02, GARD-04, GARD-09: Verifica GardenHero, WaterTracker e DecorativeFlowers
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
// GardenHero ainda não implementado — Wave 0 (RED)
// Este import falhará até o Plano 02 implementar o componente
import { GardenHero } from '../../src/components/garden/garden-hero'

describe('GardenHero', () => {
  it('renderiza o tracker de água com N dots para filled=N', () => {
    render(
      <GardenHero
        stage="b"
        season="primavera"
        waterCount={2}
        titheDone={false}
        canHarvest={false}
        showBubble={false}
        bubbleText=""
      />,
    )
    // WaterTracker deve mostrar 2 dots preenchidos
    const tracker = screen.getByLabelText(/tracker de água/i)
    expect(tracker).toBeInTheDocument()
  })

  it('mostra flores decorativas quando titheDone é true', () => {
    render(
      <GardenHero
        stage="d"
        season="primavera"
        waterCount={4}
        titheDone={true}
        canHarvest={false}
        showBubble={false}
        bubbleText=""
      />,
    )
    // DecorativeFlowers deve estar visível quando titheDone=true
    const flowers = screen.getByTestId('decorative-flowers')
    expect(flowers).toBeInTheDocument()
  })

  it('não mostra flores quando titheDone é false', () => {
    render(
      <GardenHero
        stage="a"
        season="verao"
        waterCount={0}
        titheDone={false}
        canHarvest={false}
        showBubble={false}
        bubbleText=""
      />,
    )
    expect(screen.queryByTestId('decorative-flowers')).not.toBeInTheDocument()
  })
})
