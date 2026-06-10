import { ReactNode } from 'react'

type Goal = {
  id: string
  title: string
  description?: string
  targetAmount: number
  allocatedAmount: number
  status: 'active' | 'achieved'
}

export default function GoalCard({
  goal,
  childId,
  availableBalance,
}: {
  goal: Goal
  childId: string
  availableBalance: number
}): ReactNode {
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '0.5px solid rgba(45,90,39,0.1)',
      }}
    >
      <h4
        style={{
          margin: '0 0 4px',
          fontSize: '14px',
          fontWeight: 700,
          color: '#2d5a27',
        }}
      >
        {goal.title}
      </h4>
      {goal.description && (
        <p style={{ margin: '4px 0 8px', fontSize: '12px', color: '#72796e' }}>
          {goal.description}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#72796e' }}>
            Alocado: {goal.allocatedAmount}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#72796e' }}>
            Meta: {goal.targetAmount}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {goal.status === 'active' && (
            <button
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b6934',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Alocar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
