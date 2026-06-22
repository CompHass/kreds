// GARD-07: Verifica textos contextuais do speech bubble (função pura getBubbleText)
import { describe, it, expect } from 'vitest'
import {
  getBubbleText,
  SEED_STAGE_A,
  SEED_STAGE_B,
  SEED_STAGE_C,
  SEED_STAGE_D,
  SEED_HARVESTED,
  SEED_TITHE,
} from '../../src/lib/seed/garden-seed'

describe('getBubbleText', () => {
  it('retorna texto de início para SEED_STAGE_A (0 tarefas)', () => {
    const text = getBubbleText(SEED_STAGE_A)
    expect(text).toContain('esperando por você')
  })

  it('retorna texto encorajador para SEED_STAGE_B (1 tarefa)', () => {
    const text = getBubbleText(SEED_STAGE_B)
    expect(text).toContain('começo incrível')
  })

  it('retorna texto de florescimento para SEED_STAGE_C (3 tarefas)', () => {
    const text = getBubbleText(SEED_STAGE_C)
    expect(text).toContain('florescer')
  })

  it('retorna texto de colheita disponível para SEED_STAGE_D (todas feitas)', () => {
    const text = getBubbleText(SEED_STAGE_D)
    expect(text).toContain('colher')
  })

  it('retorna texto pós-colheita para SEED_HARVESTED', () => {
    const text = getBubbleText(SEED_HARVESTED)
    expect(text).toContain('colheu seu jardim')
  })

  it('retorna texto de dízimo para SEED_TITHE', () => {
    const text = getBubbleText(SEED_TITHE)
    expect(text).toContain('Deus primeiro')
  })
})
