import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getActiveTasksForFamily, getAllTasksForFamily } from '@/lib/db/tasks/queries'

export const dynamic = 'force-dynamic'

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

  // Fetch active children for the task template form select
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

  // D-07: toggle active/inactive view
  const params = searchParams ? await searchParams : undefined
  const showInactive = params?.showInactive === 'true'
  const tasks = showInactive
    ? await getAllTasksForFamily(familyId)
    : await getActiveTasksForFamily(familyId)

  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 64px',
      maxWidth: '560px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '24px',
            background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
            boxShadow: '0 8px 20px rgba(210,165,1,.2)',
            flexShrink: 0,
          }}>
            📋
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: 'var(--color-primary, #154212)',
              margin: 0,
            }}>
              Tarefas da semana
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Templates de responsabilidades
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/family/tasks/current"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-primary, #154212)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '99px',
              background: 'rgba(255,255,255,0.82)',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              fontWeight: 600,
            }}
          >
            Ciclo atual
          </Link>
          <Link
            href="/family/children"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '99px',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            }}
          >
            Filhos
          </Link>
        </div>
      </div>

      {/* Add task template form */}
      <div style={{
        background: 'var(--color-card, rgba(255,255,255,0.64))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
        backdropFilter: 'blur(12px)',
      }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
          margin: '0 0 16px',
        }}>
          Nova tarefa
        </p>

        {children.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-soft, #72796e)' }}>
            Cadastre um filho antes de criar tarefas.{' '}
            <Link href="/family/children" style={{ color: 'var(--color-primary, #154212)', fontWeight: 600 }}>
              Adicionar filho
            </Link>
          </p>
        ) : (
          <form
            id="add-task-form"
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            onSubmit={undefined}
          >
            <input type="hidden" name="_source" value="task-form" />

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary, #154212)', display: 'block', marginBottom: '6px' }}>
                Título *
              </label>
              <input
                type="text"
                name="title"
                required
                maxLength={100}
                placeholder="Ex: Arrumar a cama"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                  fontSize: '0.9375rem',
                  background: 'rgba(255,255,255,0.8)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary, #154212)', display: 'block', marginBottom: '6px' }}>
                Descrição (opcional)
              </label>
              <textarea
                name="description"
                maxLength={500}
                rows={2}
                placeholder="Detalhes da tarefa..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                  fontSize: '0.9375rem',
                  background: 'rgba(255,255,255,0.8)',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary, #154212)', display: 'block', marginBottom: '6px' }}>
                Filho *
              </label>
              <select
                name="assignedChildId"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                  fontSize: '0.9375rem',
                  background: 'rgba(255,255,255,0.8)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Selecione um filho...</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary, #154212)', display: 'block', marginBottom: '6px' }}>
                Valor em Kreds *
              </label>
              <input
                type="number"
                name="kredsValue"
                required
                min={1}
                step={1}
                placeholder="Ex: 5"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                  fontSize: '0.9375rem',
                  background: 'rgba(255,255,255,0.8)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              id="submit-task"
              style={{
                padding: '12px 24px',
                borderRadius: '99px',
                background: 'linear-gradient(135deg, #3b6934, #154212)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38)',
              }}
              onClick={undefined}
            >
              Adicionar tarefa
            </button>
          </form>
        )}
      </div>

      {/* Toggle active/inactive */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
          margin: 0,
        }}>
          {showInactive ? `Todas as tarefas (${tasks.length})` : `Tarefas ativas (${tasks.length})`}
        </p>
        {showInactive ? (
          <Link
            href="/family/tasks"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-soft, #72796e)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: '99px',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            }}
          >
            Ocultar inativas
          </Link>
        ) : (
          <Link
            href="/family/tasks?showInactive=true"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-soft, #72796e)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: '99px',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            }}
          >
            Mostrar inativas
          </Link>
        )}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-soft, #72796e)',
            margin: 0,
          }}>
            {showInactive
              ? 'Nenhuma tarefa cadastrada ainda. Crie a primeira tarefa acima!'
              : 'Nenhuma tarefa ativa. Crie uma nova tarefa ou ative uma existente.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: task.isActive
                  ? 'var(--color-card, rgba(255,255,255,0.64))'
                  : 'rgba(200,200,200,0.2)',
                border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(45,90,39,0.04)',
                opacity: task.isActive ? 1 : 0.6,
              }}
            >
              <div>
                <p style={{
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'var(--color-primary, #154212)',
                  margin: '0 0 2px',
                }}>
                  {task.title}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-soft, #72796e)',
                  margin: 0,
                }}>
                  {'childName' in task && task.childName ? `${task.childName} · ` : ''}{task.kredsValue} Kreds
                  {!task.isActive && ' · Inativa'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {task.isActive ? (
                  <form action={`/api/families/tasks/${task.id}`} method="POST">
                    <input type="hidden" name="_method" value="PATCH" />
                    <input type="hidden" name="action" value="deactivate" />
                    <button
                      type="submit"
                      style={{
                        fontSize: '0.75rem',
                        color: '#b91c1c',
                        background: 'rgba(220,38,38,0.08)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        borderRadius: '99px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Desativar
                    </button>
                  </form>
                ) : (
                  <form action={`/api/families/tasks/${task.id}`} method="POST">
                    <input type="hidden" name="_method" value="PATCH" />
                    <input type="hidden" name="action" value="reactivate" />
                    <button
                      type="submit"
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-success, #3b6934)',
                        background: 'rgba(59,105,52,0.08)',
                        border: '1px solid rgba(59,105,52,0.16)',
                        borderRadius: '99px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Reativar
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
