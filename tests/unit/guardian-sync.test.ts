// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { extractSystemRoles } from '../../src/lib/zitadel/login-client'

describe('guardian auth role synchronization', () => {
  it('keeps only role keys from Zitadel grants and ignores malformed entries', () => {
    expect(extractSystemRoles([
      { roleKeys: ['system_owner'] },
      { roleKeys: ['report_reader', 42] },
      null,
      { projectId: 'project-without-roles' },
    ])).toEqual(['system_owner', 'report_reader'])
  })
})
