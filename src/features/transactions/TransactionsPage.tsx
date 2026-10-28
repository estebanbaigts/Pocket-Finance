import { AnimatePresence, motion } from 'motion/react'
import { Plus, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { formatDateFr, monthKey } from '@/domain/dates'
import { expensesPaid, incomeReceived } from '@/domain/ledger'
import { Amount, Button, EmptyState, PageHeader, Panel, Sheet, useToast } from '@/components/ui'
import { listRow } from '@/components/motion'
import { useLedger } from '../data/LedgerProvider'
import { useToday } from '../data/useToday'
import { blankTransaction } from './draft'
import { EditTransactionSheet } from './EditTransactionSheet'
import { TransactionFiltersBar } from './TransactionFiltersBar'
import { TransactionForm } from './TransactionForm'
import { TransactionRow } from './TransactionRow'
import { useFilteredTransactions, type TransactionFilters } from './useFilteredTransactions'
import { useTransactionActions } from './useTransactionActions'

export default function TransactionsPage() {
  const today = useToday()
  const toast = useToast()
  const { transactions } = useLedger()
  const [filters, setFilters] = useState<TransactionFilters>({ month: monthKey(today), type: 'all', status: 'all', query: '' })
  const [adding, setAdding] = useState(false)
  const { groups, count } = useFilteredTransactions(filters)
  const actions = useTransactionActions()

  return (
    <>
      <PageHeader title="Transactions" subtitle="Toutes les opérations. Les prévues n’affectent que les prévisions ; les annulées ne comptent plus."
        actions={<Button variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => setAdding(true)}>Nouvelle opération</Button>} />
      <TransactionFiltersBar filters={filters} onChange={setFilters} />
      <dl className="mb-4 flex gap-6 text-[13px]">
        <div><dt className="text-ink-3">Encaissé</dt><dd><Amount cents={incomeReceived(transactions, filters.month)} tone="positive" animated className="text-[17px] font-semibold" /></dd></div>
        <div><dt className="text-ink-3">Payé</dt><dd><Amount cents={expensesPaid(transactions, filters.month)} animated className="text-[17px] font-semibold" /></dd></div>
        <div><dt className="text-ink-3">Opérations affichées</dt><dd className="num text-[17px] font-semibold">{count}</dd></div>
      </dl>
      <Panel padded={false}>
        {count === 0 ? (
          <EmptyState icon={<ReceiptText size={20} />} title="Aucune opération" action={<Button variant="primary" onClick={() => setAdding(true)}>Ajouter une opération</Button>}>
            {filters.query || filters.type !== 'all' || filters.status !== 'all' ? 'Aucun résultat avec ces filtres.' : 'Rien d’enregistré pour ce mois.'}
          </EmptyState>
        ) : (
          <ul className="px-5">
            <AnimatePresence initial={false}>
              {groups.map(([date, list]) => (
                <motion.li key={date} layout variants={listRow} initial="hidden" animate="visible" exit="exit" className="overflow-hidden border-b border-line last:border-0">
                  <h3 className="pt-3 text-[12px] font-semibold capitalize text-ink-3">{formatDateFr(date, 'long')}</h3>
                  <AnimatePresence initial={false}>
                    {list.map((t) => (
                      <motion.div key={t.id} layout variants={listRow} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <TransactionRow txn={t} today={today} onOpen={actions.open} onSettle={actions.settle} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Panel>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouvelle opération" size="lg">
        <TransactionForm initial={blankTransaction('expense', today)} onDone={() => { toast({ title: 'Opération enregistrée' }); setAdding(false) }} />
      </Sheet>
      <EditTransactionSheet txn={actions.editing} onClose={actions.close} />
      {actions.settleDialog}
    </>
  )
}
