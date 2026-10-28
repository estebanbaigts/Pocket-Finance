import { useMemo, useState } from 'react'
import type { Debt } from '@/domain/model'
import { compareExtraPayment, debtProgress } from '@/domain/debts'
import { formatCents, parseAmountInput } from '@/domain/money'
import { AmountInput, Badge, Field } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'

function duration(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y} an${y > 1 ? 's' : ''}`, m && `${m} mois`].filter(Boolean).join(' ') || '0 mois'
}

/** Remboursement normal vs accéléré, avec avertissement quand taux ou frais sont inconnus. */
export function DebtSimulator({ debt }: { debt: Debt }) {
  const { debtPayments } = useLedger()
  const [extra, setExtra] = useState('')
  const [lump, setLump] = useState('')
  const remaining = debtProgress(debt, debtPayments).remainingCents ?? 0
  const result = useMemo(() => compareExtraPayment({
    principalCents: remaining, annualRateBps: debt.annualRateBps, paymentCents: debt.monthlyPaymentCents,
    extraMonthlyCents: parseAmountInput(extra) ?? 0, lumpSumCents: Math.min(remaining, parseAmountInput(lump) ?? 0),
  }), [remaining, debt, extra, lump])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Versement supplémentaire par mois" optional>{(p) => <AmountInput {...p} value={extra} onChange={(e) => setExtra(e.target.value)} />}</Field>
        <Field label="Remboursement anticipé immédiat" optional>{(p) => <AmountInput {...p} value={lump} onChange={(e) => setLump(e.target.value)} />}</Field>
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-line p-4 text-[13px]">
        <div><dt className="text-ink-3">Durée normale</dt><dd className="text-[17px] font-semibold">{result.base.neverEnds ? 'Jamais remboursée' : duration(result.base.months)}</dd></div>
        <div><dt className="text-ink-3">Durée accélérée</dt><dd className="text-[17px] font-semibold text-positive">{result.accelerated.neverEnds ? 'Jamais remboursée' : duration(result.accelerated.months)}</dd></div>
        <div><dt className="text-ink-3">Intérêts (normal)</dt><dd className="num text-[17px] font-semibold">{result.base.rateKnown ? formatCents(result.base.totalInterestCents) : 'Inconnus'}</dd></div>
        <div><dt className="text-ink-3">Économie d’intérêts</dt><dd className="num text-[17px] font-semibold text-positive">{result.base.rateKnown ? formatCents(result.interestSavedCents) : 'Non chiffrable'}</dd></div>
      </dl>
      {!result.base.rateKnown && <Badge tone="warning" className="self-start">Taux inconnu : durées calculées sans intérêts</Badge>}
      <p className="text-[12px] text-ink-3">Simulation indicative : mensualités constantes, intérêts mensuels au taux annuel / 12. {debt.feesCents === null ? 'Les frais ou indemnités de remboursement anticipé ne sont pas connus et ne sont pas inclus ; vérifie ton contrat.' : `Frais connus non inclus : ${formatCents(debt.feesCents)}.`}</p>
    </div>
  )
}
