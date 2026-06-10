import Link from 'next/link'

type NavItem = {
  label: string
  href: string
  icon: string
  active?: boolean
}

const NAV_STYLE: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  background: 'rgba(255,241,233,0.94)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 -4px 20px rgba(45,90,39,0.08)',
  borderRadius: '20px 20px 0 0',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '10px 16px 20px',
}

export function ChildBottomNav({ active, childId }: { active: 'jardim' | 'tarefas' | 'sonhos' | 'saldo'; childId: string }) {
  const items: NavItem[] = [
    { label: 'Jardim', href: `/child/${childId}/dashboard`, icon: '🪴', active: active === 'jardim' },
    { label: 'Tarefas', href: `/child/${childId}/tasks`, icon: '📋', active: active === 'tarefas' },
    { label: 'Sonhos', href: `/child/${childId}/dreams`, icon: '✨', active: active === 'sonhos' },
    { label: 'Saldo', href: `/child/${childId}/balance`, icon: '🪙', active: active === 'saldo' },
  ]

  return (
    <nav style={NAV_STYLE}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
            ...(item.active
              ? {
                  background: 'rgba(202,236,125,0.55)',
                  color: '#4c6700',
                  borderRadius: '9999px',
                  padding: '6px 20px',
                  fontWeight: 700,
                  fontSize: '11px',
                }
              : {
                  color: '#72796e',
                  opacity: 0.7,
                  padding: '6px 8px',
                  fontWeight: 600,
                  fontSize: '11px',
                }),
          }}
        >
          <span style={{ fontSize: '20px' }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
