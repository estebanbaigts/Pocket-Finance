import { Pencil } from 'lucide-react'
import type { SavingsGoal } from '@/domain/model'
import { goalProgress } from '@/domain/savings'
import { formatDateFr } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { Amount, Badge, Button, ProgressBar } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { GOAL_KIND_LABEL } from './GoalForm'

export function GoalCard({ goal, today, onEdit, onContribute }: { goal: SavingsGoal; today: string; onEdit: () => void; onContribute: () => void }) {
  const { transactions } = useLedger()
  const p = goalProgress(goal, transactions, today)
  return (
    <article className="rounded-lg border border-line bg-surface p-5">
      <header className="flex items-start gap-2">
        <div className="flex-1">
          <p className="eyebrow">{GOAL_KIND_LABEL[goal.kind]} · priorité {['haute', 'normale', 'basse'][goal.priority - 1]}</p>
          <h3 className="text-[16px] font-semibold text-ink">{goal.name}</h3>
        </div>
        <button type="button" aria-label={`Modifier ${goal.name}`} onClick={onEdit} className="rounded-md p-2 text-ink-3 hover:bg-surface-2"><Pencil size={15} /></button>
      </header>
      <div className="mt-3 flex items-baseline gap-2">
        <Amount cents={p.currentCents} animated tone="positive" className="text-[24px] font-semibold" />
        <span className="text-[13px] text-ink-3">sur {formatCents(goal.targetCents)}</span>
      </div>
      <ProgressBar className="mt-3" value={p.ratio} label={`${goal.name} : progression`} />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
        {p.remainingCents === 0 ? <Badge tone="positive">Objectif atteint</Badge> : (
          <>
            {p.monthlyNeededCents !== null && <span>{formatCents(p.monthlyNeededCents)}/mois nécessaires{goal.deadline && ` jusqu’au ${formatDateFr(goal.deadline)}`}</span>}
            {p.onTrack === true && <Badge tone="positive">Contribution prévue suffisante</Badge>}
            {p.onTrack === false && <Badge tone="warning">Contribution prévue insuffisante</Badge>}
            {p.monthsLeft === null && <span>Sans échéance</span>}
          </>
        )}
      </div>
      <Button size="sm" className="mt-4" onClick={onContribute}>Mettre de côté</Button>
    </article>
  )
}
