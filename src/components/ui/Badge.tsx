import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

/** Pastille : toujours un libellé texte (et éventuellement une icône), jamais la couleur seule. */
export function Badge({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[12px] font-medium leading-4 whitespace-nowrap', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}
