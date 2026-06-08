import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getActiveTasksForFamily, getAllTasksForFamily } from '@/lib/db/tasks/queries'

export const dynamic = 'force-dynamic'

const TREE_TYPES = [
  { name: 'Macieira', subtitle: 'CRESCIMENTO DOCE', icon: '🍎', bgColor: '#fef3f0', iconBg: '#fce8e3' },
  { name: 'Carvalho', subtitle: 'FORÇA ANTIGA', icon: '🌳', bgColor: '#f0f4ef', iconBg: '#e0eddf' },
  { name: 'Cedro', subtitle: 'ALTITUDE MAJESTOSA', icon: '🌲', bgColor: '#f0f6f2', iconBg: '#dceee1' },
]

const STAGE_MAP = [
  { label: 'Estágio 1/5', stageName: 'Semente', nextStage: 'Muda', progress: 20, color: '#8B5A2B', bgColor: 'rgba(255,241,230,0.9)', borderColor: 'rgba(139,90,43,0.2)' },
  { label: 'Estágio 2/5', stageName: 'Brotinho', nextStage: 'Muda', progress: 40, color: '#2d5a27', bgColor: 'rgba(240,248,238,0.9)', borderColor: 'rgba(45,90,39,0.2)' },
  { label: 'Completa!', stageName: 'Árvore Frondosa', nextStage: '100%', progress: 100, color: '#154212', bgColor: 'rgba(230,245,228,0.9)', borderColor: 'rgba(21,66,18,0.25)', completed: true },
]

export default async function FamilyTasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ showInactive?: string }>
}) {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.role, 'guardian'),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const familyId = membership.familyId

  const params = searchParams ? await searchParams : undefined
  const showInactive = params?.showInactive === 'true'

  const tasks = showInactive
    ? await getAllTasksForFamily(familyId)
    : await getActiveTasksForFamily(familyId)

  const children = await db
    .select({
      id: schema.childProfiles.id,
      displayName: schema.childProfiles.displayName,
      avatarPreset: schema.childProfiles.avatarPreset,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.familyId, familyId),
        eq(schema.childProfiles.active, true),
      ),
    )

  return (
    <>
      {/* Fixed TopAppBar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,248,245,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(194,201,187,0.2)',
        boxShadow: '0 1px 6px rgba(45,90,39,0.06)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            background: 'rgba(202,236,125,0.5)',
            border: '2px solid rgba(188,240,174,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            🌿
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: '#154212',
            letterSpacing: '-0.01em',
          }}>
            Sylvan Growth
          </h1>
        </div>
        <Link
          href="/family/dashboard"
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            color: '#154212',
            textDecoration: 'none',
            fontSize: '18px',
          }}
          aria-label="Configurações"
        >
          ⚙️
        </Link>
      </header>

      <main style={{
        paddingTop: '96px',
        paddingBottom: '100px',
        padding: '96px 24px 100px',
        maxWidth: '768px',
        margin: '0 auto',
      }}>
        {/* Header Section */}
        <section style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '40px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: '32px',
              fontWeight: 700,
              color: '#154212',
              lineHeight: 1.2,
            }}>
              Cultivar Missões
            </h2>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: '#42493e',
              lineHeight: 1.5,
              maxWidth: '400px',
            }}>
              Com zelo e dedicação, cada pequena tarefa faz nossa floresta crescer. Qual semente vamos regar hoje?
            </p>
          </div>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '16px',
              background: 'linear-gradient(to right, #2d5a27, #3b6934)',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(45,90,39,0.2)',
              whiteSpace: 'nowrap',
            }}
            onClick={undefined}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Nova Missão
          </button>
        </section>

        {/* Mission Cards Grid */}
        {tasks.length > 0 ? (
          <section style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {tasks.map((task, idx) => {
                const stage = STAGE_MAP[idx % STAGE_MAP.length]
                const treeType = TREE_TYPES[idx % TREE_TYPES.length]
                const isCompleted = stage.completed

                return (
                  <div
                    key={task.id}
                    style={{
                      background: isCompleted
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(188,240,174,0.15) 100%)'
                        : 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isCompleted
                        ? '1px solid rgba(45,90,39,0.25)'
                        : '0.5px solid rgba(161,212,148,0.3)',
                      boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
                      borderRadius: '24px',
                      padding: '24px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Completed star */}
                    {isCompleted && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '24px',
                      }}>
                        ⭐
                      </div>
                    )}

                    {/* Icon + Stage badge row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        background: isCompleted ? '#154212' : 'rgba(255,236,220,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(45,90,39,0.06)',
                      }}>
                        {isCompleted ? '🍳' : idx % 3 === 0 ? '🛏️' : '📖'}
                      </div>
                      <span style={{
                        background: isCompleted ? '#d2a501' : 'rgba(202,236,125,0.6)',
                        color: isCompleted ? '#503d00' : '#506b03',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}>
                        {stage.label}
                      </span>
                    </div>

                    {/* Task title */}
                    <h3 style={{
                      margin: '0 0 4px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#154212',
                    }}>
                      {task.title}
                    </h3>

                    {/* Tree link */}
                    <p style={{
                      margin: '0 0 24px',
                      fontSize: '14px',
                      color: '#42493e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span>🌳</span> Ligado à {treeType.name}
                      {'childName' in task && task.childName ? ` · ${task.childName}` : ''}
                    </p>

                    {/* Progress */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isCompleted ? '#154212' : '#42493e',
                        marginBottom: '8px',
                        letterSpacing: '0.04em',
                      }}>
                        <span>{stage.stageName}</span>
                        <span>{isCompleted ? '100%' : stage.nextStage}</span>
                      </div>
                      <div style={{
                        position: 'relative',
                        height: '12px',
                        background: isCompleted ? 'rgba(161,212,148,0.3)' : '#e5e7eb',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${stage.progress}%`,
                          background: 'linear-gradient(to right, #bcf0ae, #3b6934)',
                          borderRadius: '9999px',
                        }} />
                      </div>
                    </div>

                    {/* Action button */}
                    <button style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      border: isCompleted ? 'none' : '1px solid rgba(194,201,187,0.5)',
                      background: isCompleted ? 'rgba(255,236,220,0.6)' : 'transparent',
                      color: '#154212',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}>
                      <span>{isCompleted ? '🌱' : '🔄'}</span>
                      {isCompleted ? 'Plantar Nova' : 'Alterar Árvore'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          <section style={{ marginBottom: '48px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(161,212,148,0.3)',
              borderRadius: '24px',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
              <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#154212' }}>
                Nenhuma missão ainda
              </p>
              <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#72796e' }}>
                Adicione a primeira responsabilidade para começar a crescer!
              </p>
              {children.length === 0 && (
                <Link href="/family/children" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  background: '#154212',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                }}>
                  Adicionar filho primeiro
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Available Trees Section */}
        <section>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: '24px',
            fontWeight: 700,
            color: '#154212',
          }}>
            Árvores Disponíveis
          </h2>
          <p style={{
            margin: '0 0 32px',
            fontSize: '14px',
            color: '#42493e',
            lineHeight: 1.5,
          }}>
            Veja como suas sementes podem crescer com zelo e missões cumpridas!
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '24px',
          }}>
            {TREE_TYPES.map((tree, treeIdx) => (
              <div
                key={tree.name}
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '0.5px solid rgba(161,212,148,0.3)',
                  boxShadow: '0 8px 32px rgba(45,90,39,0.08)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                }}
              >
                {/* Tree image area */}
                <div style={{
                  height: '160px',
                  background: tree.bgColor,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* CSS tree illustration */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0',
                  }}>
                    <div style={{
                      fontSize: treeIdx === 1 ? '72px' : '60px',
                      filter: 'drop-shadow(0 8px 16px rgba(45,90,39,0.2))',
                    }}>
                      {tree.icon}
                    </div>
                  </div>
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)',
                  }} />
                  {/* Label */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '16px',
                  }}>
                    <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 700, color: '#154212' }}>
                      {tree.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#42493e', letterSpacing: '0.08em' }}>
                      {tree.subtitle}
                    </p>
                  </div>
                </div>

                {/* Growth stages */}
                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}>
                  {[1, 2, 3, 4, 5].map((stage) => (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '9999px',
                        background: stage === 5
                          ? (treeIdx === 0 ? 'rgba(161,212,148,0.6)' : treeIdx === 1 ? '#d2a501' : 'rgba(202,236,125,0.6)')
                          : 'rgba(255,234,220,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#154212',
                        border: '1px solid rgba(45,90,39,0.1)',
                        flexShrink: 0,
                      }}>
                        {stage}
                      </div>
                      {stage < 5 && (
                        <div style={{
                          flex: 1,
                          height: '2px',
                          background: 'rgba(194,201,187,0.4)',
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Task Creation Form (toggle) */}
        {children.length > 0 && (
          <section style={{ marginTop: '48px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(161,212,148,0.3)',
              borderRadius: '24px',
              padding: '28px 24px',
            }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#154212' }}>
                Adicionar Missão
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#72796e', lineHeight: 1.5 }}>
                Crie uma responsabilidade semanal para seu filho. Com fidelidade e dedicação, cada tarefa concluída fortalece o caráter.
              </p>
              <TaskCreationForm children={children} />
            </div>
          </section>
        )}

        {/* Toggle inactive */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            href={showInactive ? '/family/tasks' : '/family/tasks?showInactive=true'}
            style={{ fontSize: '13px', color: '#72796e', textDecoration: 'none' }}
          >
            {showInactive ? 'Ocultar inativas' : 'Mostrar inativas'}
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
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
          background: 'rgba(202,236,125,0.5)', color: '#506b03',
          borderRadius: '9999px', padding: '6px 18px', textDecoration: 'none', fontSize: '10px', fontWeight: 700,
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
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌿</span>
          Legacy
        </a>
      </nav>
    </>
  )
}

function TaskCreationForm({ children }: {
  children: { id: string; displayName: string; avatarPreset: string }[]
}) {
  return (
    <form
      id="task-creation-form"
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      suppressHydrationWarning
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('task-creation-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = {
      title: form.querySelector('[name="title"]').value,
      description: form.querySelector('[name="description"]').value || undefined,
      assignedChildId: form.querySelector('[name="assignedChildId"]').value,
      kredsValue: Number(form.querySelector('[name="kredsValue"]').value),
    };
    fetch('/api/families/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function(res) {
      if (res.ok) { window.location.reload(); }
      else { res.json().then(function(err) { alert('Erro: ' + (err.error || 'Tente novamente')); }); }
    }).catch(function() { alert('Erro de rede. Tente novamente.'); });
  });
})();
          `,
        }}
      />

      <input
        name="title"
        type="text"
        maxLength={100}
        required
        placeholder="Título da missão *"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid rgba(45,90,39,0.15)',
          fontSize: '15px',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.8)',
        }}
      />

      <textarea
        name="description"
        maxLength={500}
        rows={2}
        placeholder="Descrição (opcional)"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid rgba(45,90,39,0.15)',
          fontSize: '15px',
          resize: 'vertical',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.8)',
        }}
      />

      <select
        name="assignedChildId"
        required
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid rgba(45,90,39,0.15)',
          fontSize: '15px',
          background: 'rgba(255,255,255,0.8)',
          boxSizing: 'border-box',
        }}
      >
        <option value="">Selecionar filho *</option>
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.displayName}
          </option>
        ))}
      </select>

      <input
        name="kredsValue"
        type="number"
        min="1"
        step="1"
        required
        placeholder="Valor em Kreds *"
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '14px',
          border: '1px solid rgba(45,90,39,0.15)',
          fontSize: '15px',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.8)',
        }}
      />

      <button
        type="submit"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(to right, #2d5a27, #3b6934)',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(45,90,39,0.2)',
        }}
      >
        <span>🌱</span> Plantar Missão
      </button>
    </form>
  )
}
