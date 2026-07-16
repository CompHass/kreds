'use client'

// Phase 11 — SavingsSection: lista uma SavingsCard por meta ativa da criança.
// Ela escolhe em qual meta guardar/retirar Kreds — cada card já sabe seu
// próprio goalId, então o allocate/deallocate nunca mistura metas.

import { SavingsCard } from './savings-card'
import type { GardenGoal } from '@/lib/seed/garden-seed'

interface SavingsSectionProps {
  goals: GardenGoal[]
  availableBalance: number
  onAllocate: (goalId: string, amount: number) => void
  onDeallocate: (goalId: string, amount: number) => void
  pendingGoalId: string | null
}

export function SavingsSection({
  goals,
  availableBalance,
  onAllocate,
  onDeallocate,
  pendingGoalId,
}: SavingsSectionProps) {
  if (goals.length === 0) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div
          role="region"
          aria-label="Cofrinho"
          style={{
            background: '#EEF3EA',
            border: '1px solid #D6E2CC',
            borderRadius: 18,
            padding: 16,
            fontSize: 13,
            color: 'var(--color-kreds-muted)',
          }}
        >
          Você ainda não tem uma meta de poupança. Peça pro seu responsável criar uma!
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {goals.map((goal) => (
        <SavingsCard
          key={goal.id}
          title={goal.title}
          savings={goal.allocatedAmount}
          goal={goal.targetAmount}
          goalId={goal.id}
          availableBalance={availableBalance}
          allocatePending={pendingGoalId === goal.id}
          onAllocate={(amount) => onAllocate(goal.id, amount)}
          onDeallocate={(amount) => onDeallocate(goal.id, amount)}
        />
      ))}
    </div>
  )
}
