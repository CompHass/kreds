// GARD-03: Verifica mapeamento doneCount → stage (função pura getPlantStage)
import { describe, it, expect } from 'vitest'
import { getPlantStage } from '../../src/lib/seed/garden-seed'

describe('getPlantStage', () => {
  it('retorna "a" quando doneCount é 0', () => {
    expect(getPlantStage(0, 4)).toBe('a')
  })

  it('retorna "b" quando doneCount é 1', () => {
    expect(getPlantStage(1, 4)).toBe('b')
  })

  it('retorna "c" quando doneCount é 2 (menos que total)', () => {
    expect(getPlantStage(2, 4)).toBe('c')
  })

  it('retorna "c" quando doneCount é 3 (menos que total)', () => {
    expect(getPlantStage(3, 4)).toBe('c')
  })

  it('retorna "d" quando doneCount é igual ao total (4)', () => {
    expect(getPlantStage(4, 4)).toBe('d')
  })

  it('retorna "d" quando há apenas 1 tarefa e ela está concluída', () => {
    expect(getPlantStage(1, 1)).toBe('d')
  })
})
