import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { transition } from '../motion'

type Tone = 'positive' | 'warning' | 'danger' | 'neutral'

const fills: Record<Tone, string> = { positive: 'bg-positive', warning: 'bg-warning-fill', danger: 'bg-danger', neutral: 'bg-ink-2' }

/** Barre de progression animée par transformation (scaleX), avec valeur accessible. */
export function ProgressBar({ value, tone = 'positive', label, className }: { value: number; tone?: Tone; label: string; className?: string }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1))
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped * 100)} className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <motion.div className={cn('h-full w-full origin-left rounded-full', fills[tone])} initial={{ scaleX: 0 }} animate={{ scaleX: clamped }} transition={transition.slow} />
    </div>
  )
}
