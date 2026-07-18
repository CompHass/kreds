'use client'

// Phase 10 — Client Component raiz do painel /settings. Clone estrutural de
// reports-panel-view.tsx: Sidebar + Topbar + GuardianProfileDrawer page-local.
// Três seções independentes, cada uma com seu próprio save/feedback: nome da
// família, dia de início do ciclo semanal, preferências de notificação
// (armazenadas apenas — sem canal de envio, ver notificationPreferences).
//
// Phase 13 — seção adicional "Segurança" para redefinir o PIN do responsável.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { GuardianProfileDrawer } from './guardian-profile-drawer'
import {
  updateFamilyName,
  updateFamilyCycleStartDay,
  updateNotificationPreferences,
} from '@/app/actions/family'
import { exitGuardianSession } from '@/app/actions/guardian-pin'

interface NotificationPrefs {
  taskCompleted: boolean
  goalAchieved: boolean
  weeklyReportReady: boolean
}

interface SettingsPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string
  cycleStartDay: number
  notificationPreferences: NotificationPrefs
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function SettingsPanelView({
  familyId,
  familyName,
  currentUserName,
  guardianEmail,
  cycleStartDay,
  notificationPreferences,
}: SettingsPanelViewProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const [resettingPin, setResettingPin] = useState(false)

  // Nome da família
  const [name, setName] = useState(familyName)
  // Espelha familyName localmente para o breadcrumb do topbar refletir o save
  // sem depender de um novo request SSR (revalidatePath só invalida o cache).
  const [displayedFamilyName, setDisplayedFamilyName] = useState(familyName)
  const [savingName, setSavingName] = useState(false)
  const [nameFeedback, setNameFeedback] = useState<'idle' | 'saved' | 'error'>('idle')

  // Dia de início do ciclo semanal
  const [selectedCycleDay, setSelectedCycleDay] = useState(cycleStartDay)
  const [savedCycleDay, setSavedCycleDay] = useState(cycleStartDay)
  const [savingCycleDay, setSavingCycleDay] = useState(false)
  const [cycleDayFeedback, setCycleDayFeedback] = useState<'idle' | 'saved' | 'error'>('idle')

  // Preferências de notificação
  const [prefs, setPrefs] = useState(notificationPreferences)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsFeedback, setPrefsFeedback] = useState<'idle' | 'saved' | 'error'>('idle')

  const guardianInitial = currentUserName.charAt(0).toUpperCase()
  const trimmed = name.trim()
  const canSaveName = trimmed.length > 0 && trimmed.length <= 80 && trimmed !== displayedFamilyName && !savingName
  const canSaveCycleDay = selectedCycleDay !== savedCycleDay && !savingCycleDay

  async function handleSaveName() {
    if (!canSaveName) return
    setSavingName(true)
    setNameFeedback('idle')
    try {
      const saved = await updateFamilyName(familyId, trimmed)
      setDisplayedFamilyName(saved.name)
      setNameFeedback('saved')
    } catch (err) {
      console.error('updateFamilyName failed', err)
      setNameFeedback('error')
    } finally {
      setSavingName(false)
    }
  }

  async function handleSaveCycleDay() {
    if (!canSaveCycleDay) return
    setSavingCycleDay(true)
    setCycleDayFeedback('idle')
    try {
      const saved = await updateFamilyCycleStartDay(familyId, selectedCycleDay)
      setSavedCycleDay(saved.cycleStartDay)
      setCycleDayFeedback('saved')
    } catch (err) {
      console.error('updateFamilyCycleStartDay failed', err)
      setCycleDayFeedback('error')
    } finally {
      setSavingCycleDay(false)
    }
  }

  async function handleTogglePref(key: keyof NotificationPrefs) {
    if (savingPrefs) return
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSavingPrefs(true)
    setPrefsFeedback('idle')
    try {
      await updateNotificationPreferences(familyId, next)
      setPrefsFeedback('saved')
    } catch (err) {
      setPrefs(prefs) // reverte o otimismo
      console.error('updateNotificationPreferences failed', err)
      setPrefsFeedback('error')
    } finally {
      setSavingPrefs(false)
    }
  }

  // Phase 13 — Redefinir PIN do responsável. Limpa o guardian-session atual
  // (trancando o painel) e vai ao setup, onde um novo PIN é cadastrado e um
  // novo step-up é emitido. Reaproveita o mesmo fluxo do 1º acesso.
  async function handleResetGuardianPin() {
    if (resettingPin) return
    setResettingPin(true)
    try {
      await exitGuardianSession()
      router.push(`/family/${familyId}/guardian-setup`)
    } catch (err) {
      console.error('exitGuardianSession failed', err)
      setResettingPin(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-kreds-bg)',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <ParentSidebar
        guardianInitial={guardianInitial}
        onOpenProfile={() => setProfileOpen(true)}
        familyId={familyId}
        activeRoute="settings"
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ParentTopbar
          familyName={displayedFamilyName}
          currentUserName={currentUserName}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 420,
          }}
        >
          {/* Nome da família */}
          <div
            style={{
              padding: 20,
              borderRadius: 24,
              background: 'var(--color-kreds-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
              Nome da família
            </span>

            <input
              aria-label="Nome da família"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameFeedback('idle')
              }}
              maxLength={80}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--color-kreds-border)',
                background: '#ffffff',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-kreds-text)',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleSaveName}
                disabled={!canSaveName}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: canSaveName ? 'var(--color-kreds-primary)' : 'var(--color-kreds-border)',
                  color: canSaveName ? '#ffffff' : 'var(--color-kreds-muted)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: canSaveName ? 'pointer' : 'default',
                }}
              >
                {savingName ? 'Salvando…' : 'Salvar'}
              </button>

              {nameFeedback === 'saved' && (
                <span style={{ fontSize: 13, color: 'var(--color-kreds-primary)' }}>Salvo ✓</span>
              )}
              {nameFeedback === 'error' && (
                <span style={{ fontSize: 13, color: 'var(--color-kreds-error)' }}>Erro ao salvar</span>
              )}
            </div>
          </div>

          {/* Dia de início do ciclo semanal */}
          <div
            style={{
              padding: 20,
              borderRadius: 24,
              background: 'var(--color-kreds-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
              Início do ciclo semanal
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-kreds-muted)', marginTop: -12 }}>
              Dia em que tarefas, jardim e relatórios reiniciam a semana
            </span>

            <select
              aria-label="Dia de início do ciclo semanal"
              value={selectedCycleDay}
              onChange={(e) => {
                setSelectedCycleDay(Number(e.target.value))
                setCycleDayFeedback('idle')
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--color-kreds-border)',
                background: '#ffffff',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-kreds-text)',
              }}
            >
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleSaveCycleDay}
                disabled={!canSaveCycleDay}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: canSaveCycleDay ? 'var(--color-kreds-primary)' : 'var(--color-kreds-border)',
                  color: canSaveCycleDay ? '#ffffff' : 'var(--color-kreds-muted)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: canSaveCycleDay ? 'pointer' : 'default',
                }}
              >
                {savingCycleDay ? 'Salvando…' : 'Salvar'}
              </button>

              {cycleDayFeedback === 'saved' && (
                <span style={{ fontSize: 13, color: 'var(--color-kreds-primary)' }}>Salvo ✓</span>
              )}
              {cycleDayFeedback === 'error' && (
                <span style={{ fontSize: 13, color: 'var(--color-kreds-error)' }}>Erro ao salvar</span>
              )}
            </div>
          </div>

          {/* Preferências de notificação — sem envio real ainda, só preferências salvas */}
          <div
            style={{
              padding: 20,
              borderRadius: 24,
              background: 'var(--color-kreds-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
              Notificações
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-kreds-muted)', marginTop: -8 }}>
              Preferências salvas — envio (e-mail/push) chega em uma fase futura
            </span>

            {(
              [
                { key: 'taskCompleted', label: 'Tarefa concluída pela criança' },
                { key: 'goalAchieved', label: 'Meta de poupança atingida' },
                { key: 'weeklyReportReady', label: 'Relatório semanal pronto' },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 0',
                  cursor: savingPrefs ? 'default' : 'pointer',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-kreds-text)' }}>
                  {label}
                </span>
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={prefs[key]}
                  disabled={savingPrefs}
                  onChange={() => handleTogglePref(key)}
                  style={{ width: 18, height: 18, cursor: savingPrefs ? 'default' : 'pointer' }}
                />
              </label>
            ))}

            {prefsFeedback === 'saved' && (
              <span style={{ fontSize: 13, color: 'var(--color-kreds-primary)' }}>Salvo ✓</span>
            )}
            {prefsFeedback === 'error' && (
              <span style={{ fontSize: 13, color: 'var(--color-kreds-error)' }}>Erro ao salvar</span>
            )}
          </div>

          {/* Segurança — Phase 13: redefinir PIN do responsável */}
          <div
            style={{
              padding: 20,
              borderRadius: 24,
              background: 'var(--color-kreds-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
              Segurança
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-kreds-muted)', marginTop: -8 }}>
              PIN usado para acessar este painel. A troca tranca a sessão atual.
            </span>
            <button
              onClick={handleResetGuardianPin}
              disabled={resettingPin}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 20px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--color-kreds-border)',
                background: '#ffffff',
                color: 'var(--color-kreds-text)',
                fontSize: 14,
                fontWeight: 700,
                cursor: resettingPin ? 'default' : 'pointer',
              }}
            >
              {resettingPin ? 'Indo…' : 'Redefinir PIN do responsável'}
            </button>
          </div>
        </div>
      </main>

      <GuardianProfileDrawer
        open={profileOpen}
        guardianName={currentUserName}
        guardianEmail={guardianEmail}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  )
}
