import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'

export default function FamilyWishesPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '80px 24px 100px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}
        >
          ✨
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
            fontWeight: 800,
            fontSize: '1.75rem',
            letterSpacing: '-0.02em',
            color: 'var(--color-primary, #154212)',
            margin: '0 0 12px',
          }}
        >
          Sonhos
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--color-text-soft, #72796e)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Metas e desejos da família
        </p>
      </div>

      {/* Coming soon card */}
      <div
        style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '24px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(45,90,39,0.06)',
        }}
      >
        <p
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-primary, #154212)',
            margin: '0 0 12px',
          }}
        >
          Em breve
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}
        >
          Aqui seus filhos poderão criar metas, guardar Kreds para conquistas especiais
          e acompanhar o progresso rumo aos seus sonhos.
        </p>
        <Link
          href="/family/dashboard"
          style={{
            display: 'inline-flex',
            padding: '10px 24px',
            borderRadius: '99px',
            background: 'linear-gradient(135deg, #3b6934, #154212)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          Voltar ao jardim
        </Link>
      </div>

      <BottomNav active="sonhos" />
    </main>
  )
}
