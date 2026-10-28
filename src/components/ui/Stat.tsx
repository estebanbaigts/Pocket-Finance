import type { ReactNode } from 'react'
import { Amount } from './Amount'
import { cn } from '@/lib/cn'

interface StatProps {
  label: string
  cents: number | null
  hint?: ReactNode
  tone?: 'neutral' | 'positive' | 'danger' | 'warning' | 'muted' | 'auto'
  badge?: ReactNode
  className?: string
}

/** Chiffre clé : libellé, montant tabulaire animé, précision sur sa nature (encaissé, estimé…). */
export function Stat({ label, cents, hint, tone = 'neutral', badge, className }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-[13px] text-ink-2">{label}</p>
        {badge}
      </div>
      <Amount cents={cents} tone={tone} animated className="text-[20px] font-semibold leading-tight min-[640px]:text-[22px]" />
      {hint && <p className="text-[12px] text-ink-3">{hint}</p>}
    </div>
  )
}
