import { useMemo, useState } from 'react'
import type { Debt } from '@/domain/model'
import { compareStrategies, debtProgress, type PortfolioDebt } from '@/domain/debts'
import { formatCents, parseAmountInput } from '@/domain/money'
import { AmountInput, Field, Panel } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'

/** Compare avalanche (taux) et boule de neige (plus petite dette) sur les dettes au capital connu. */
export function StrategyPanel({ debts }: { debts: Debt[] }) {
  const { debtPayments } = useLedger()
  const [extra, setExtra] = useState('50')
  const portfolio: PortfolioDebt[] = debts
    .filter((d) => d.status === 'active' && d.monthlyPaymentCents > 0)
    .map((d) => ({ id: d.id, label: d.creditor, principalCents: debtProgress(d, debtPayments).remainingCents ?? -1, annualRateBps: d.annualRateBps, paymentCents: d.monthlyPaymentCents }))
    .filter((d) => d.principalCents >= 0)
  const extraCents = parseAmountInput(extra) ?? 0
  const result = useMemo(() => compareStrategies(portfolio, extraCents), [portfolio, extraCents])
  const excluded = debts.filter((d) => d.status === 'active').length - portfolio.length
  const unknownRates = portfolio.filter((d) => d.annualRateBps === null).length

  return (
    <Panel title="Ordre de remboursement" eyebrow="Simulation">
      {portfolio.length < 2 ? <p className="text-[13px] text-ink-3">Renseigne le capital restant d’au moins deux dettes pour comparer les stratégies.</p> : (
        <>
          <div className="max-w-[240px]"><Field label="Effort supplémentaire par mois">{(p) => <AmountInput {...p} value={extra} onChange={(e) => setExtra(e.target.value)} />}</Field></div>
          <div className="mt-4 grid gap-3 min-[700px]:grid-cols-2">
            {(['avalanche', 'snowball'] as const).map((s) => (
              <div key={s} className="rounded-lg border border-line p-4">
                <p className="text-[14px] font-semibold text-ink">{s === 'avalanche' ? 'Avalanche — taux le plus élevé d’abord' : 'Boule de neige — plus petite dette d’abord'}</p>
                <p className="mt-1 text-[13px] text-ink-2">Libéré en {result[s].months} mois · intérêts {unknownRates ? 'partiellement inconnus' : formatCents(result[s].totalInterestCents)}</p>
                <ol className="mt-2 list-decimal pl-5 text-[12px] text-ink-3">{result[s].payoffOrder.map((p) => <li key={p.id}>{p.label} — mois {p.month}</li>)}</ol>
              </div>
            ))}
          </div>
        </>
      )}
      {(excluded > 0 || unknownRates > 0) && <p className="mt-3 text-[12px] text-warning">{excluded > 0 && `${excluded} dette(s) exclue(s) : capital restant inconnu. `}{unknownRates > 0 && `${unknownRates} taux inconnu(s), simulé(s) à 0 % : l’avalanche ne peut pas les classer correctement.`}</p>}
    </Panel>
  )
}
