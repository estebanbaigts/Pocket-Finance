import { AlertTriangle, Info, OctagonAlert } from 'lucide-react'
import { useState } from 'react'
import type { Insight } from '@/domain/insights'
import { cn } from '@/lib/cn'

const ICON = { action: OctagonAlert, warning: AlertTriangle, info: Info }
const TONE = { action: 'text-danger', warning: 'text-warning', info: 'text-info' }
const LABEL = { action: 'Action', warning: 'Vigilance', info: 'Information' }

/** Constat dépliable : le titre résume, les justificatifs montrent les données et hypothèses utilisées. */
export function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false)
  const Icon = ICON[insight.tone]
  return (
    <li className="border-b border-line py-3 last:border-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <Icon size={17} aria-hidden className={cn('mt-0.5 shrink-0', TONE[insight.tone])} />
        <span className="flex-1">
          <span className="sr-only">{LABEL[insight.tone]} : </span>
          <span className="text-[14px] text-ink">{insight.title}</span>
          <span className="mt-0.5 block text-[12px] text-ink-3">{open ? 'Masquer le détail' : 'Voir sur quoi repose ce constat'}</span>
        </span>
      </button>
      {open && (
        <ul className="ml-8 mt-2 list-disc space-y-1 pl-4 text-[13px] text-ink-2">
          {insight.evidence.map((line) => <li key={line}>{line}</li>)}
        </ul>
      )}
    </li>
  )
}
