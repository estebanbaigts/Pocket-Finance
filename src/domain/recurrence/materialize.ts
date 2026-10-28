import type { IsoDate, RecurringRule, Transaction } from '../model'
import { occurrenceKey, occurrencesBetween } from './schedule'

export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'version'>

/** Une règle n'est projetée que si elle est active, non supprimée et que son calendrier est connu. */
export function isSchedulable(rule: RecurringRule): boolean {
  return rule.active && rule.deletedAt === null && rule.startDate !== null
}

export function draftFromRule(rule: RecurringRule, date: IsoDate): TransactionDraft {
  return {
    type: rule.type, amountCents: rule.amountCents, amountMinCents: rule.amountMinCents, currency: 'EUR',
    date, valueDate: null, dateEstimated: rule.dayUnknown, accountId: rule.accountId, toAccountId: rule.toAccountId,
    categoryId: rule.categoryId, description: rule.label, status: 'planned', recurringRuleId: rule.id,
    occurrenceKey: occurrenceKey(rule.id, date), isBill: rule.kind === 'bill' || rule.kind === 'subscription',
    payee: rule.payee, debtId: rule.debtId, goalId: rule.goalId, confidence: rule.confidence, scenario: rule.scenario,
    source: rule.kind === 'income' ? rule.payee : null, invoiceRef: null, attachmentName: null, note: null,
    origin: rule.origin,
  }
}

/**
 * Occurrences à créer pour couvrir [from, to]. Idempotent : une occurrence déjà présente
 * (y compris supprimée ou rapprochée avec une autre opération) n'est jamais recréée.
 */
export function planOccurrences(rule: RecurringRule, existing: readonly Transaction[], from: IsoDate, to: IsoDate): TransactionDraft[] {
  if (!isSchedulable(rule)) return []
  const known = new Set(existing.map((txn) => txn.occurrenceKey).filter((key): key is string => key !== null))
  return occurrencesBetween(rule, from, to)
    .filter(({ date }) => !known.has(occurrenceKey(rule.id, date)))
    .map(({ date }) => draftFromRule(rule, date))
}

/** Échéance dépassée : la date est passée mais le statut n'a pas été actualisé. On ne conclut pas à un impayé. */
export function needsStatusUpdate(txn: Transaction, today: IsoDate): boolean {
  return txn.deletedAt === null && (txn.status === 'planned' || txn.status === 'confirmed') && txn.date < today
}
