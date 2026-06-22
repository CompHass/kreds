// GARD-10: Verifica CelebrationOverlay — versículo e botão de retorno
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
// CelebrationOverlay ainda não implementado — Wave 0 (RED)
// Este import falhará até o Plano 03 implementar o componente
import { CelebrationOverlay } from '../../src/components/garden/celebration-overlay'

const MOCK_VERSE = {
  id: '00000000-0000-0000-0000-000000000001',
  reference: 'Gálatas 6:9',
  text: 'Não nos cansemos de fazer o bem, pois a seu tempo colheremos, se não desanimarmos.',
  createdAt: new Date(),
}

describe('CelebrationOverlay', () => {
  it('exibe o texto do versículo quando visible=true', () => {
    render(
      <CelebrationOverlay
        visible={true}
        verse={MOCK_VERSE}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText(/Não nos cansemos/)).toBeInTheDocument()
  })

  it('exibe a referência bíblica', () => {
    render(
      <CelebrationOverlay
        visible={true}
        verse={MOCK_VERSE}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('Gálatas 6:9')).toBeInTheDocument()
  })

  it('exibe o botão "Voltar ao jardim"', () => {
    render(
      <CelebrationOverlay
        visible={true}
        verse={MOCK_VERSE}
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /voltar ao jardim/i })).toBeInTheDocument()
  })

  it('não renderiza quando visible=false', () => {
    render(
      <CelebrationOverlay
        visible={false}
        verse={MOCK_VERSE}
        onClose={() => {}}
      />,
    )
    expect(screen.queryByText(/Não nos cansemos/)).not.toBeInTheDocument()
  })
})
