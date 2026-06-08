import { describe, it } from 'vitest'
// These imports will be resolved in Wave 1 when commands.ts is implemented
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { createTaskTemplate } from '../../commands'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { deactivateTaskTemplate } from '../../commands'

describe('createTaskTemplate (ACT-01)', () => {
  it.todo('creates a template and returns id when input is valid')
  it.todo('rejects assignedChildId from another family')
  it.todo('rejects kredsValue <= 0')
})

describe('deactivateTaskTemplate (ACT-03)', () => {
  it.todo('sets is_active=false and deactivated_at when template belongs to family')
  it.todo('does not affect templates from other families')
})
