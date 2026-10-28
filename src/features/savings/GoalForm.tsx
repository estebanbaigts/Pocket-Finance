import { useState } from 'react'
import { AmountInput, Button, Field, Select, TextInput, useToast } from '@/components/ui'
import type { GoalKind } from '@/domain/model'
import { centsToInput, parseAmountInput } from '@/domain/money'
import { createEntity, updateEntity, type Draft } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'

export const GOAL_KIND_LABEL: Record<GoalKind, string> = { emergency: 'Fonds d’urgence', purchase: 'Achat', travel: 'Voyage', project: 'Projet personnel', tax: 'Réserve fiscale', other: 'Autre' }

export function blankGoal(): Draft<'savingsGoals'> {
  return { name: '', kind: 'emergency', targetCents: 0, startingCents: 0, deadline: null, priority: 2, accountId: null, plannedMonthlyCents: null }
}

export function GoalForm({ initial, id, onDone }: { initial: Draft<'savingsGoals'>; id?: string; onDone: () => void }) {
  const { accounts } = useLedger()
  const toast = useToast()
  const [v, setV] = useState({
    name: initial.name, kind: initial.kind, target: initial.targetCents ? centsToInput(initial.targetCents) : '', starting: centsToInput(initial.startingCents),
    deadline: initial.deadline ?? '', priority: String(initial.priority), accountId: initial.accountId ?? '', planned: centsToInput(initial.plannedMonthlyCents),
  })
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [key]: e.target.value }))
  const target = parseAmountInput(v.target)
  const starting = v.starting === '' ? 0 : parseAmountInput(v.starting)
  const planned = v.planned === '' ? null : parseAmountInput(v.planned)
  const invalid = !v.name.trim() || target === null || starting === null || (v.planned !== '' && planned === null)

  const submit = async () => {
    if (invalid) return
    const draft: Draft<'savingsGoals'> = {
      name: v.name.trim(), kind: v.kind, targetCents: target ?? 0, startingCents: starting ?? 0, deadline: v.deadline || null,
      priority: Number(v.priority) as 1 | 2 | 3, accountId: v.accountId || null, plannedMonthlyCents: planned,
    }
    try {
      if (id) await updateEntity('savingsGoals', id, draft)
      else await createEntity('savingsGoals', draft)
      onDone()
    } catch {
      toast({ title: 'Enregistrement impossible.', tone: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Nom">{(p) => <TextInput data-autofocus {...p} value={v.name} onChange={set('name')} placeholder="Ex. Fonds d’urgence" />}</Field>
        <Field label="Type">{(p) => <Select {...p} value={v.kind} onChange={set('kind')}>{Object.entries(GOAL_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>}</Field>
        <Field label="Montant cible" error={v.target && target === null ? 'Montant invalide' : undefined}>{(p) => <AmountInput {...p} value={v.target} onChange={set('target')} />}</Field>
        <Field label="Déjà mis de côté" optional>{(p) => <AmountInput {...p} value={v.starting} onChange={set('starting')} />}</Field>
        <Field label="Échéance" optional>{(p) => <TextInput type="date" {...p} value={v.deadline} onChange={set('deadline')} />}</Field>
        <Field label="Priorité">{(p) => <Select {...p} value={v.priority} onChange={set('priority')}><option value="1">Haute</option><option value="2">Normale</option><option value="3">Basse</option></Select>}</Field>
        <Field label="Compte d’épargne" optional hint="Les virements vers ce compte rattachés à l’objectif l’alimentent.">
          {(p) => <Select {...p} value={v.accountId} onChange={set('accountId')}><option value="">Aucun</option>{accounts.filter((a) => a.kind === 'savings').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
        </Field>
        <Field label="Contribution mensuelle prévue" optional>{(p) => <AmountInput {...p} value={v.planned} onChange={set('planned')} />}</Field>
      </div>
      <Button variant="primary" size="lg" className="w-full justify-center" disabled={invalid} onClick={submit}>{id ? 'Enregistrer' : 'Créer l’objectif'}</Button>
    </div>
  )
}
