// GARD-06: Verifica SEASON_DOT_COLORS (funções puras)
// Wave 0: testes de funções puras são verdes; SeasonBadge será testado no componente garden-hero
import { describe, it, expect } from 'vitest'
import { SEASON_DOT_COLORS } from '../../src/lib/seed/garden-seed'

describe('SEASON_DOT_COLORS', () => {
  it('define a cor da primavera como #5A8A66', () => {
    expect(SEASON_DOT_COLORS.primavera).toBe('#5A8A66')
  })

  it('define a cor do verão como #E3C57C', () => {
    expect(SEASON_DOT_COLORS.verao).toBe('#E3C57C')
  })

  it('define a cor do outono como #B5623F', () => {
    expect(SEASON_DOT_COLORS.outono).toBe('#B5623F')
  })

  it('define a cor do inverno como #6E9BA0', () => {
    expect(SEASON_DOT_COLORS.inverno).toBe('#6E9BA0')
  })

  it('tem exatamente 4 estações', () => {
    expect(Object.keys(SEASON_DOT_COLORS)).toHaveLength(4)
  })
})
