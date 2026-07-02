'use client'

// D-14: project's first Radix AlertDialog — confirms deactivate/reactivate before
// mutating child.active. Controlled open/onOpenChange, no Trigger (button lives in
// ChildCard). Copy/color driven by willDeactivate per 08-UI-SPEC.md.

import { AlertDialog } from 'radix-ui'

interface ConfirmDeactivateDialogProps {
  open: boolean
  childName: string
  willDeactivate: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ConfirmDeactivateDialog({
  open,
  childName,
  willDeactivate,
  onConfirm,
  onOpenChange,
}: ConfirmDeactivateDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(39,55,44,.25)',
            zIndex: 60,
          }}
        />
        <AlertDialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            background: '#ffffff',
            borderRadius: 16,
            padding: 24,
            width: 360,
            zIndex: 61,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <AlertDialog.Title style={{ fontSize: 18, fontWeight: 700, color: '#27372C', margin: 0 }}>
            {willDeactivate ? `Desativar ${childName}?` : `Reativar ${childName}?`}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{ fontSize: 14, color: 'var(--color-kreds-muted)', margin: 0, lineHeight: 1.5 }}
          >
            {willDeactivate
              ? `${childName} não conseguirá fazer login até ser reativado(a).`
              : `${childName} poderá fazer login novamente.`}
          </AlertDialog.Description>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 13,
                  border: '1.5px solid #E2DECF',
                  background: 'var(--color-kreds-card)',
                  color: 'var(--color-kreds-muted)',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 13,
                  border: 'none',
                  background: willDeactivate ? '#FBF1EC' : 'var(--color-kreds-primary)',
                  color: willDeactivate ? '#B14A2E' : '#ffffff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {willDeactivate ? 'Desativar' : 'Reativar'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
