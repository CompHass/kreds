'use client'

// PTASK-04: TaskToggle — switch 42×24px com knob 18×18px branco.
// role="switch", aria-checked, aria-label obrigatório.
// Reutilizado no ApprovalToggle do TaskFormPanel (Plano 03).

interface TaskToggleProps {
  checked: boolean
  onChange: () => void
  label: string
}

export function TaskToggle({ checked, onChange, label }: TaskToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 42,
        height: 24,
        borderRadius: 'var(--radius-pill)',
        background: checked ? '#3E6B4F' : '#D7DBCC',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background .2s ease',
      }}
    >
      {/* Knob 18×18px branco */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 20 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left .2s ease',
        }}
      />
    </button>
  )
}
