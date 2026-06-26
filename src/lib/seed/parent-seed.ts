// Parent Panel seed data — Phase 5 (PTASK-05, PTASK-07, PTASK-08)
// Constantes cobrindo todas as categorias e estados-chave do painel dos pais.
// Sem chamadas ao backend — Fase 6 conecta a API real.

// Types moved to @/types/task — single source of truth shared with Route Handlers.
import type { ParentTask, Category } from '@/types/task'
export type { ParentTask, Category }

// Metadados de categoria com tokens de cor do design handoff (PTASK-05)
export const CATEGORY_META: Record<Category, { label: string; color: string; softBg: string }> = {
  quarto: { label: 'Quarto', color: '#3B6E8F', softBg: '#E4EDF2' },
  higiene: { label: 'Higiene', color: '#2F8F8A', softBg: '#E1F0EE' },
  estudos: { label: 'Estudos', color: '#B5623F', softBg: '#F4E7E0' },
  casa: { label: 'Casa', color: '#8A6BB0', softBg: '#EEE8F3' },
  espiritual: { label: 'Espiritual', color: '#3E6B4F', softBg: '#E7EFE8' },
  pet: { label: 'Pet', color: '#B07B2F', softBg: '#F4EDE0' },
}

// Labels de recorrência — D/S/T/Q/Q/S/S (PTASK-08)
export const WEEKDAY_LABELS: string[] = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const ALL_DAYS: string[] = [...WEEKDAY_LABELS]

// Helper de label de recompensa (PTASK-07)
// Retorna 'Mordomia' quando reward === 0, senão 'R$ X'
export function rewardLabel(reward: number): string {
  if (reward === 0) return 'Mordomia'
  return `R$ ${reward}`
}

// Mock de tarefas cobrindo todas as 5 categorias e estados-chave
export const MOCK_PARENT_TASKS: ParentTask[] = [
  {
    id: 'pt1',
    title: 'Arrumar o quarto',
    category: 'quarto',
    reward: 5,
    days: [1, 2, 3, 4, 5],              // Segunda a Sexta
    assigned: [],
    active: true,
    approval: false,
  },
  {
    id: 'pt2',
    title: 'Escovar os dentes',
    category: 'higiene',
    reward: 2,
    days: [0, 1, 2, 3, 4, 5, 6],        // Todos os dias
    assigned: [],
    active: false,
    approval: false,
  },
  {
    id: 'pt3',
    title: 'Estudar 30 minutos',
    category: 'estudos',
    reward: 10,
    days: [1, 2, 3, 4, 5],              // Segunda a Sexta
    assigned: [],
    active: true,
    approval: true,
  },
  {
    id: 'pt4',
    title: 'Ajudar na limpeza da casa',
    category: 'casa',
    reward: 0,
    days: [0, 6],                        // Fins de semana (Dom + Sáb)
    assigned: [],
    active: true,
    approval: false,
  },
  {
    id: 'pt5',
    title: 'Ler a Bíblia',
    category: 'espiritual',
    reward: 3,
    days: [0, 1, 2, 3, 4, 5, 6],        // Todos os dias
    assigned: [],
    active: true,
    approval: false,
  },
  {
    id: 'pt6',
    title: 'Organizar a mochila',
    category: 'estudos',
    reward: 2,
    days: [1, 2, 3, 4, 5],              // Segunda a Sexta
    assigned: [],
    active: true,
    approval: true,
  },
  {
    id: 'pt7',
    title: 'Alimentar o Charlie',
    category: 'pet',
    reward: 2,
    days: [0, 1, 2, 3, 4, 5, 6],        // Todos os dias
    assigned: [],
    active: true,
    approval: false,
  },
]
