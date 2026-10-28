import { useMemo } from 'react'
import type { Transaction, TransactionType } from '@/domain/model'
import { isPending, isSettled } from '@/domain/model'
import { useLedger } from '../data/LedgerProvider'

export interface TransactionFilters {
  month: string
  type: 'all' | TransactionType
  status: 'all' | 'settled' | 'pending' | 'cancelled'
  query: string
}

function matches(txn: Transaction, f: TransactionFilters, categoryName: (id: string | null) => string): boolean {
  if (!txn.date.startsWith(f.month)) return false
  if (f.type !== 'all' && txn.type !== f.type) return false
  if (f.status === 'settled' && !isSettled(txn.status)) return false
  if (f.status === 'pending' && !isPending(txn.status)) return false
  if (f.status === 'cancelled' && txn.status !== 'cancelled') return false
  const q = f.query.trim().toLowerCase()
  if (!q) return true
  return [txn.description, txn.payee ?? '', txn.note ?? '', categoryName(txn.categoryId)].some((s) => s.toLowerCase().includes(q))
}

/** Opérations filtrées, groupées par jour (le plus récent d'abord). */
export function useFilteredTransactions(filters: TransactionFilters): { groups: [string, Transaction[]][]; count: number } {
  const { transactions, categories } = useLedger()
  return useMemo(() => {
    const name = (id: string | null) => categories.find((c) => c.id === id)?.name ?? ''
    const list = transactions.filter((t) => matches(t, filters, name)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    const groups = new Map<string, Transaction[]>()
    for (const txn of list) groups.set(txn.date, [...(groups.get(txn.date) ?? []), txn])
    return { groups: [...groups.entries()], count: list.length }
  }, [transactions, categories, filters])
}
