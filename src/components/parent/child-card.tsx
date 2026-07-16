'use client'

// Phase 8, Plan 04 (D-08, D-12, D-14): ChildCard — Frame C list-row.
// Avatar-by-initial + accentColor (D-08), masked/reveal PIN gated by
// hasEncryptedPin (Pitfall 6 — pre-existing children have no encrypted PIN),
// Redefinir PIN + Desativar/Reativar controls. The activity-history control
// (Frame C's other action) is deferred to Phase 9 and intentionally absent here.

import type { ChildProfileView } from '@/types/child'
import { ChildAvatar } from '@/components/avatar/child-avatar'

interface ChildCardProps {
  child: ChildProfileView
  revealedPin: string | null
  onToggleReveal: () => void
  onResetPin: () => void
  onToggleActive: () => void
  onEdit: () => void
}

export function ChildCard({
  child,
  revealedPin,
  onToggleReveal,
  onResetPin,
  onToggleActive,
  onEdit,
}: ChildCardProps) {
  return (
    <div
      data-testid="child-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        padding: 16,
        borderRadius: 24,
        background: 'var(--color-kreds-card)',
        boxSizing: 'border-box',
        opacity: child.active ? 1 : 0.55,
      }}
    >
      {/* Avatar 52x52 — preset ilustrado (Phase 14) ou inicial + gradiente accentColor */}
      <ChildAvatar
        displayName={child.displayName}
        accentColor={child.accentColor}
        avatarPreset={child.avatarPreset}
        size={52}
      />

      {/* Nome + idade */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C' }}>
          {child.displayName}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-kreds-muted)' }}>
          {child.ageYears} anos
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Região do PIN — masked/reveal, gated por hasEncryptedPin (Pitfall 6) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#27372C', letterSpacing: 2 }}>
            {revealedPin ?? '••••'}
          </span>
          <button
            type="button"
            onClick={onToggleReveal}
            disabled={!child.hasEncryptedPin}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: child.hasEncryptedPin ? 'var(--color-kreds-primary)' : 'var(--color-kreds-muted)',
              background: 'none',
              border: 'none',
              cursor: child.hasEncryptedPin ? 'pointer' : 'not-allowed',
              padding: 0,
            }}
          >
            {revealedPin ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {!child.hasEncryptedPin && (
          <span style={{ fontSize: 12, color: 'var(--color-kreds-muted)' }}>
            PIN ainda não definido
          </span>
        )}
      </div>

      {/* Editar */}
      <button
        type="button"
        onClick={onEdit}
        style={{
          height: 36,
          padding: '0 14px',
          borderRadius: 10,
          border: '1.5px solid #E2DECF',
          background: '#ffffff',
          color: 'var(--color-kreds-text)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Editar
      </button>

      {/* Redefinir PIN */}
      <button
        type="button"
        onClick={onResetPin}
        style={{
          height: 36,
          padding: '0 14px',
          borderRadius: 10,
          border: '1.5px solid #E2DECF',
          background: '#ffffff',
          color: 'var(--color-kreds-text)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Redefinir PIN
      </button>

      {/* Desativar / Reativar */}
      <button
        type="button"
        onClick={onToggleActive}
        style={{
          height: 36,
          padding: '0 14px',
          borderRadius: 10,
          border: child.active ? '1.5px solid #E6CFC4' : '1.5px solid #CBE0D0',
          background: child.active ? '#FBF1EC' : '#E7EFE8',
          color: child.active ? '#B14A2E' : '#3E6B4F',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {child.active ? 'Desativar' : 'Reativar'}
      </button>
    </div>
  )
}
