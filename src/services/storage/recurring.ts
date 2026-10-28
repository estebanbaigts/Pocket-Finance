import type { IsoDate, RecurringRule } from '@/domain/model'
import { addMonthKey, monthEnd, monthKey } from '@/domain/dates'
import { isSchedulable, planOccurrences } from '@/domain/recurrence'
import { live } from '@/domain/ledger'
import { db } from './db'
import { deterministicId } from './ids'
import { createEntity } from './repository'

/** Horizon de matérialisation : jusqu'à la fin du mois suivant. */
export function materializationHorizon(today: IsoDate): IsoDate {
  return monthEnd(addMonthKey(monthKey(today), 1))
}

/** Début de génération : départ de la règle, mais jamais avant la date de début du suivi. */
function generationStart(rule: RecurringRule, trackingStart: IsoDate | null): IsoDate {
  const start = rule.startDate ?? '9999-12-31'
  return trackingStart !== null && trackingStart > start ? trackingStart : start
}

/**
 * Crée les occurrences manquantes de toutes les règles actives. Idempotent : peut être appelé
 * à chaque ouverture de l'application sans jamais créer de doublon.
 */
export async function ensureOccurrences(today: IsoDate): Promise<number> {
  const [rules, existing, settings] = await Promise.all([db.recurringRules.toArray(), db.transactions.toArray(), db.settings.toArray()])
  const trackingStart = settings[0]?.trackingStartDate ?? null
  let created = 0
  for (const rule of live(rules).filter(isSchedulable)) {
    const drafts = planOccurrences(rule, existing, generationStart(rule, trackingStart), materializationHorizon(today))
    for (const draft of drafts) {
      const id = deterministicId(draft.occurrenceKey ?? '')
      if (await db.transactions.get(id)) continue
      await createEntity('transactions', { ...draft, id })
      created += 1
    }
  }
  return created
}

/** Règles actives dont le calendrier n'est pas connu : elles ne sont pas projetées et doivent être signalées. */
export function unscheduledRules(rules: readonly RecurringRule[]): RecurringRule[] {
  return live(rules).filter((rule) => rule.startDate === null || (!rule.active && rule.origin === 'user_declared'))
}
