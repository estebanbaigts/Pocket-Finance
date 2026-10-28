import { describe, expect, it } from 'vitest'
import { allowedStatuses, canTransition, isPending, isSettled } from '@/domain/model'

describe('statuts des transactions', () => {
  it('limite les statuts au type d’opération', () => {
    expect(allowedStatuses('income')).not.toContain('paid')
    expect(allowedStatuses('expense')).not.toContain('received')
    expect(canTransition('expense', 'planned', 'received')).toBe(false)
  })

  it('autorise les transitions documentées', () => {
    expect(canTransition('income', 'planned', 'received')).toBe(true)
    expect(canTransition('expense', 'cancelled', 'paid')).toBe(false)
    expect(canTransition('expense', 'cancelled', 'planned')).toBe(true)
  })

  it('distingue réglé et en attente', () => {
    expect(isSettled('paid')).toBe(true)
    expect(isSettled('confirmed')).toBe(false)
    expect(isPending('planned')).toBe(true)
    expect(isPending('cancelled')).toBe(false)
  })
})
