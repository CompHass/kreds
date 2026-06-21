'use client'

interface GateLockProps {
  open: boolean
}

export function GateLock({ open }: GateLockProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {/* Painel esquerdo — começa off-screen, desliza para cobrir ao abrir */}
      <div
        className="kreds-gateL absolute top-0 left-0 w-1/2 h-full bg-[#27372C]"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-101%)',
          transition: open ? 'transform 1s cubic-bezier(.76,0,.24,1)' : 'none',
        }}
      />
      {/* Painel direito — começa off-screen, desliza para cobrir ao abrir */}
      <div
        className="kreds-gateR absolute top-0 right-0 w-1/2 h-full bg-[#27372C]"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(101%)',
          transition: open ? 'transform 1s cubic-bezier(.76,0,.24,1)' : 'none',
        }}
      />
    </div>
  )
}
