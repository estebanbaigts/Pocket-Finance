import { motion } from 'motion/react'
import { formatMonthFr } from '@/domain/dates'
import { formatCentsRounded } from '@/domain/money'
import { transition } from '../motion'

export interface MonthColumn {
  month: string
  incomeCents: number
  expenseCents: number
}

/** Colonnes revenus/dépenses par mois ; un tableau textuel équivalent est affiché à côté par l'écran. */
export function MonthColumns({ data }: { data: MonthColumn[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.incomeCents, d.expenseCents]))
  return (
    <div aria-hidden="true" className="flex h-40 items-end gap-3">
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-32 w-full items-end justify-center gap-1">
            {[{ v: d.incomeCents, c: 'var(--positive)' }, { v: d.expenseCents, c: 'var(--ink-3)' }].map((bar, i) => (
              <motion.div key={i} title={formatCentsRounded(bar.v)} className="w-1/3 max-w-[18px] origin-bottom rounded-t-sm" style={{ background: bar.c, height: `${(bar.v / max) * 100}%` }}
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={transition.slow} />
            ))}
          </div>
          <span className="text-[11px] capitalize text-ink-3">{formatMonthFr(d.month, false)}</span>
        </div>
      ))}
    </div>
  )
}
