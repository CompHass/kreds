'use client'

// GARD-05, GARD-08, GARD-10: Client Component raiz que orquestra o jardim interativo
// API-03: handleHarvest chama POST /api/child/[childId]/harvest com commandId estável (idempotência)
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
// Fase 4 — componentes de tarefas, dízimo, cofrinho e navegação (CTASK-01..05)
import { TaskCard } from '@/components/tasks/task-card'
import { TitheCard } from '@/components/tasks/tithe-card'
import { SavingsCard } from '@/components/tasks/savings-card'
import { BottomNav } from '@/components/tasks/bottom-nav'

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

export function GardenView({ childId, seed, verse }: GardenViewProps) {
  // Estado interativo
  const [tasks, setTasks] = useState(seed.tasks)
  const [waterTick, setWaterTick] = useState(0)
  const [showPop, setShowPop] = useState(false)
  const [harvested, setHarvested] = useState(seed.harvested)
  const [showOverlay, setShowOverlay] = useState(false)
  // Fase 4 — titheDone elevado para state (Pitfall 1 / D-02 / CTASK-03)
  const [titheDone, setTitheDone] = useState(seed.titheDone)
  // API-03: commandId estável entre re-renders para idempotência (mesmo UUID em caso de retry)
  const [harvestCommandId] = useState(() => crypto.randomUUID())
  const [harvestPending, setHarvestPending] = useState(false)

  // Derivados (recalculados no render)
  const doneCount = tasks.filter((t) => t.done).length
  const stage = getPlantStage(doneCount, tasks.length)
  const waterCount = doneCount
  const canHarvest = doneCount === tasks.length && !harvested
  const hasPending = doneCount < tasks.length
  const bubbleText = getBubbleText({ ...seed, tasks, harvested })

  // Handlers
  function handleTaskToggle(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    )
    const wasAlreadyDone = tasks.find((t) => t.id === taskId)?.done ?? false
    if (!wasAlreadyDone) {
      // marcando: anima gota e pop
      setWaterTick((tick) => tick + 1)
      setShowPop(true)
      setTimeout(() => setShowPop(false), 650)
    }
  }

  // API-03: chama POST /api/child/[childId]/harvest com commandId estável (idempotência)
  // 409 = já colheu este ciclo — ainda mostra overlay (sucesso idempotente)
  async function handleHarvest() {
    if (harvestPending) return
    setHarvestPending(true)

    const totalAmount = tasks
      .filter((t) => t.done)
      .reduce((sum, t) => sum + (t.kredsValue ?? 0), 0)

    try {
      const res = await fetch(`/api/child/${childId}/harvest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId: harvestCommandId,
          totalAmount,
          familyId: '',   // servidor usa familyId da sessão JWT (T-06-13 mitigado)
        }),
      })

      if (res.ok || res.status === 409) {
        // 200 = colheita registrada; 409 = já colhida (idempotente) — ambos mostram overlay
        setHarvested(true)
        setShowOverlay(true)
      } else {
        console.error('Harvest failed', res.status)
      }
    } catch (e) {
      console.error('Harvest network error', e)
    } finally {
      setHarvestPending(false)
    }
  }

  // Fase 4 — handler de dízimo (D-11, CTASK-03); sem fetch/POST (D-12)
  function handleTithe() {
    setTitheDone(true)
  }

  // Desfazer dízimo: reverte titheDone para false
  function handleUntithe() {
    setTitheDone(false)
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
        paddingBottom: 80, // reservado para bottom nav Fase 4 (D-05) — NÃO remover (Pitfall 4)
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

      {/* Hero do jardim com estado interativo — ancora #section-garden para BottomNav */}
      <div id="section-garden" style={{ padding: '0 16px' }}>
        <GardenHero
          stage={stage}
          season={seed.season}
          waterCount={waterCount}
          titheDone={titheDone}
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

      {/* Lista de tarefas via TaskCard (CTASK-01, CTASK-02) — ancora #section-tasks para BottomNav */}
      <ul
        id="section-tasks"
        aria-label="Lista de tarefas"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} onComplete={handleTaskToggle} />
          </li>
        ))}
      </ul>

      {/* Card de dízimo (CTASK-03) — titheDone state passado a GardenHero via handleTithe/handleUntithe */}
      <TitheCard done={titheDone} onPlant={handleTithe} onUnplant={handleUntithe} />

      {/* Card de cofrinho (CTASK-04) — ancora #section-savings para BottomNav */}
      <div id="section-savings">
        <SavingsCard savings={seed.savings} goal={seed.goal} />
      </div>

      {/* BottomNav fixo 80px (CTASK-05) — consome #section-garden/#section-tasks/#section-savings */}
      <BottomNav />

      {/* Overlay de celebração (GARD-10) */}
      <CelebrationOverlay
        visible={showOverlay}
        verse={verse}
        onClose={handleCloseOverlay}
      />
    </div>
  )
}
