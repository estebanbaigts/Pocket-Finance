import { motion } from 'motion/react'
import { formatCents, formatPercent } from '@/domain/money'
import { transition } from '../motion'

export interface BarItem {
  key: string
  label: string
  cents: number
  color: string
  share: number
}

/** Barres horizontales lisibles sur iPhone ; chaque ligne affiche aussi montant et part en texte. */
export function BarList({ items, label }: { items: BarItem[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.cents))
  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink">{item.label}</span>
            <span className="num shrink-0 text-ink-2">{formatCents(item.cents)} <span className="text-ink-3">· {formatPercent(item.share)}</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="h-full origin-left rounded-full" style={{ background: item.color, width: '100%' }} initial={{ scaleX: 0 }} animate={{ scaleX: item.cents / max }} transition={transition.slow} />
          </div>
        </li>
      ))}
    </ul>
  )
}
