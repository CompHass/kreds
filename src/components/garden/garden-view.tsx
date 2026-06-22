'use client'

// GARD-05, GARD-08, GARD-10: Client Component raiz que orquestra o jardim interativo
import { useState } from 'react'
import { GardenHeader } from './garden-header'
import { GardenHero } from './garden-hero'
import { WaterDrops } from './water-drops'
import { HarvestButton } from './harvest-button'
import { CelebrationOverlay } from './celebration-overlay'
import {
  type GardenSeed,
  getPlantStage,
  getBubbleText,
} from '@/lib/seed/garden-seed'

interface Verse {
  id: string
  reference: string
  text: string
  createdAt: Date
}

interface GardenViewProps {
  childId: string
  seed: GardenSeed
  verse: Verse | null
}

export function GardenView({ seed, verse }: GardenViewProps) {
  // Estado interativo
  const [tasks, setTasks] = useState(seed.tasks)
  const [waterTick, setWaterTick] = useState(0)
  const [showPop, setShowPop] = useState(false)
  const [harvested, setHarvested] = useState(seed.harvested)
  const [showOverlay, setShowOverlay] = useState(false)

  // Derivados (recalculados no render)
  const doneCount = tasks.filter((t) => t.done).length
  const stage = getPlantStage(doneCount, tasks.length)
  const waterCount = doneCount
  const canHarvest = doneCount === tasks.length && !harvested
  const hasPending = doneCount < tasks.length
  const bubbleText = getBubbleText({ ...seed, tasks, harvested })

  // Handlers
  function handleTaskComplete(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: true } : t)),
    )
    setWaterTick((tick) => tick + 1)
    setShowPop(true)
    setTimeout(() => setShowPop(false), 650)
  }

  function handleHarvest() {
    setHarvested(true)
    setShowOverlay(true)
  }

  // D-10: manter último estado ao fechar — NÃO resetar tasks nem harvested
  function handleCloseOverlay() {
    setShowOverlay(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-kreds-bg)',
        maxWidth: 392,
        margin: '0 auto',
        paddingBottom: 80, // reservado para bottom nav Fase 4 (D-05)
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingTop: 24,
      }}
    >
      {/* Header da criança */}
      <GardenHeader
        name={seed.childName}
        initial={seed.initial}
        coins={seed.coins}
      />

      {/* Hero do jardim com estado interativo */}
      <div style={{ padding: '0 16px' }}>
        <GardenHero
          stage={stage}
          season={seed.season}
          waterCount={waterCount}
          titheDone={seed.titheDone}
          canHarvest={harvested}
          droop={hasPending}
          pop={showPop}
          showBubble={!harvested}
          bubbleText={bubbleText}
        >
          {/* WaterDrops remontado via key={waterTick} para replay da animação (GARD-05) */}
          <WaterDrops key={waterTick} />
          {/* HarvestButton visível apenas quando canHarvest (GARD-08) */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <HarvestButton visible={canHarvest} onHarvest={handleHarvest} />
          </div>
        </GardenHero>
      </div>

      {/* Lista de tarefas — UI mínima para disparar GARD-05 (task cards completos na Fase 4) */}
      <div
        style={{
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => !task.done && handleTaskComplete(task.id)}
            disabled={task.done}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--color-kreds-card)',
              border: '1px solid var(--color-kreds-border)',
              borderRadius: 16,
              cursor: task.done ? 'default' : 'pointer',
              opacity: task.done ? 0.6 : 1,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 20 }}>{task.emoji}</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-kreds-text)',
                textDecoration: task.done ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </span>
          </button>
        ))}
      </div>

      {/* Overlay de celebração (GARD-10) */}
      <CelebrationOverlay
        visible={showOverlay}
        verse={verse}
        onClose={handleCloseOverlay}
      />
    </div>
  )
}
