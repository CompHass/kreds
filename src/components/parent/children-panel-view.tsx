'use client'

// D-01, D-04, D-08, D-09, D-12, D-13, D-14, D-15: Client Component raiz que orquestra
// o painel /children — clone de parent-panel-view.tsx. Gerencia lista + add + edit + reset PIN +
// reveal PIN + deactivate/reactivate via Server Actions com otimista + fire-and-forget
// (mesmo padrão de handleToggle em ParentPanelView).
// editingId: null=idle, 'new'=create, UUID=edit.
// confirmTargetId: qual criança tem o dialog de confirmação de deactivate/reactivate aberto (D-14).
// resetTargetId: qual criança tem o painel de reset de PIN aberto.
// revealedPins: cache client-side de PINs já decifrados via revealChildPin (D-12).
// profileOpen: page-local — D-04, não compartilhado com /tasks.

import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { ChildCard } from './child-card'
import { ChildFormPanel, type ChildFormData, EMPTY_CHILD_FORM } from './child-form-panel'
import { ChildPinResetPanel } from './child-pin-reset-panel'
import { ConfirmDeactivateDialog } from './confirm-deactivate-dialog'
import { GuardianProfileDrawer } from './guardian-profile-drawer'
import type { ChildProfileView } from '@/types/child'
import { isAvatarPreset } from '@/lib/avatars/presets'
import {
  createChild,
  updateChild,
  resetChildPin,
  revealChildPin,
  toggleChildActive,
} from '@/app/actions/children'

interface ChildrenPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string
  initialChildren: ChildProfileView[]
}

export function ChildrenPanelView({
  familyId,
  familyName,
  currentUserName,
  guardianEmail,
  initialChildren,
}: ChildrenPanelViewProps) {
  // Estado raiz — padrão parent-panel-view.tsx
  const [children, setChildren] = useState<ChildProfileView[]>(initialChildren)
  // editingId: null=idle, 'new'=create, UUID=edit
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  // D-04: estado de abertura do drawer de perfil — page-local, não compartilhado com /tasks
  const [profileOpen, setProfileOpen] = useState(false)
  // D-14: qual criança tem o dialog de confirmação de deactivate/reactivate aberto
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)
  // Qual criança tem o painel de reset de PIN aberto
  const [resetTargetId, setResetTargetId] = useState<string | null>(null)
  // D-12: cache client-side de PINs já decifrados via reveal explícito
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({})

  const guardianInitial = currentUserName.charAt(0).toUpperCase()

  // ─── Handlers de mutação otimista + fire-and-forget (padrão parent-panel-view.tsx) ───

  async function handleSaveChild(data: ChildFormData) {
    if (editingId === 'new') {
      try {
        const saved = await createChild({ ...data, familyId })
        const newChild: ChildProfileView = {
          id: saved.id,
          displayName: saved.displayName,
          ageYears: saved.ageYears,
          accentColor: saved.accentColor,
          avatarPreset: saved.avatarPreset,
          active: saved.active,
          hasEncryptedPin: saved.pinEncrypted !== null,
        }
        setChildren((prev) => [...prev, newChild])
      } catch (err) {
        console.error('createChild failed', err)
      }
    } else if (editingId) {
      try {
        const saved = await updateChild(editingId, familyId, data)
        setChildren((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  displayName: saved.displayName,
                  ageYears: saved.ageYears,
                  accentColor: saved.accentColor,
                  avatarPreset: saved.avatarPreset,
                }
              : c,
          ),
        )
      } catch (err) {
        console.error('updateChild failed', err)
      }
    }
    setEditingId(null)
  }

  async function handleResetPin(pin: string) {
    if (!resetTargetId) return
    const targetId = resetTargetId
    try {
      await resetChildPin(targetId, familyId, pin)
      // Otimista: marca hasEncryptedPin=true após confirmação do servidor
      setChildren((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, hasEncryptedPin: true } : c)),
      )
    } catch (err) {
      console.error('resetChildPin failed', err)
    }
    setResetTargetId(null)
  }

  async function handleToggleReveal(childId: string) {
    // Já revelado — ocultar (não requer chamada ao servidor)
    if (revealedPins[childId]) {
      setRevealedPins((prev) => {
        const next = { ...prev }
        delete next[childId]
        return next
      })
      return
    }
    try {
      const pin = await revealChildPin(childId, familyId)
      // Pitfall 6: pin pode ser null para crianças pré-existentes sem pinEncrypted — não fazer nada
      if (pin === null) return
      setRevealedPins((prev) => ({ ...prev, [childId]: pin }))
    } catch (err) {
      console.error('revealChildPin failed', err)
    }
  }

  function handleConfirmDeactivate() {
    if (!confirmTargetId) return
    const child = children.find((c) => c.id === confirmTargetId)
    if (!child) return
    // Otimista: atualiza UI imediatamente
    setChildren((prev) =>
      prev.map((c) => (c.id === confirmTargetId ? { ...c, active: !c.active } : c)),
    )
    // Fire-and-forget — falha silenciosa aceitável para toggle (T-06-19 pattern)
    toggleChildActive(confirmTargetId, familyId, !child.active).catch((err) => {
      console.error('toggleChildActive failed', err)
    })
    setConfirmTargetId(null)
  }

  function handleNewChild() {
    setEditingId('new')
  }

  function handleCancelForm() {
    setEditingId(null)
  }

  const confirmTargetChild = children.find((c) => c.id === confirmTargetId)
  const resetTargetChild = children.find((c) => c.id === resetTargetId)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-kreds-bg)',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* Sidebar esquerda 80px fixa — D-05: activeRoute="children" */}
      <ParentSidebar
        guardianInitial={guardianInitial}
        onOpenProfile={() => setProfileOpen(true)}
        familyId={familyId}
        activeRoute="children"
      />

      {/* Main: topbar + conteúdo flex-row */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ParentTopbar
          familyName={familyName}
          currentUserName={currentUserName}
          onOpenProfile={() => setProfileOpen(true)}
        />

        {/* Área de conteúdo: lista de crianças (âncora visual primária) + painel direito */}
        <div style={{ display: 'flex', flex: 1 }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Botão "+ Adicionar criança" */}
            <button
              onClick={handleNewChild}
              aria-label="Adicionar criança"
              style={{
                alignSelf: 'flex-start',
                height: 40,
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--color-kreds-border)',
                background: 'var(--color-kreds-card)',
                color: 'var(--color-kreds-primary)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              + Adicionar criança
            </button>

            {/* Lista de child cards — âncora visual primária (08-UI-SPEC.md) */}
            {children.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '48px 24px',
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#27372C', margin: 0 }}>
                  Nenhuma criança cadastrada ainda
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--color-kreds-muted)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Adicione a primeira criança da família para começar a atribuir tarefas e
                  acompanhar o jardim.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {children.map((child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    revealedPin={revealedPins[child.id] ?? null}
                    onToggleReveal={() => handleToggleReveal(child.id)}
                    onResetPin={() => setResetTargetId(child.id)}
                    onToggleActive={() => setConfirmTargetId(child.id)}
                    onEdit={() => setEditingId(child.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Painel direito 336px — form add-child, reset PIN, ou idle placeholder */}
          <div style={{ padding: '16px 24px 16px 0', flexShrink: 0 }}>
            {resetTargetId !== null && resetTargetChild ? (
              <ChildPinResetPanel
                childName={resetTargetChild.displayName}
                onSubmit={handleResetPin}
                onCancel={() => setResetTargetId(null)}
              />
            ) : (
              <ChildFormPanel
                mode={editingId === 'new' ? 'create' : editingId ? 'edit' : 'idle'}
                initialData={
                  editingId && editingId !== 'new'
                    ? (() => {
                        const child = children.find((c) => c.id === editingId)
                        return child
                          ? {
                              displayName: child.displayName,
                              ageYears: child.ageYears,
                              accentColor: child.accentColor,
                              // valores legados desconhecidos caem no fallback 'initial'
                              avatarPreset: isAvatarPreset(child.avatarPreset)
                                ? child.avatarPreset
                                : ('initial' as const),
                            }
                          : undefined
                      })()
                    : undefined
                }
                onSave={handleSaveChild}
                onCancel={handleCancelForm}
              />
            )}
          </div>
        </div>
      </main>

      {/* D-04: Drawer de perfil do guardian — page-local, não compartilhado com /tasks */}
      <GuardianProfileDrawer
        open={profileOpen}
        guardianName={currentUserName}
        guardianEmail={guardianEmail}
        onClose={() => setProfileOpen(false)}
      />

      {/* D-14: confirmação obrigatória antes de mutar active — nunca toggle direto */}
      <ConfirmDeactivateDialog
        open={confirmTargetId !== null}
        childName={confirmTargetChild?.displayName ?? ''}
        willDeactivate={confirmTargetChild?.active ?? true}
        onConfirm={handleConfirmDeactivate}
        onOpenChange={(open) => !open && setConfirmTargetId(null)}
      />
    </div>
  )
}
