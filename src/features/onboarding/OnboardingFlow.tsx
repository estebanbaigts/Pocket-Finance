import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button, useToast } from '@/components/ui'
import { transition } from '@/components/motion'
import { APP_NAME } from '@/app/config'
import { db, updateEntity } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'
import { useToday } from '../data/useToday'
import { commitOnboarding } from './commit'
import { initialState } from './prefill'
import type { OnboardingState } from './state'
import { StepAccounts } from './steps/StepAccounts'
import { StepBudgets } from './steps/StepBudgets'
import { StepIncome } from './steps/StepIncome'
import { StepMode } from './steps/StepMode'
import { StepProjection } from './steps/StepProjection'
import { StepRecurring } from './steps/StepRecurring'

const STEPS = [
  { title: 'Comment veux-tu utiliser l’application ?', subtitle: 'Tu pourras changer plus tard.' },
  { title: 'Tes comptes', subtitle: 'Saisis les soldes que tu connais. Aucun solde n’est deviné.' },
  { title: 'Tes revenus', subtitle: 'Ce que tu as facturé et ce que tu attends, séparés de ce que tu as reçu.' },
  { title: 'Dépenses fixes et crédits', subtitle: 'Pré-remplis avec ce que tu as déclaré.' },
  { title: 'Budgets et épargne', subtitle: 'Facultatif.' },
  { title: 'Ta première projection', subtitle: 'Calculée avec ce que tu viens de saisir.' },
]

async function finish() {
  const settings = await db.settings.toCollection().first()
  if (settings) await updateEntity('settings', settings.id, { onboardingDone: true })
}

export function OnboardingFlow() {
  const today = useToday()
  const toast = useToast()
  const { accounts, rules } = useLedger()
  // Données déjà enregistrées (assistant interrompu après l'étape 5) : on reprend à la projection
  // au lieu de tout ressaisir, ce qui créerait des doublons.
  const [step, setStep] = useState(() => (accounts.length > 0 || rules.length > 0 ? 5 : 0))
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<OnboardingState>(() => initialState(today))
  const update = (patch: Partial<OnboardingState>) => setState((s) => ({ ...s, ...patch }))

  const next = async () => {
    if (step === 4) {
      setSaving(true)
      try {
        await commitOnboarding(state, today)
        setStep(5)
      } catch {
        toast({ title: 'Les données n’ont pas pu être enregistrées. Réessaie.', tone: 'error' })
      } finally {
        setSaving(false)
      }
      return
    }
    if (step === 5) return finish()
    setStep((s) => s + 1)
  }

  const body = [<StepMode key={0} state={state} update={update} />, <StepAccounts key={1} state={state} update={update} />, <StepIncome key={2} state={state} update={update} />,
    <StepRecurring key={3} state={state} update={update} />, <StepBudgets key={4} state={state} update={update} />, <StepProjection key={5} />][step]

  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col px-4 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)] min-[900px]:pt-16">
      <div className="mb-8 flex items-center gap-2">
        <img src="/icon.svg" alt="" className="h-7 w-7 rounded-[8px]" />
        <span className="display text-[20px]">{APP_NAME}</span>
        <span className="ml-auto text-[12px] text-ink-3">Étape {step + 1} sur {STEPS.length}</span>
      </div>
      <div className="mb-6 flex gap-1" aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={i <= step ? 'h-1 flex-1 rounded-full bg-ink' : 'h-1 flex-1 rounded-full bg-surface-3'} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={transition.base} className="flex-1">
          <h1 className="display text-[30px] leading-tight text-ink">{STEPS[step]?.title}</h1>
          <p className="mb-6 mt-1 text-[14px] text-ink-2">{STEPS[step]?.subtitle}</p>
          {body}
        </motion.div>
      </AnimatePresence>
      <div className="sticky bottom-0 mt-8 flex items-center gap-2 border-t border-line bg-bg py-4">
        {step > 0 && step < 5 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Retour</Button>}
        {step > 0 && step < 4 && <Button variant="ghost" onClick={() => setStep((s) => s + 1)} className="ml-auto">Passer cette étape</Button>}
        <Button variant="primary" size="lg" onClick={next} disabled={saving} className={step === 0 || step >= 4 ? 'ml-auto' : ''}>
          {step === 4 ? (saving ? 'Enregistrement…' : 'Voir ma projection') : step === 5 ? 'Commencer' : 'Continuer'}
        </Button>
      </div>
    </div>
  )
}
