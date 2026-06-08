import { describe, it, expect } from 'vitest'
import { taskTemplateSchema } from '../../../lib/db/tasks/schema'

describe('taskTemplateSchema (ACT-01)', () => {
  it('accepts valid complete input', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Lavar louça',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 5,
      description: 'Todos os pratos',
    })
    expect(result.success).toBe(true)
  })

  it('accepts input without description (optional field)', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Varrer',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects kredsValue float (5.5)', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 5.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects kredsValue negative (-1)', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa',
      assignedChildId: crypto.randomUUID(),
      kredsValue: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects kredsValue zero', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = taskTemplateSchema.safeParse({
      title: '',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID for assignedChildId', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa válida',
      assignedChildId: 'nao-um-uuid',
      kredsValue: 5,
    })
    expect(result.success).toBe(false)
  })
})
