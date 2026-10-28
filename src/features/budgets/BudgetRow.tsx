import { Badge, ProgressBar } from '@/components/ui'
import type { BudgetLine } from '@/domain/budgets'
import { formatCents, formatPercent } from '@/domain/money'
import { toneVar } from '../data/lookups'

const STATE = {
  over: { tone: 'danger', label: 'Dépassé' },
  near: { tone: 'warning', label: 'Proche de la limite' },
  ok: { tone: 'positive', label: 'Dans le budget' },
  none: { tone: 'neutral', label: 'Sans budget' },
} as const

export function BudgetRow({ line, previousSpent, onEdit }: { line: BudgetLine; previousSpent: number; onEdit: () => void }) {
  const state = STATE[line.state]
  const delta = line.spentCents - previousSpent
  return (
    <li>
      <button type="button" onClick={onEdit} className="w-full py-3.5 text-left">
        <div className="mb-2 flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: toneVar(line.category.tone) }} />
          <span className="flex-1 text-[14px] font-medium text-ink">{line.category.name}</span>
          <Badge tone={state.tone}>{state.label}</Badge>
        </div>
        {line.budget ? <ProgressBar value={line.ratio} tone={state.tone === 'neutral' ? 'neutral' : state.tone} label={`${line.category.name} : ${formatPercent(Math.min(line.ratio, 9.99))} consommés`} /> : null}
        <div className="mt-1.5 flex flex-wrap justify-between gap-x-4 text-[12px] text-ink-3">
          <span className="num">
            {formatCents(line.spentCents)} payés{line.budget ? ` sur ${formatCents(line.availableCents)}` : ''}
            {line.rolloverCents > 0 && ` (dont ${formatCents(line.rolloverCents)} reportés)`}
            {line.committedCents > 0 && ` · ${formatCents(line.committedCents)} prévus`}
          </span>
          <span className="num">
            {line.budget && (line.remainingCents >= 0 ? `reste ${formatCents(line.remainingCents)}` : `dépassement ${formatCents(-line.remainingCents)}`)}
            {previousSpent > 0 && ` · ${delta >= 0 ? '+' : '−'}${formatCents(Math.abs(delta))} vs mois précédent`}
          </span>
        </div>
      </button>
    </li>
  )
}
