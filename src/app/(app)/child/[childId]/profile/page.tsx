import { getBalance } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getActiveTasksForFamily } from '@/lib/db/tasks/queries'
import { requireChildSession } from '@/lib/auth/child-guard'

type ProfilePageProps = {
  params: Promise<{ childId: string }>
}

export const dynamic = 'force-dynamic'

export default async function ChildProfilePage({ params }: ProfilePageProps) {
  const { childId } = await params

  const session = await requireChildSession()
  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/profile`)
  }
  const familyId = session.familyId

  const [available, firstfruits, childProfile, tasks] = await Promise.all([
    getBalance(childId, 'available'),
    getBalance(childId, 'firstfruits'),
    db
      .select({ displayName: schema.childProfiles.displayName, avatarPreset: schema.childProfiles.avatarPreset })
      .from(schema.childProfiles)
      .where(and(eq(schema.childProfiles.id, childId), eq(schema.childProfiles.familyId, familyId)))
      .limit(1)
      .then((r) => r[0]),
    getActiveTasksForFamily(familyId),
  ])

  const displayName = childProfile?.displayName ?? 'Pequeno Guardião'
  const totalKreds = available + firstfruits
  const treesGrown = Math.floor(totalKreds / 50)

  const AVATAR_EMOJIS: Record<string, string> = {
    default: '🌿',
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    flower: '🌸',
  }
  const avatarEmoji = AVATAR_EMOJIS[childProfile?.avatarPreset ?? 'default'] ?? '🌿'

  return (
    <>
      {/* TopAppBar hidden on mobile, visible on desktop */}
      <header style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,248,245,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(194,201,187,0.2)',
        height: '64px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid rgba(21,66,18,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,241,233,0.9)',
            fontSize: '20px',
          }}>
            {avatarEmoji}
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#154212' }}>
            Sylvan Growth
          </h1>
        </div>
        <nav style={{ display: 'flex', gap: '32px' }}>
          {[
            { label: 'Forest', href: '/family/dashboard', icon: '🌳' },
            { label: 'Missions', href: '/family/tasks', icon: '✅' },
            { label: 'Garden', href: '#', icon: '🌸' },
            { label: 'Legacy', href: '#', icon: '🌿', active: true },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: item.active ? 700 : 600,
              color: item.active ? '#154212' : '#42493e',
              textDecoration: 'none',
              opacity: item.active ? 1 : 0.7,
              borderBottom: item.active ? '2px solid #154212' : 'none',
              paddingBottom: item.active ? '4px' : '0',
            }}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <button style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
        }}>
          ⚙️
        </button>
      </header>

      <main style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '32px 24px 120px',
      }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            margin: '0 0 8px',
            fontSize: '28px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #154212, #3b6934)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Meu Perfil
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#42493e',
            opacity: 0.8,
          }}>
            Bem-vindo à sua floresta de conquistas!
          </p>
        </div>

        {/* Profile Section */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '48px',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            {/* Glow */}
            <div style={{
              position: 'absolute',
              inset: '-8px',
              background: 'rgba(202,236,125,0.4)',
              borderRadius: '40px',
              filter: 'blur(20px)',
            }} />
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '40px',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              border: '4px solid rgba(255,255,255,0.8)',
              boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              position: 'relative',
              zIndex: 1,
            }}>
              {avatarEmoji}
            </div>
            {/* Edit button */}
            <button style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              width: '48px',
              height: '48px',
              borderRadius: '9999px',
              background: '#154212',
              color: '#fff',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 12px rgba(45,90,39,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              zIndex: 2,
            }}>
              ✏️
            </button>
          </div>

          {/* Name */}
          <h2 style={{
            margin: '0 0 8px',
            fontSize: '28px',
            fontWeight: 700,
            color: '#28180b',
          }}>
            {displayName}
          </h2>

          {/* Level badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(251,221,199,0.8)',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#154212',
            letterSpacing: '0.02em',
          }}>
            <span>🏆</span>
            Nível {Math.max(1, Math.floor(totalKreds / 100))} – Explorador da Mata
          </div>
        </section>

        {/* Legado Section */}
        <section style={{ marginBottom: '48px' }}>
          <h3 style={{
            margin: '0 0 24px',
            fontSize: '28px',
            fontWeight: 700,
            color: '#28180b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span>🌿</span> Seu Legado
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
          }}>
            {/* Cultivo */}
            <div style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(45,90,39,0.15)',
              boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
              borderRadius: '16px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '9999px',
                background: 'rgba(45,90,39,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}>
                🌳
              </div>
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                color: '#42493e',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Cultivo
              </p>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: '#154212',
                lineHeight: 1,
              }}>
                {treesGrown}
              </p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#28180b',
              }}>
                Árvores Cultivadas
              </p>
            </div>

            {/* Generosidade */}
            <div style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(45,90,39,0.15)',
              boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
              borderRadius: '16px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '9999px',
                background: 'rgba(76,103,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}>
                💰
              </div>
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                color: '#42493e',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Generosidade
              </p>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: '#4c6700',
                lineHeight: 1,
              }}>
                {available}
              </p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#28180b',
              }}>
                Kreds Ganhos
              </p>
            </div>

            {/* Primícias */}
            <div style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(45,90,39,0.15)',
              boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
              borderRadius: '16px',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '8px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom right, rgba(210,165,1,0.04), transparent)',
              }} />
              <div style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '52px',
                position: 'relative',
                zIndex: 1,
              }}>
                🧺
              </div>
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 600,
                color: '#42493e',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 1,
              }}>
                Primícias
              </p>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: '#755b00',
                lineHeight: 1,
                position: 'relative',
                zIndex: 1,
              }}>
                {firstfruits}
              </p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#28180b',
                position: 'relative',
                zIndex: 1,
              }}>
                Kreds Doados
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          <button style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '14px',
            background: 'linear-gradient(to right, #154212, #3b6934)',
            color: '#fff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(45,90,39,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            ⚙️ Configurações
          </button>

          <button style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(45,90,39,0.15)',
            boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
            color: '#154212',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}>
            😊 Trocar Avatar
          </button>

          <Link
            href="/api/auth/signout"
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '14px',
              background: 'transparent',
              color: '#ba1a1a',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            ↪️ Sair
          </Link>
        </section>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,241,233,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(45,90,39,0.08)',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '10px 16px 20px',
      }}>
        <a href="/family/dashboard" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌳</span>
          Forest
        </a>
        <a href="/family/tasks" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          Missions
        </a>
        <a href="#" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌸</span>
          Garden
        </a>
        <a href="#" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          background: 'rgba(202,236,125,0.5)', color: '#506b03',
          borderRadius: '9999px', padding: '6px 18px', textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌿</span>
          Legacy
        </a>
      </nav>
    </>
  )
}
