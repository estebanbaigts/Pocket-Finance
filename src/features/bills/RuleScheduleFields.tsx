import type { UseFormReturn } from 'react-hook-form'
import { Field, Select, TextInput } from '@/components/ui'
import type { RuleFormValues } from './ruleSchema'

/** Calendrier d'une règle : fréquence, première échéance (ou inconnue), fin. Rien n'est inventé. */
export function RuleScheduleFields({ form }: { form: UseFormReturn<RuleFormValues> }) {
  const { register, watch, formState } = form
  const known = watch('scheduleKnown')
  const frequency = watch('frequency')
  return (
    <div className="grid gap-4 min-[600px]:grid-cols-2">
      <Field label="Fréquence">
        {(p) => <Select {...p} {...register('frequency')}><option value="monthly">Mensuelle</option><option value="weekly">Hebdomadaire</option><option value="yearly">Annuelle</option><option value="custom_days">Tous les N jours</option></Select>}
      </Field>
      <Field label={frequency === 'custom_days' ? 'Tous les (jours)' : 'Intervalle'} hint={frequency === 'monthly' ? '1 = chaque mois, 3 = chaque trimestre' : undefined} error={formState.errors.interval?.message}>
        {(p) => <TextInput type="number" min={1} inputMode="numeric" {...p} {...register('interval')} />}
      </Field>
      <label className="flex items-center gap-2 text-[14px] text-ink-2 min-[600px]:col-span-2">
        <input type="checkbox" className="h-4 w-4 accent-[var(--positive)]" checked={!known} onChange={(e) => form.setValue('scheduleKnown', !e.target.checked)} />
        Calendrier inconnu pour l’instant (non projeté, signalé comme à confirmer)
      </label>
      {known && (
        <>
          <Field label="Première échéance" error={formState.errors.startDate?.message}>{(p) => <TextInput type="date" {...p} {...register('startDate')} />}</Field>
          {frequency === 'monthly' && (
            <label className="flex items-center gap-2 self-end pb-3 text-[14px] text-ink-2">
              <input type="checkbox" className="h-4 w-4 accent-[var(--positive)]" {...register('dayUnknown')} />Jour exact inconnu (fin de mois retenue)
            </label>
          )}
          <Field label="Fin" optional>{(p) => <TextInput type="date" {...p} {...register('endDate')} />}</Field>
          <Field label="Nombre d’échéances" optional error={formState.errors.occurrenceCount?.message}>{(p) => <TextInput inputMode="numeric" {...p} {...register('occurrenceCount')} />}</Field>
        </>
      )}
    </div>
  )
}
