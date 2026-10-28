import { useMemo, useState } from 'react'
import { buildTimeline, firstBreach, lowestPoint } from '@/domain/forecast'
import { formatDateFr } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { revenueVsCash } from '@/domain/income'
import { LineChart } from '@/components/charts'
import { Badge, PageHeader, Panel } from '@/components/ui'
import { unscheduledRules } from '@/services/storage/recurring'
import { useLedger } from '../data/LedgerProvider'
import { useFinancials } from '../data/useFinancials'
import { AssumptionsEditor } from './AssumptionsEditor'
import { FlowsTable } from './FlowsTable'
import { SCENARIO_LABEL, ScenarioCard } from './ScenarioCard'

const COLORS = { prudent: 'var(--warning)', realistic: 'var(--ink)', favorable: 'var(--positive)' }

export default function ForecastPage() {
  const f = useFinancials()
  const { settings, rules, transactions } = useLedger()
  const [showData, setShowData] = useState(false)
  const timelines = useMemo(() => (['prudent', 'realistic', 'favorable'] as const).map((s) => ({
    s, points: buildTimeline(f.forecast.scenarios[s], f.today, f.forecast.endDate),
  })), [f])
  const realistic = timelines[1]!.points
  const breach = firstBreach(timelines[0]!.points, f.thresholdCents)
  const low = lowestPoint(realistic)
  const revenue = revenueVsCash(transactions, settings?.revenueDeclarations ?? [], f.month)
  const pendingRules = unscheduledRules(rules)

  return (
    <>
      <PageHeader title="Prévisions" subtitle={`Projection jusqu’au ${formatDateFr(f.forecast.endDate, 'long')}. Trois scénarios déterministes : aucune probabilité arbitraire n’est appliquée.`} />
      {f.balance.knownAccounts.length === 0 && <p role="note" className="mb-4 rounded-md bg-warning-soft px-4 py-3 text-[13px] text-warning">Aucun solde de compte connu : les montants ci-dessous partent de 0 € et ne représentent que la variation prévue. Renseigne un solde dans « Comptes ».</p>}
      <div className="mb-4 grid gap-4 min-[900px]:grid-cols-3">
        {(['prudent', 'realistic', 'favorable'] as const).map((s) => <ScenarioCard key={s} p={f.forecast.scenarios[s]} highlighted={s === 'realistic'} />)}
      </div>
      <Panel title="Évolution du solde" eyebrow="Jour par jour" className="mb-4"
        action={<button type="button" onClick={() => setShowData((v) => !v)} aria-expanded={showData} className="text-[13px] font-medium text-ink-2 hover:text-ink">{showData ? 'Masquer les données' : 'Voir les données'}</button>}>
        <div className="mb-3 flex flex-wrap gap-3 text-[12px] text-ink-2">
          {timelines.map(({ s }) => <span key={s} className="flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4" style={{ background: COLORS[s] }} />{SCENARIO_LABEL[s]}</span>)}
        </div>
        <LineChart title="Solde projeté par scénario jusqu’à la fin du mois" thresholdCents={f.thresholdCents}
          series={timelines.map(({ s, points }) => ({ name: s, color: COLORS[s], dashed: s !== 'realistic', points: points.map((p) => ({ label: formatDateFr(p.date, 'day'), cents: p.cents })) }))} />
        <p className="mt-3 text-[13px] text-ink-2">
          {breach ? <Badge tone="danger" className="mr-2">Seuil franchi</Badge> : null}
          {breach ? `En prudent, le solde passe sous ${formatCents(f.thresholdCents)} vers le ${formatDateFr(breach.date, 'day')}. ` : `En prudent, le solde reste au-dessus de ${formatCents(f.thresholdCents)}. `}
          {low && `Point le plus bas (réaliste) : ${formatCents(low.cents)} le ${formatDateFr(low.date, 'day')}.`}
        </p>
        {showData && (
          <table className="mt-4 w-full text-[12px]">
            <caption className="sr-only">Solde projeté par jour et par scénario</caption>
            <thead><tr className="text-left text-ink-3"><th className="py-1 font-medium">Date</th>{timelines.map(({ s }) => <th key={s} className="py-1 text-right font-medium">{SCENARIO_LABEL[s]}</th>)}</tr></thead>
            <tbody>{realistic.map((p, i) => <tr key={p.date} className="border-t border-line"><td className="py-1">{formatDateFr(p.date, 'day')}</td>{timelines.map(({ s, points }) => <td key={s} className="num py-1 text-right">{formatCents(points[i]?.cents ?? 0)}</td>)}</tr>)}</tbody>
          </table>
        )}
      </Panel>
      <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
        <Panel title="Hypothèses" eyebrow="Modifiables">{settings && <AssumptionsEditor settings={settings} forecast={f.forecast} />}</Panel>
        <Panel title="Ce qui n’est pas encore projeté" eyebrow="Données incomplètes">
          <ul className="flex flex-col gap-2 text-[13px] text-ink-2">
            {f.forecast.unknownAccounts.map((a) => <li key={a.id}>• Solde inconnu : <strong>{a.name}</strong> (exclu du solde de départ)</li>)}
            {pendingRules.map((r) => <li key={r.id}>• {r.label} : {r.startDate ? 'règle inactive' : 'calendrier à confirmer'} ({formatCents(r.amountCents)})</li>)}
            {f.forecast.variable.basis === 'none' && <li>• Dépenses courantes non estimées : renseigne un montant ou des budgets.</li>}
            {f.forecast.unknownAccounts.length + pendingRules.length === 0 && f.forecast.variable.basis !== 'none' && <li>Toutes les données nécessaires sont renseignées.</li>}
          </ul>
          {(revenue.declaredCents > 0 || revenue.invoicedCents > 0) && (
            <div className="mt-4 border-t border-line pt-3 text-[13px] text-ink-2">
              <p className="mb-1 font-medium text-ink">Chiffre d’affaires et trésorerie ce mois</p>
              <p>Déclaré : {formatCents(revenue.declaredCents)} (avant prélèvements) · Facturé : {formatCents(revenue.invoicedCents)} · Reçu : {formatCents(revenue.receivedCents)}.</p>
              <p className="text-ink-3">Seul l’argent reçu compte dans le solde ; le chiffre d’affaires déclaré n’est jamais utilisé comme trésorerie.</p>
            </div>
          )}
        </Panel>
        <Panel title="Opérations prises en compte" className="min-[900px]:col-span-2"><FlowsTable forecast={f.forecast} /></Panel>
      </div>
    </>
  )
}
