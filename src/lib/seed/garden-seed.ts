// Garden seed data — Phase 3 (GARD-03, GARD-06, GARD-07, D-01, D-02)
// Constantes cobrindo todos os estados testáveis do jardim. Sem chamadas ao backend.

export interface GardenTask {
  id: string
  title: string
  emoji: string
  done: boolean
  kredsValue?: number   // valor da tarefa em Kreds — usado em handleHarvest para somar o total (API-03)
}

export interface GardenSeed {
  childName: string
  initial: string
  // Phase 14: preset do avatar + cor de destaque (fallback 'initial' + verde)
  avatarPreset?: string
  accentColor?: string
  coins: number
  tasks: GardenTask[]
  titheDone: boolean
  harvested: boolean
  season: 'primavera' | 'verao' | 'outono' | 'inverno'
  savings: number
  goal: number
}

const BASE_TASKS: GardenTask[] = [
  { id: 't1', title: 'Arrumar a cama', emoji: '🛏️', done: false },
  { id: 't2', title: 'Estudar 30 min', emoji: '📚', done: false },
  { id: 't3', title: 'Ajudar na cozinha', emoji: '🍽️', done: false },
  { id: 't4', title: 'Ler a Bíblia', emoji: '✝️', done: false },
]

// 0 tarefas concluídas — planta no estágio 'a'
export const SEED_STAGE_A: GardenSeed = {
  childName: 'Maria',
  initial: 'M',
  coins: 0,
  tasks: BASE_TASKS,
  titheDone: false,
  harvested: false,
  season: 'primavera',
  savings: 25,
  goal: 100,
}

// 1 tarefa concluída — planta no estágio 'b'
export const SEED_STAGE_B: GardenSeed = {
  childName: 'Maria',
  initial: 'M',
  coins: 10,
  tasks: BASE_TASKS.map((t, i) => ({ ...t, done: i < 1 })),
  titheDone: false,
  harvested: false,
  season: 'primavera',
  savings: 25,
  goal: 100,
}

// 3 tarefas concluídas — planta no estágio 'c'
export const SEED_STAGE_C: GardenSeed = {
  childName: 'Maria',
  initial: 'M',
  coins: 30,
  tasks: BASE_TASKS.map((t, i) => ({ ...t, done: i < 3 })),
  titheDone: false,
  harvested: false,
  season: 'verao',
  savings: 25,
  goal: 100,
}

// 4 tarefas concluídas, não colhida — planta no estágio 'd'
export const SEED_STAGE_D: GardenSeed = {
  childName: 'Maria',
  initial: 'M',
  coins: 40,
  tasks: BASE_TASKS.map((t) => ({ ...t, done: true })),
  titheDone: false,
  harvested: false,
  season: 'verao',
  savings: 25,
  goal: 100,
}

// Todas concluídas, jardim colhido
export const SEED_HARVESTED: GardenSeed = {
  childName: 'Maria',
  initial: 'M',
  coins: 40,
  tasks: BASE_TASKS.map((t) => ({ ...t, done: true })),
  titheDone: false,
  harvested: true,
  season: 'verao',
  savings: 25,
  goal: 100,
}

// Dízimo marcado
export const SEED_TITHE: GardenSeed = {
  childName: 'Maria',
  initial: 'M',
  coins: 40,
  tasks: BASE_TASKS.map((t) => ({ ...t, done: true })),
  titheDone: true,
  harvested: false,
  season: 'primavera',
  savings: 25,
  goal: 100,
}

// Mapeamento doneCount → stage (GARD-03)
// Regra: 0→'a', tudo concluído→'d', 1→'b', senão 'c'
// Conclusão total checada antes de doneCount===1 para famílias com 1 tarefa só
export function getPlantStage(
  doneCount: number,
  totalTasks: number,
): 'a' | 'b' | 'c' | 'd' {
  if (doneCount === 0) return 'a'
  if (doneCount >= totalTasks) return 'd'
  if (doneCount === 1) return 'b'
  return 'c'
}

// Texto do speech bubble por estado do jardim (GARD-07)
// Tom: cristão/encorajador, em português brasileiro
export function getBubbleText(seed: GardenSeed): string {
  if (seed.harvested) {
    return 'Você colheu seu jardim! Novo ciclo começa em breve.'
  }
  if (seed.titheDone) {
    return 'Separando para Deus primeiro — que generosidade!'
  }
  const doneCount = seed.tasks.filter((t) => t.done).length
  const stage = getPlantStage(doneCount, seed.tasks.length)
  switch (stage) {
    case 'a':
      return 'Seu jardim espera por você! Complete uma tarefa para começar.'
    case 'b':
      return 'Que começo incrível! Continue regando seu jardim.'
    case 'c':
      return 'Sua dedicação está fazendo o jardim florescer!'
    case 'd':
      return 'Uau! Seu jardim está completo. Hora de colher os frutos!'
  }
}

// Cores dos dots de estação (GARD-06)
export const SEASON_DOT_COLORS: Record<
  'primavera' | 'verao' | 'outono' | 'inverno',
  string
> = {
  primavera: '#5A8A66',
  verao: '#E3C57C',
  outono: '#B5623F',
  inverno: '#6E9BA0',
}
