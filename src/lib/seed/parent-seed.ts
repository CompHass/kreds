// Parent Panel seed data — Phase 5 (PTASK-05, PTASK-07, PTASK-08)
// Constantes cobrindo todas as categorias e estados-chave do painel dos pais.
// Sem chamadas ao backend — Fase 6 conecta a API real.

export interface ParentTask {
  id: string
  title: string
  category: 'quarto' | 'higiene' | 'estudos' | 'casa' | 'espiritual'
  reward: number       // inteiro em R$; 0 = mordomia
  days: string[]       // subset de ['D','S','T','Q','Q','S','S']
  assigned: string[]   // childProfile ids (page.tsx popula com ids reais)
  active: boolean
  approval: boolean
}

export type Category = ParentTask['category']

// Metadados de categoria com tokens de cor do design handoff (PTASK-05)
export const CATEGORY_META: Record<Category, { label: string; color: string; softBg: string }> = {
  quarto: { label: 'Quarto', color: '#3B6E8F', softBg: '#E4EDF2' },
  higiene: { label: 'Higiene', color: '#2F8F8A', softBg: '#E1F0EE' },
  estudos: { label: 'Estudos', color: '#B5623F', softBg: '#F4E7E0' },
  casa: { label: 'Casa', color: '#8A6BB0', softBg: '#EEE8F3' },
  espiritual: { label: 'Espiritual', color: '#3E6B4F', softBg: '#E7EFE8' },
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
    days: ['S', 'T', 'Q', 'Q', 'S'],   // Segunda a Sexta
    assigned: [],
    active: true,
    approval: false,
  },
  {
    id: 'pt2',
    title: 'Escovar os dentes',
    category: 'higiene',
    reward: 2,
    days: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],  // Todos os dias
    assigned: [],
    active: false,                        // tarefa inativa — cobre estado inactive
    approval: false,
  },
  {
    id: 'pt3',
    title: 'Estudar 30 minutos',
    category: 'estudos',
    reward: 10,
    days: ['S', 'T', 'Q', 'Q', 'S'],   // Segunda a Sexta
    assigned: [],
    active: true,
    approval: true,                      // requer aprovação — cobre estado approval
  },
  {
    id: 'pt4',
    title: 'Ajudar na limpeza da casa',
    category: 'casa',
    reward: 0,                           // mordomia — reward = 0
    days: ['S', 'S'],                    // Fins de semana
    assigned: [],
    active: true,
    approval: false,
  },
  {
    id: 'pt5',
    title: 'Ler a Bíblia',
    category: 'espiritual',
    reward: 3,
    days: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],  // Todos os dias
    assigned: [],
    active: true,
    approval: false,
  },
  {
    id: 'pt6',
    title: 'Organizar a mochila',
    category: 'estudos',
    reward: 2,
    days: ['S', 'T', 'Q', 'Q', 'S'],
    assigned: [],
    active: true,
    approval: true,                      // segunda tarefa com aprovação
  },
]
