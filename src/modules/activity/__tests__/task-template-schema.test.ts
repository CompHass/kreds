import { describe, it, expect } from 'vitest'
import { taskTemplateSchema } from '../../../lib/db/tasks/schema'

describe('taskTemplateSchema (ACT-01)', () => {
  it('accepts valid task template input with all fields', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Lavar louça',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 5,
      description: 'Todos os pratos depois do jantar',
    })
    expect(result.success).toBe(true)
  })

  it('accepts input with description omitted (optional field)', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Varrer o quarto',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects float kredsValue (D-07: integer-only)', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa',
      assignedChildId: crypto.randomUUID(),
      kredsValue: 5.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative kredsValue', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa',
      assignedChildId: crypto.randomUUID(),
      kredsValue: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero kredsValue (must be positive)', () => {
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

  it('rejects invalid assignedChildId (not a UUID)', () => {
    const result = taskTemplateSchema.safeParse({
      title: 'Tarefa',
      assignedChildId: 'nao-um-uuid',
      kredsValue: 5,
    })
    expect(result.success).toBe(false)
  })
})
