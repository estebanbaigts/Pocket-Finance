import { Search } from 'lucide-react'
import { MonthSwitcher, Segmented, Select } from '@/components/ui'
import type { TransactionFilters } from './useFilteredTransactions'

export function TransactionFiltersBar({ filters, onChange }: { filters: TransactionFilters; onChange: (f: TransactionFilters) => void }) {
  const set = (patch: Partial<TransactionFilters>) => onChange({ ...filters, ...patch })
  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <MonthSwitcher month={filters.month} onChange={(month) => set({ month })} />
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Rechercher</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input type="search" value={filters.query} onChange={(e) => set({ query: e.target.value })} placeholder="Rechercher une opération" className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-[14px] placeholder:text-ink-3 focus:border-ink-2 focus:outline-none" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Type" value={filters.type} onChange={(type) => set({ type })}
          options={[{ value: 'all', label: 'Tout' }, { value: 'expense', label: 'Dépenses' }, { value: 'income', label: 'Revenus' }, { value: 'transfer', label: 'Transferts' }]} />
        <Select aria-label="Statut" value={filters.status} onChange={(e) => set({ status: e.target.value as TransactionFilters['status'] })} className="!h-9 w-auto text-[13px]">
          <option value="all">Tous les statuts</option><option value="settled">Payés / encaissés</option><option value="pending">Prévus / confirmés</option><option value="cancelled">Annulés</option>
        </Select>
      </div>
    </div>
  )
}
