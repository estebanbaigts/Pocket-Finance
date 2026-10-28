import { useMemo, useState } from 'react'
import { debtShare, fixedVsVariable, monthlyTotals, spendingByCategory } from '@/domain/analysis'
import { addMonthKey, formatMonthFr, monthKey } from '@/domain/dates'
import { formatCents, formatPercent } from '@/domain/money'
import { BarList, MonthColumns } from '@/components/charts'
import { EmptyState, MonthSwitcher, PageHeader, Panel, Stat } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { useFinancials } from '../data/useFinancials'
import { toneVar } from '../data/lookups'
import { InsightCard } from '../insights/InsightCard'
import { useInsights } from '../insights/useInsights'

export default function AnalysisPage() {
  const f = useFinancials()
  const insights = useInsights(f)
  const { transactions, categories, accounts } = useLedger()
  const [month, setMonth] = useState(monthKey(f.today))
  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => addMonthKey(month, i - 5)), [month])
  const totals = useMemo(() => monthlyTotals(transactions, accounts, months), [transactions, accounts, months])
  const byCategory = useMemo(() => spendingByCategory(transactions, categories, month), [transactions, categories, month])
  const split = fixedVsVariable(transactions, categories, month)
  const debt = debtShare(transactions, month)
  const current = totals.at(-1)
  const previous = totals.at(-2)
  const hasHistory = totals.some((t) => t.expenseCents > 0 || t.incomeCents > 0)

  return (
    <>
      <PageHeader title="Analyses" subtitle="Constats calculés à partir de tes opérations réelles, avec leurs justificatifs. Aucune IA n’est utilisée pour les chiffres." actions={<MonthSwitcher month={month} onChange={setMonth} />} />
      {!hasHistory ? (
        <Panel><EmptyState title="Pas encore d’historique">Les analyses apparaîtront dès que tu auras enregistré des dépenses ou des revenus réglés.</EmptyState></Panel>
      ) : (
        <div className="grid gap-4 min-[900px]:grid-cols-2">
          <Panel title="Six derniers mois" eyebrow="Revenus encaissés et dépenses payées" className="min-[900px]:col-span-2">
            <div className="mb-3 flex gap-4 text-[12px] text-ink-2"><span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-positive" />Revenus</span><span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-ink-3" />Dépenses</span></div>
            <MonthColumns data={totals} />
            <table className="mt-4 w-full text-[12px]">
              <caption className="sr-only">Revenus, dépenses et épargne par mois</caption>
              <thead><tr className="text-left text-ink-3"><th className="py-1 font-medium">Mois</th><th className="py-1 text-right font-medium">Revenus</th><th className="py-1 text-right font-medium">Dépenses</th><th className="py-1 text-right font-medium">Épargne nette</th></tr></thead>
              <tbody>{totals.map((t) => <tr key={t.month} className="border-t border-line"><td className="py-1 capitalize">{formatMonthFr(t.month)}</td><td className="num py-1 text-right">{formatCents(t.incomeCents)}</td><td className="num py-1 text-right">{formatCents(t.expenseCents)}</td><td className="num py-1 text-right">{formatCents(t.savedCents)}</td></tr>)}</tbody>
            </table>
          </Panel>
          <Panel title="Où part ton argent" eyebrow={formatMonthFr(month)}>
            {byCategory.length === 0 ? <p className="text-[13px] text-ink-3">Aucune dépense payée ce mois.</p> : (
              <BarList label="Dépenses par catégorie" items={byCategory.map((c) => ({ key: c.category?.id ?? 'none', label: c.category?.name ?? 'Sans catégorie', cents: c.cents, share: c.share, color: toneVar(c.category?.tone) }))} />
            )}
          </Panel>
          <Panel title="Structure des dépenses" eyebrow={formatMonthFr(month)}>
            <div className="grid grid-cols-2 gap-5">
              <Stat label="Fixes" cents={split.fixedCents} hint="Loyer, crédits, abonnements, factures" />
              <Stat label="Variables" cents={split.variableCents} hint="Courses, loisirs, achats…" />
              <Stat label="Remboursements de dettes" cents={debt.debtCents} hint={`${formatPercent(debt.share)} des sorties`} />
              <Stat label="Variation vs mois précédent" cents={current && previous ? current.expenseCents - previous.expenseCents : null} tone="auto" hint="Dépenses payées" />
            </div>
          </Panel>
          <Panel title="Constats" eyebrow="Explicables" className="min-[900px]:col-span-2">
            {insights.length === 0 ? <p className="text-[13px] text-ink-3">Rien à signaler pour le moment.</p> : <ul>{insights.map((i) => <InsightCard key={i.id} insight={i} />)}</ul>}
          </Panel>
        </div>
      )}
    </>
  )
}
