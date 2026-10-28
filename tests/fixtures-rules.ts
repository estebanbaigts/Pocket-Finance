import type { RecurringRule } from '@/domain/model'

export function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1', createdAt: 'x', updatedAt: 'x', deletedAt: null, version: 1,
    kind: 'bill', type: 'expense', label: 'Loyer', payee: 'Propriétaire', amountCents: 90_000, amountMinCents: null,
    accountId: 'acc', toAccountId: null, categoryId: 'housing', frequency: 'monthly', interval: 1,
    startDate: '2026-10-05', dayUnknown: false, endDate: null, occurrenceCount: null, fixed: true,
    debtId: null, goalId: null, confidence: null, scenario: null, active: true, note: null, origin: 'user_declared',
    ...overrides,
  }
}
