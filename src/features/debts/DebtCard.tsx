import { AlertTriangle } from 'lucide-react'
import type { Debt } from '@/domain/model'
import { debtProgress, debtWarnings } from '@/domain/debts'
import { formatDateFr } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { Amount, Badge, Button, ProgressBar } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'

const KIND = { loan: 'Crédit', installment: 'Paiement fractionné', overdraft: 'Découvert', other: 'Dette' }
const STATUS = { active: null, paused: 'Suspendue', paid_off: 'Remboursée' }

export function DebtCard({ debt, onPay, onEdit, onSimulate }: { debt: Debt; onPay: () => void; onEdit: () => void; onSimulate: () => void }) {
  const { debtPayments } = useLedger()
  const p = debtProgress(debt, debtPayments)
  const warnings = debtWarnings(debt)
  const count = debtPayments.filter((x) => x.debtId === debt.id).length
  return (
    <article className="rounded-lg border border-line bg-surface p-5">
      <header className="flex flex-wrap items-start gap-2">
        <div className="flex-1">
          <p className="eyebrow">{KIND[debt.kind]}{debt.linkedAccountId && ' · inclus dans le solde du compte'}</p>
          <h3 className="text-[16px] font-semibold text-ink">{debt.creditor}{debt.label && <span className="font-normal text-ink-2"> — {debt.label}</span>}</h3>
        </div>
        {STATUS[debt.status] && <Badge tone="positive">{STATUS[debt.status]}</Badge>}
      </header>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] min-[500px]:grid-cols-3">
        <div><dt className="text-ink-3">Capital restant</dt><dd><Amount cents={p.remainingCents} unknownLabel="Inconnu" className="text-[18px] font-semibold" /></dd></div>
        <div><dt className="text-ink-3">Mensualité</dt><dd><Amount cents={debt.monthlyPaymentCents} className="text-[18px] font-semibold" /></dd></div>
        <div><dt className="text-ink-3">Taux annuel</dt><dd className="num text-[18px] font-semibold text-ink">{debt.annualRateBps === null ? <span className="text-ink-3">Inconnu</span> : `${(debt.annualRateBps / 100).toLocaleString('fr-FR')} %`}</dd></div>
      </dl>
      {p.ratio !== null && <ProgressBar className="mt-3" value={p.ratio} label={`${debt.creditor} : part remboursée`} />}
      <p className="mt-2 text-[12px] text-ink-3">
        {formatCents(p.paidCents)} remboursés ({count} paiement{count > 1 ? 's' : ''}){debt.nextDueDate && ` · prochaine échéance ${formatDateFr(debt.nextDueDate)}`}
        {p.approximate && ' · capital approximatif (intérêts non distingués)'}
      </p>
      {warnings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 rounded-md bg-warning-soft px-3 py-2 text-[12px] text-warning">
          {warnings.map((w) => <li key={w} className="flex gap-1.5"><AlertTriangle size={13} aria-hidden className="mt-0.5 shrink-0" />{w}</li>)}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {debt.status === 'active' && <Button size="sm" variant="primary" onClick={onPay}>Enregistrer un remboursement</Button>}
        {p.remainingCents !== null && debt.monthlyPaymentCents > 0 && <Button size="sm" onClick={onSimulate}>Simuler</Button>}
        <Button size="sm" variant="ghost" onClick={onEdit}>Modifier</Button>
      </div>
    </article>
  )
}
