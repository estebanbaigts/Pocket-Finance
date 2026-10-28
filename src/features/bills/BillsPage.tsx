import { CalendarCheck, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isPending } from '@/domain/model'
import { addMonthKey, monthEnd, monthKey } from '@/domain/dates'
import { needsStatusUpdate } from '@/domain/recurrence'
import { Amount, Button, EmptyState, PageHeader, Panel, Segmented, Sheet, useToast } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { useToday } from '../data/useToday'
import { EditTransactionSheet } from '../transactions/EditTransactionSheet'
import { TransactionRow } from '../transactions/TransactionRow'
import { useTransactionActions } from '../transactions/useTransactionActions'
import { RuleForm } from './RuleForm'
import { RuleList } from './RuleList'
import { blankRule } from './ruleSchema'

export default function BillsPage() {
  const today = useToday()
  const toast = useToast()
  const { transactions, rules } = useLedger()
  const actions = useTransactionActions()
  const [direction, setDirection] = useState<'out' | 'in'>('out')
  const [adding, setAdding] = useState(false)

  const sections = useMemo(() => {
    const pending = transactions.filter((t) => isPending(t.status) && (direction === 'in' ? t.type === 'income' : t.type !== 'income')).sort((a, b) => a.date.localeCompare(b.date))
    const endThis = monthEnd(monthKey(today))
    const endNext = monthEnd(addMonthKey(monthKey(today), 1))
    return [
      { title: direction === 'in' ? 'En retard de paiement ?' : 'Échéance passée — statut à actualiser', hint: 'Date dépassée : indique si c’est réglé. Rien n’est supposé impayé.', items: pending.filter((t) => needsStatusUpdate(t, today)) },
      { title: 'D’ici la fin du mois', hint: undefined, items: pending.filter((t) => t.date >= today && t.date <= endThis) },
      { title: 'Mois prochain', hint: undefined, items: pending.filter((t) => t.date > endThis && t.date <= endNext) },
    ]
  }, [transactions, direction, today])

  const total = (list: typeof sections[number]['items']) => list.reduce((s, t) => s + t.amountCents, 0)

  return (
    <>
      <PageHeader title="Factures et échéances" subtitle="Ce qui doit sortir ou entrer. Coche une échéance quand elle est réglée."
        actions={<Button variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => setAdding(true)}>Échéance récurrente</Button>} />
      <Segmented label="Sens" value={direction} onChange={setDirection} className="mb-4" options={[{ value: 'out', label: 'À payer' }, { value: 'in', label: 'À recevoir' }]} />
      <div className="flex flex-col gap-4">
        {sections.every((s) => s.items.length === 0) && (
          <Panel><EmptyState icon={<CalendarCheck size={20} />} title={direction === 'out' ? 'Aucune facture à venir' : 'Aucun revenu attendu'}>Les échéances récurrentes apparaissent ici automatiquement.</EmptyState></Panel>
        )}
        {sections.filter((s) => s.items.length > 0).map((section) => (
          <Panel key={section.title} title={section.title} action={<Amount cents={total(section.items)} className="text-[14px] font-semibold" />}>
            {section.hint && <p className="-mt-1 mb-1 text-[12px] text-ink-3">{section.hint}</p>}
            <div className="divide-y divide-[var(--border)]">{section.items.map((t) => <TransactionRow key={t.id} txn={t} today={today} onOpen={actions.open} onSettle={actions.settle} />)}</div>
          </Panel>
        ))}
        <Panel eyebrow="Modèles" title="Échéances récurrentes"><RuleList rules={rules} /></Panel>
      </div>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouvelle échéance récurrente" size="lg">
        <RuleForm initial={blankRule(direction === 'in' ? 'income' : 'bill')} onDone={() => { toast({ title: 'Échéance créée' }); setAdding(false) }} />
      </Sheet>
      <EditTransactionSheet txn={actions.editing} onClose={actions.close} />
      {actions.settleDialog}
    </>
  )
}
