'use client'

// Phase 10 — Client Component raiz do painel /settings. Clone estrutural de
// reports-panel-view.tsx: Sidebar + Topbar + GuardianProfileDrawer page-local,
// com a área de conteúdo trocada por um form de edição do nome da família.
// Escopo desta fase: apenas nome da família — ver comentário em settings/page.tsx.

import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { GuardianProfileDrawer } from './guardian-profile-drawer'
import { updateFamilyName } from '@/app/actions/family'

interface SettingsPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string
}

export function SettingsPanelView({
  familyId,
  familyName,
  currentUserName,
  guardianEmail,
}: SettingsPanelViewProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [name, setName] = useState(familyName)
  // Espelha familyName localmente para o breadcrumb do topbar refletir o save
  // sem depender de um novo request SSR (revalidatePath só invalida o cache).
  const [displayedFamilyName, setDisplayedFamilyName] = useState(familyName)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'saved' | 'error'>('idle')

  const guardianInitial = currentUserName.charAt(0).toUpperCase()
  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed.length <= 80 && trimmed !== displayedFamilyName && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setFeedback('idle')
    try {
      const saved = await updateFamilyName(familyId, trimmed)
      setDisplayedFamilyName(saved.name)
      setFeedback('saved')
    } catch (err) {
      console.error('updateFamilyName failed', err)
      setFeedback('error')
    } finally {
      setSaving(false)
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div
            style={{
              maxWidth: 420,
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
                setFeedback('idle')
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
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: canSave ? 'var(--color-kreds-primary)' : 'var(--color-kreds-border)',
                  color: canSave ? '#ffffff' : 'var(--color-kreds-muted)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: canSave ? 'pointer' : 'default',
                }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>

              {feedback === 'saved' && (
                <span style={{ fontSize: 13, color: 'var(--color-kreds-primary)' }}>
                  Salvo ✓
                </span>
              )}
              {feedback === 'error' && (
                <span style={{ fontSize: 13, color: 'var(--color-kreds-error)' }}>
                  Erro ao salvar
                </span>
              )}
            </div>
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
