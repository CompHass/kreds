import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const state = {
  balance: 0,
  goal: null as null | { id: string; allocatedAmount: number; targetAmount: number; status: string },
}

vi.mock('../../src/lib/db', () => {
  const db = {
    select() {
      return {
        from() {
          return {
            where: () => Promise.resolve([{ total: state.balance }]),
          }
        },
      }
    },
    transaction(fn: (tx: unknown) => unknown) {
      const tx = {
        select() {
          return {
            from() {
              return {
                where() {
                  return { limit: () => Promise.resolve(state.goal ? [state.goal] : []) }
                },
              }
            },
          }
        },
        insert() {
          return {
            values: () => ({
              returning: () => Promise.resolve([{ id: 'tx-1', commandId: 'cmd-1' }]),
            }),
          }
        },
        update() {
          return {
            set: (values: { allocatedAmount: number; status: string }) => ({
              where: () => {
                if (state.goal) {
                  state.goal.allocatedAmount = values.allocatedAmount
                  state.goal.status = values.status
                }
                return Promise.resolve()
              },
            }),
          }
        },
      }
      return fn(tx)
    },
  }
  return { db }
})

import { postGoalAllocation, postGoalDeallocation } from '../../src/modules/ledger/engine'

describe('postGoalAllocation', () => {
  it('rejects when amount exceeds available balance', async () => {
    state.balance = 10
    state.goal = { id: 'goal-1', allocatedAmount: 0, targetAmount: 50, status: 'active' }

    await expect(
      postGoalAllocation({
        commandId: '11111111-1111-4111-8111-111111111111',
        familyId: '22222222-2222-4222-8222-222222222222',
        childProfileId: '33333333-3333-4333-8333-333333333333',
        goalId: 'goal-1',
        amount: 20,
      }),
    ).rejects.toThrow('Insufficient balance')
  })

  it('rejects when the goal is not found/active', async () => {
    state.balance = 100
    state.goal = null

    await expect(
      postGoalAllocation({
        commandId: '11111111-1111-4111-8111-111111111111',
        familyId: '22222222-2222-4222-8222-222222222222',
        childProfileId: '33333333-3333-4333-8333-333333333333',
        goalId: 'missing-goal',
        amount: 20,
      }),
    ).rejects.toThrow('Goal not found or not active')
  })

  it('posts the allocation and returns the transaction header', async () => {
    state.balance = 100
    state.goal = { id: 'goal-1', allocatedAmount: 0, targetAmount: 50, status: 'active' }

    const result = await postGoalAllocation({
      commandId: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      childProfileId: '33333333-3333-4333-8333-333333333333',
      goalId: 'goal-1',
      amount: 20,
    })

    expect(result).toEqual({ id: 'tx-1', commandId: 'cmd-1' })
    expect(state.goal.allocatedAmount).toBe(20)
  })

  it('flips the goal to achieved when the target is reached', async () => {
    state.balance = 100
    state.goal = { id: 'goal-1', allocatedAmount: 30, targetAmount: 50, status: 'active' }

    await postGoalAllocation({
      commandId: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      childProfileId: '33333333-3333-4333-8333-333333333333',
      goalId: 'goal-1',
      amount: 20,
    })

    expect(state.goal.allocatedAmount).toBe(50)
    expect(state.goal.status).toBe('achieved')
  })
})

describe('postGoalDeallocation', () => {
  it('rejects when amount exceeds the allocated amount', async () => {
    state.goal = { id: 'goal-1', allocatedAmount: 10, targetAmount: 50, status: 'active' }

    await expect(
      postGoalDeallocation({
        commandId: '11111111-1111-4111-8111-111111111111',
        familyId: '22222222-2222-4222-8222-222222222222',
        childProfileId: '33333333-3333-4333-8333-333333333333',
        goalId: 'goal-1',
        amount: 20,
      }),
    ).rejects.toThrow('Insufficient goal balance')
  })

  it('rejects when the goal does not exist', async () => {
    state.goal = null

    await expect(
      postGoalDeallocation({
        commandId: '11111111-1111-4111-8111-111111111111',
        familyId: '22222222-2222-4222-8222-222222222222',
        childProfileId: '33333333-3333-4333-8333-333333333333',
        goalId: 'missing-goal',
        amount: 5,
      }),
    ).rejects.toThrow('Goal not found')
  })

  it('credits back the goal balance and un-achieves it if it drops below target', async () => {
    state.goal = { id: 'goal-1', allocatedAmount: 50, targetAmount: 50, status: 'achieved' }

    const result = await postGoalDeallocation({
      commandId: '11111111-1111-4111-8111-111111111111',
      familyId: '22222222-2222-4222-8222-222222222222',
      childProfileId: '33333333-3333-4333-8333-333333333333',
      goalId: 'goal-1',
      amount: 10,
    })

    expect(result).toEqual({ id: 'tx-1', commandId: 'cmd-1' })
    expect(state.goal.allocatedAmount).toBe(40)
    expect(state.goal.status).toBe('active')
  })
})
