import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonthKey, formatMonthFr } from '@/domain/dates'

/** Navigation entre mois (comparaisons, historique). */
export function MonthSwitcher({ month, onChange, max }: { month: string; onChange: (m: string) => void; max?: string }) {
  const label = formatMonthFr(month)
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-line bg-surface">
      <button type="button" aria-label="Mois précédent" onClick={() => onChange(addMonthKey(month, -1))} className="p-2 text-ink-2 hover:text-ink"><ChevronLeft size={16} /></button>
      <span aria-live="polite" className="min-w-[124px] text-center text-[13px] font-medium capitalize text-ink">{label}</span>
      <button type="button" aria-label="Mois suivant" disabled={max !== undefined && month >= max} onClick={() => onChange(addMonthKey(month, 1))} className="p-2 text-ink-2 hover:text-ink disabled:opacity-30"><ChevronRight size={16} /></button>
    </div>
  )
}
