import type { Transaction, TransactionType } from '@/domain/model'
import type { Draft } from '@/services/storage'

/** Opération vierge avec des valeurs par défaut sûres : non récurrente, saisie par l'utilisateur. */
export function blankTransaction(type: TransactionType, date: string): Draft<'transactions'> {
  return {
    type, amountCents: 0, amountMinCents: null, currency: 'EUR', date, valueDate: null, dateEstimated: false,
    accountId: null, toAccountId: null, categoryId: null, description: '', status: type === 'income' ? 'received' : 'paid',
    recurringRuleId: null, occurrenceKey: null, isBill: false, payee: null, debtId: null, goalId: null,
    confidence: null, scenario: null, source: null, invoiceRef: null, attachmentName: null, note: null, origin: 'user_entered',
  }
}

export function toDraft(txn: Transaction): Draft<'transactions'> {
  const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, version: _v, ...draft } = txn
  return draft
}
