import { ArrowLeftRight, Check } from 'lucide-react'
import type { Transaction } from '@/domain/model'
import { isPending } from '@/domain/model'
import { formatDateFr } from '@/domain/dates'
import { needsStatusUpdate } from '@/domain/recurrence'
import { Amount, Badge } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { accountName, categoryOf, toneVar } from '../data/lookups'
import { settleVerb, statusLabel, statusTone } from './labels'

interface RowProps {
  txn: Transaction
  today: string
  onOpen: (txn: Transaction) => void
  onSettle?: (txn: Transaction) => void
}

function title(txn: Transaction, categoryName: string | undefined): string {
  return txn.description || txn.payee || categoryName || (txn.type === 'transfer' ? 'Transfert' : txn.type === 'income' ? 'Revenu' : 'Dépense')
}

/** Ligne d'opération lisible sans tableau horizontal : titre, contexte, statut texte, montant signé. */
export function TransactionRow({ txn, today, onOpen, onSettle }: RowProps) {
  const { accounts, categories } = useLedger()
  const category = categoryOf(categories, txn.categoryId)
  const sign = txn.type === 'income' ? 1 : txn.type === 'expense' ? -1 : 0
  const stale = needsStatusUpdate(txn, today)
  const context = txn.type === 'transfer'
    ? `${accountName(accounts, txn.accountId)} → ${accountName(accounts, txn.toAccountId)}`
    : [category?.name, txn.accountId ? accountName(accounts, txn.accountId) : null].filter(Boolean).join(' · ')

  return (
    <div className="flex items-center gap-3 py-3">
      <button type="button" onClick={() => onOpen(txn)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
          {txn.type === 'transfer' ? <ArrowLeftRight size={15} className="text-ink-2" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: toneVar(category?.tone) }} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={txn.status === 'cancelled' ? 'block truncate text-[14px] text-ink-3 line-through' : 'block truncate text-[14px] text-ink'}>{title(txn, category?.name)}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3">
            <span>{txn.dateEstimated ? `Avant le ${formatDateFr(txn.date, 'day')}` : formatDateFr(txn.date, 'day')}</span>
            {context && <span className="truncate">{context}</span>}
            {txn.status !== 'paid' && txn.status !== 'received' && <Badge tone={statusTone(txn.status)}>{statusLabel(txn.type, txn.status)}</Badge>}
            {stale && <Badge tone="warning">Échéance passée · à actualiser</Badge>}
            {txn.origin === 'user_declared' && <Badge>Déclaré</Badge>}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Amount cents={sign * txn.amountCents} signed={sign !== 0} tone={sign > 0 ? 'positive' : txn.status === 'cancelled' ? 'muted' : 'neutral'} className="text-[15px] font-medium" />
        {txn.amountMinCents !== null && <span className="num text-[11px] text-ink-3">min {Math.round(txn.amountMinCents / 100)} €</span>}
      </div>
      {onSettle && isPending(txn.status) && (
        <button type="button" onClick={() => onSettle(txn)} aria-label={`${settleVerb(txn.type)} : ${title(txn, category?.name)}`} title={settleVerb(txn.type)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-2 hover:border-positive hover:text-positive">
          <Check size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}
