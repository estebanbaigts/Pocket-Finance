import type { Id, IsoDate, MonthKey, Transaction } from '../model'
import { isPending, isSettled } from '../model'

/** Exclut les éléments supprimés (suppression logique en attente de synchronisation). */
export function live<T extends { deletedAt: string | null }>(items: readonly T[]): T[] {
  return items.filter((item) => item.deletedAt === null)
}

export function inMonth(txn: Transaction, month: MonthKey): boolean {
  return txn.date.startsWith(month)
}

export function inRange(txn: Transaction, from: IsoDate, to: IsoDate): boolean {
  return txn.date >= from && txn.date <= to
}

/** Transactions vivantes, réglées ou en attente, pour un compte donné (source ou destination). */
export function touchesAccount(txn: Transaction, accountId: Id): boolean {
  return (txn.accountId === accountId || txn.toAccountId === accountId) && (isSettled(txn.status) || isPending(txn.status))
}
