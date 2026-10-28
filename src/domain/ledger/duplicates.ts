import type { Transaction } from '../model'
import { isPending, isSettled } from '../model'
import { diffDays } from '../dates'
import { live } from './filters'

const WINDOW_DAYS = 4

/**
 * Doublon probable : même type, même montant, même compte, dates proches, et l'une est une
 * échéance prévue tandis que l'autre est réglée (ex. facture prévue + dépense saisie à la main).
 */
export function isLikelyDuplicate(a: Transaction, b: Transaction): boolean {
  if (a.id === b.id || a.type !== b.type || a.amountCents !== b.amountCents) return false
  if (a.accountId !== b.accountId || a.status === 'cancelled' || b.status === 'cancelled') return false
  if (Math.abs(diffDays(a.date, b.date)) > WINDOW_DAYS) return false
  if (a.occurrenceKey !== null && b.occurrenceKey !== null) return false
  return (isPending(a.status) && isSettled(b.status)) || (isSettled(a.status) && isPending(b.status))
}

export interface DuplicatePair {
  pending: Transaction
  settled: Transaction
}

export function findDuplicatePairs(transactions: readonly Transaction[]): DuplicatePair[] {
  const items = live(transactions)
  const pairs: DuplicatePair[] = []
  const used = new Set<string>()
  for (const a of items) {
    if (!isPending(a.status) || used.has(a.id)) continue
    const match = items.find((b) => !used.has(b.id) && isLikelyDuplicate(a, b))
    if (!match) continue
    used.add(a.id).add(match.id)
    pairs.push({ pending: a, settled: match })
  }
  return pairs
}

/**
 * Rapprochement : l'opération réglée hérite du lien vers l'échéance (règle, dette, facture),
 * l'échéance prévue est supprimée. L'occurrence n'est ainsi comptée qu'une seule fois et le
 * moteur de récurrence ne la recréera pas (sa clé est portée par l'opération réglée).
 */
export function reconcile(pair: DuplicatePair): { keep: Transaction; removeId: string } {
  const { pending, settled } = pair
  const keep: Transaction = {
    ...settled,
    recurringRuleId: settled.recurringRuleId ?? pending.recurringRuleId,
    occurrenceKey: settled.occurrenceKey ?? pending.occurrenceKey,
    isBill: settled.isBill || pending.isBill,
    payee: settled.payee ?? pending.payee,
    debtId: settled.debtId ?? pending.debtId,
    goalId: settled.goalId ?? pending.goalId,
    categoryId: settled.categoryId ?? pending.categoryId,
  }
  return { keep, removeId: pending.id }
}
