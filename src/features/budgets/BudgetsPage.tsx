import { useMemo, useState } from 'react'
import { categorySpent, monthBudgetSummary, type BudgetLine } from '@/domain/budgets'
import { addMonthKey, formatMonthFr, monthKey } from '@/domain/dates'
import { formatPercent } from '@/domain/money'
import { Amount, MonthSwitcher, PageHeader, Panel, ProgressBar, Sheet } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { useToday } from '../data/useToday'
import { BudgetEditor } from './BudgetEditor'
import { BudgetRow } from './BudgetRow'

export default function BudgetsPage() {
  const today = useToday()
  const { categories, budgets, transactions } = useLedger()
  const [month, setMonth] = useState(monthKey(today))
  const [editing, setEditing] = useState<BudgetLine | null>(null)
  const summary = useMemo(() => monthBudgetSummary(categories, budgets, transactions, month), [categories, budgets, transactions, month])
  const previous = addMonthKey(month, -1)
  const lines = [...summary.lines].sort((a, b) => Number(b.budget !== null) - Number(a.budget !== null) || b.spentCents - a.spentCents)
  const tone = summary.over.length ? 'danger' : summary.near.length ? 'warning' : 'positive'

  return (
    <>
      <PageHeader title="Budgets" subtitle="Un budget par catégorie, modifiable à partir de n’importe quel mois. L’épargne n’est pas une dépense : elle se suit dans « Épargne »."
        actions={<MonthSwitcher month={month} onChange={setMonth} />} />
      <Panel className="mb-4">
        <div className="grid grid-cols-2 gap-4 min-[640px]:grid-cols-4">
          <div><p className="text-[12px] text-ink-3">Budget total</p><Amount cents={summary.totalCents} animated className="text-[22px] font-semibold" /></div>
          <div><p className="text-[12px] text-ink-3">Consommé</p><Amount cents={summary.spentCents} animated className="text-[22px] font-semibold" /></div>
          <div><p className="text-[12px] text-ink-3">Restant</p><Amount cents={summary.remainingCents} tone="auto" animated className="text-[22px] font-semibold" /></div>
          <div><p className="text-[12px] text-ink-3">Utilisé</p><p className="num text-[22px] font-semibold">{formatPercent(summary.ratio)}</p></div>
        </div>
        {summary.totalCents > 0 && <ProgressBar className="mt-4" value={summary.ratio} tone={tone} label={`Budget de ${formatMonthFr(month)} consommé`} />}
      </Panel>
      <Panel title="Par catégorie" eyebrow="Touche une catégorie pour définir ou modifier son budget">
        <ul className="divide-y divide-[var(--border)]">
          {lines.map((line) => <BudgetRow key={line.category.id} line={line} previousSpent={categorySpent(transactions, line.category.id, previous)} onEdit={() => setEditing(line)} />)}
        </ul>
      </Panel>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Budget · ${editing.category.name}` : ''}>
        {editing && <BudgetEditor key={editing.category.id + month} line={editing} month={month} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  )
}
