import type { Account, Transaction } from '@/domain/model'

let counter = 0
const stamp = '2026-10-01T00:00:00.000Z'

export function makeAccount(overrides: Partial<Account> = {}): Account {
  counter += 1
  return {
    id: `acc-${counter}`, createdAt: stamp, updatedAt: stamp, deletedAt: null, version: 1,
    name: 'Compte', kind: 'checking', currency: 'EUR', openingBalanceCents: 0, openingDate: '2026-10-01',
    includeInTotals: true, archived: false, origin: 'user_entered',
    ...overrides,
  }
}

export function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  counter += 1
  return {
    id: `txn-${counter}`, createdAt: stamp, updatedAt: stamp, deletedAt: null, version: 1,
    type: 'expense', amountCents: 1000, amountMinCents: null, currency: 'EUR', date: '2026-10-10', valueDate: null,
    dateEstimated: false, accountId: null, toAccountId: null, categoryId: null, description: '', status: 'paid',
    recurringRuleId: null, occurrenceKey: null, isBill: false, payee: null, debtId: null, goalId: null,
    confidence: null, scenario: null, source: null, invoiceRef: null, attachmentName: null, note: null,
    origin: 'user_entered',
    ...overrides,
  }
}
