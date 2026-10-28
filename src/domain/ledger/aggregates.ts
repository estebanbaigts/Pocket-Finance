import type { MonthKey, Transaction } from '../model'
import { isPending, isSettled } from '../model'
import { inMonth, live } from './filters'

function sumWhere(transactions: readonly Transaction[], month: MonthKey, keep: (txn: Transaction) => boolean): number {
  return live(transactions)
    .filter((txn) => inMonth(txn, month) && keep(txn))
    .reduce((sum, txn) => sum + txn.amountCents, 0)
}

/** Revenus réellement encaissés. Les transferts n'en font jamais partie. */
export function incomeReceived(transactions: readonly Transaction[], month: MonthKey): number {
  return sumWhere(transactions, month, (txn) => txn.type === 'income' && isSettled(txn.status))
}

/** Dépenses réellement payées (hors transferts, donc hors épargne). */
export function expensesPaid(transactions: readonly Transaction[], month: MonthKey): number {
  return sumWhere(transactions, month, (txn) => txn.type === 'expense' && isSettled(txn.status))
}

/** Revenus encore attendus sur le mois : jamais considérés comme disponibles. */
export function incomeExpected(transactions: readonly Transaction[], month: MonthKey): number {
  return sumWhere(transactions, month, (txn) => txn.type === 'income' && isPending(txn.status))
}

/** Factures et dépenses prévues restant à payer sur le mois. */
export function expensesDue(transactions: readonly Transaction[], month: MonthKey): number {
  return sumWhere(transactions, month, (txn) => txn.type === 'expense' && isPending(txn.status))
}
