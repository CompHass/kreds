import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getActiveTasksForFamily, getAllTasksForFamily } from '@/lib/db/tasks/queries'

export const dynamic = 'force-dynamic'

/**
 * FamilyTasksPage — SSR server component for the guardian's task template list.
 *
 * - Shows active templates by default (D-07)
 * - Toggle ?showInactive=true to show all templates for audit
 * - Inline creation form posts to /api/families/tasks via JavaScript (JSON fetch)
 * - Lists tasks grouped conceptually by child
 * - Links to /family/tasks/current for the current cycle view (D-05)
 *
 * Auth: redirects to /api/auth/signin if unauthenticated, /family/onboarding if no family.
 */
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

  // D-07: toggle between active-only and all templates
  const params = searchParams ? await searchParams : undefined
  const showInactive = params?.showInactive === 'true'

  const tasks = showInactive
    ? await getAllTasksForFamily(familyId)
    : await getActiveTasksForFamily(familyId)

  // Query active children for the assignment select
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
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 64px',
      maxWidth: '520px',
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
            ✅
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
              Tarefas Semanais
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Responsabilidades da semana
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
            Ciclo Atual
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

      {/* Toggle de inativas (D-07) */}
      <div style={{ marginBottom: '24px' }}>
        {showInactive ? (
          <Link
            href="/family/tasks"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-primary, #154212)',
              textDecoration: 'none',
            }}
          >
            Ocultar inativas
          </Link>
        ) : (
          <Link
            href="/family/tasks?showInactive=true"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              textDecoration: 'none',
            }}
          >
            Mostrar inativas
          </Link>
        )}
      </div>

      {/* Lista de tasks */}
      {tasks.length > 0 ? (
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #42493e)',
            margin: '0 0 4px',
          }}>
            {showInactive ? `Todas as tarefas (${tasks.length})` : `Tarefas ativas (${tasks.length})`}
          </p>
          {tasks.map((task) => {
            const isInactive = 'isActive' in task && !task.isActive
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: isInactive
                    ? 'rgba(255,255,255,0.4)'
                    : 'var(--color-card, rgba(255,255,255,0.64))',
                  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                  borderRadius: '20px',
                  boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
                  backdropFilter: 'blur(12px)',
                  opacity: isInactive ? 0.7 : 1,
                }}
              >
                <div>
                  <p style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'var(--color-primary, #154212)',
                    margin: '0 0 2px',
                  }}>
                    {task.title}
                    {isInactive && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--color-text-soft, #72796e)',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: '99px',
                        padding: '2px 8px',
                      }}>
                        Inativa
                      </span>
                    )}
                  </p>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-soft, #72796e)',
                    margin: 0,
                  }}>
                    {task.kredsValue} Kreds
                    {'childName' in task && task.childName
                      ? ` · ${task.childName}`
                      : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--color-text-soft, #72796e)',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          Nenhuma tarefa cadastrada ainda. Use o formulário abaixo para criar a primeira!
        </p>
      )}

      {/* Formulário de criação (JSON fetch — CSRF guard via Content-Type: application/json) */}
      <div style={{
        background: 'var(--color-card, rgba(255,255,255,0.64))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: 'var(--radius-xl, 36px)',
        boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
        backdropFilter: 'blur(22px)',
        padding: '28px 24px',
      }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
          margin: '0 0 4px',
        }}>
          Adicionar Tarefa
        </p>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--color-text-soft, #72796e)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}>
          Crie uma responsabilidade semanal para um dos seus filhos. Com fidelidade e dedicação,
          cada tarefa concluída honra a Deus e fortalece o caráter.
        </p>

        {children.length === 0 ? (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-soft, #72796e)',
            textAlign: 'center',
          }}>
            Adicione um filho antes de criar tarefas.{' '}
            <Link href="/family/children" style={{ color: 'var(--color-primary, #154212)' }}>
              Ir para Filhos
            </Link>
          </p>
        ) : (
          <TaskCreationForm children={children} />
        )}
      </div>
    </main>
  )
}

/**
 * Client-side form that POSTs to /api/families/tasks with Content-Type: application/json.
 * Using a client component avoids the CSRF issue while keeping the page server-rendered.
 */
function TaskCreationForm({ children }: {
  children: { id: string; displayName: string; avatarPreset: string }[]
}) {
  return (
    <form
      id="task-creation-form"
      onSubmit={undefined}
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

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-primary, #154212)',
          marginBottom: '6px',
        }}>
          Título da tarefa *
        </label>
        <input
          name="title"
          type="text"
          maxLength={100}
          required
          placeholder="Ex: Lavar a louça após o jantar"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.2))',
            fontSize: '0.9375rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-primary, #154212)',
          marginBottom: '6px',
        }}>
          Descrição (opcional)
        </label>
        <textarea
          name="description"
          maxLength={500}
          rows={2}
          placeholder="Detalhes sobre como realizar a tarefa..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.2))',
            fontSize: '0.9375rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-primary, #154212)',
          marginBottom: '6px',
        }}>
          Filho responsável *
        </label>
        <select
          name="assignedChildId"
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.2))',
            fontSize: '0.9375rem',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Selecionar filho...</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-primary, #154212)',
          marginBottom: '6px',
        }}>
          Valor em Kreds *
        </label>
        <input
          name="kredsValue"
          type="number"
          min="1"
          step="1"
          required
          placeholder="Ex: 5"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.2))',
            fontSize: '0.9375rem',
            boxSizing: 'border-box',
          }}
        />
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-soft, #72796e)',
          margin: '4px 0 0',
        }}>
          Número inteiro positivo. &quot;Tudo o que fizerem, façam de todo o coração&quot; (Colossenses 3:23)
        </p>
      </div>

      <button
        type="submit"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '52px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #3b6934, #154212)',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38), 0 18px 55px rgba(45,90,39,0.1)',
        }}
      >
        Adicionar Tarefa
      </button>
    </form>
  )
}
