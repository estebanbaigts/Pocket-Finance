import { useState } from 'react'
import type { Forecast } from '@/domain/forecast'
import type { Settings } from '@/domain/model'
import { centsToInput, formatCents, parseAmountInput } from '@/domain/money'
import { AmountInput, Button, Field, TextInput, useToast } from '@/components/ui'
import { updateEntity } from '@/services/storage'

const factorLabel = { prudent: 'Prudent', realistic: 'Réaliste', favorable: 'Favorable' } as const

/** Toutes les hypothèses de projection sont visibles et modifiables. */
export function AssumptionsEditor({ settings, forecast }: { settings: Settings; forecast: Forecast }) {
  const toast = useToast()
  const [threshold, setThreshold] = useState(centsToInput(settings.safetyThresholdCents))
  const [override, setOverride] = useState(centsToInput(settings.variableSpendingOverrideCents))
  const [factors, setFactors] = useState(Object.fromEntries(Object.entries(settings.scenarioFactors).map(([k, v]) => [k, String(Math.round(v / 10))])) as Record<keyof typeof factorLabel, string>)
  const thresholdCents = parseAmountInput(threshold)
  const overrideCents = override === '' ? null : parseAmountInput(override)
  const factorValues = Object.fromEntries(Object.entries(factors).map(([k, v]) => [k, Number(v) * 10])) as Settings['scenarioFactors']
  const valid = thresholdCents !== null && (override === '' || overrideCents !== null) && Object.values(factorValues).every((v) => Number.isFinite(v) && v >= 0 && v <= 3000)

  const save = async () => {
    if (!valid) return
    await updateEntity('settings', settings.id, { safetyThresholdCents: thresholdCents ?? 0, variableSpendingOverrideCents: overrideCents, scenarioFactors: factorValues })
    toast({ title: 'Hypothèses enregistrées, projection recalculée' })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Seuil de sécurité" hint="Alerte si le solde projeté passe en dessous.">{(p) => <AmountInput {...p} value={threshold} onChange={(e) => setThreshold(e.target.value)} />}</Field>
        <Field label="Dépenses courantes par mois" optional hint={`Vide = ${forecast.variable.basis === 'none' ? 'non estimées' : `${formatCents(forecast.variable.monthlyCents)} (${forecast.variable.explanation.toLowerCase()})`}`}>
          {(p) => <AmountInput {...p} value={override} onChange={(e) => setOverride(e.target.value)} />}
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium text-ink-2">Dépenses courantes appliquées par scénario (%)</legend>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(factorLabel) as (keyof typeof factorLabel)[]).map((k) => (
            <Field key={k} label={factorLabel[k]}>{(p) => <TextInput inputMode="numeric" {...p} value={factors[k]} onChange={(e) => setFactors((f) => ({ ...f, [k]: e.target.value.replace(/\D/g, '') }))} />}</Field>
          ))}
        </div>
      </fieldset>
      <Button variant="primary" disabled={!valid} onClick={save} className="self-start">Appliquer les hypothèses</Button>
    </div>
  )
}
