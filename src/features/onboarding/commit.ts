import { addMonths, daysInMonth, monthKey, parseIsoDate, toIsoDate } from '@/domain/dates'
import { parseAmountInput } from '@/domain/money'
import { categoryIdByName, createEntity, db, ensureOccurrences, newId, updateEntity } from '@/services/storage'
import { blankRule } from '../bills/ruleSchema'
import { blankDebt } from '../debts/debtSchema'
import { blankTransaction } from '../transactions/draft'
import type { OnboardingState, RecurringInput } from './state'

/** Première échéance : le jour indiqué ce mois-ci ; jour inconnu = fin de mois (marquée estimée). */
function firstDueDate(item: RecurringInput, today: string): { startDate: string | null; dayUnknown: boolean } {
  if (item.firstDate) return { startDate: item.firstDate, dayUnknown: false }
  if (item.needsSchedule) return { startDate: null, dayUnknown: false }
  const { year, month } = parseIsoDate(today)
  const day = Number(item.day)
  if (!item.day || !Number.isInteger(day) || day < 1 || day > 31) return { startDate: toIsoDate(year, month, 1), dayUnknown: true }
  return { startDate: toIsoDate(year, month, Math.min(day, daysInMonth(year, month))), dayUnknown: false }
}

async function createAccounts(state: OnboardingState): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const a of state.accounts.filter((x) => x.name.trim())) {
    const cents = a.balance === '' ? null : parseAmountInput(a.balance)
    const created = await createEntity('accounts', {
      name: a.name.trim(), kind: a.kind, currency: 'EUR', openingBalanceCents: cents === null ? null : a.negative ? -cents : cents,
      openingDate: state.trackingStart, includeInTotals: true, archived: false, origin: 'user_declared',
    })
    ids.set(a.key, created.id)
  }
  return ids
}

async function createRecurring(state: OnboardingState, accountId: string | null, today: string): Promise<void> {
  for (const item of state.recurring.filter((r) => r.include)) {
    const amount = parseAmountInput(item.amount) ?? 0
    const debtId = item.debt ? (await createEntity('debts', {
      ...blankDebt(), creditor: item.debt.creditor, label: item.label, kind: item.debt.kind, monthlyPaymentCents: amount,
      initialAmountCents: item.occurrenceCount ? amount * item.occurrenceCount : null, remainingInstallments: null,
      note: item.note || 'Montants déclarés, à vérifier', origin: 'user_declared',
    })).id : null
    const schedule = firstDueDate(item, today)
    await createEntity('recurringRules', {
      ...blankRule(item.kind), label: item.label, payee: item.debt?.creditor ?? null, amountCents: amount,
      amountMinCents: item.amountMin ? parseAmountInput(item.amountMin) : null, accountId, categoryId: await categoryIdByName(item.category),
      ...schedule, occurrenceCount: item.occurrenceCount, endDate: schedule.startDate && item.occurrenceCount ? addMonths(schedule.startDate, item.occurrenceCount - 1) : null,
      debtId, note: item.note || null, origin: 'user_declared',
    })
    if (debtId && schedule.startDate) await updateEntity('debts', debtId, { nextDueDate: schedule.startDate })
  }
}

async function createPlanning(state: OnboardingState, accountIds: Map<string, string>, accountId: string | null): Promise<void> {
  const overdraftAmount = parseAmountInput(state.overdraft.amount)
  if (state.overdraft.include && overdraftAmount !== null) {
    await createEntity('debts', {
      ...blankDebt(), creditor: 'CIC', label: 'Découvert à régulariser', kind: 'overdraft', monthlyPaymentCents: 0, principalCents: overdraftAmount,
      principalAsOf: state.trackingStart, linkedAccountId: accountIds.get(state.overdraft.accountKey) ?? null,
      note: 'À confirmer par rapport au solde actuel du compte', origin: 'user_declared',
    })
  }
  for (const income of state.incomes.filter((i) => parseAmountInput(i.amount) !== null && i.date)) {
    await createEntity('transactions', {
      ...blankTransaction('income', income.date), amountCents: parseAmountInput(income.amount) ?? 0, description: income.label || 'Revenu attendu',
      status: 'planned', confidence: income.confidence, accountId, categoryId: await categoryIdByName('Salaire et activité'), origin: 'user_declared',
    })
  }
  for (const [name, value] of Object.entries(state.budgets)) {
    const cents = parseAmountInput(value)
    const categoryId = await categoryIdByName(name)
    if (cents && categoryId) await createEntity('budgets', { categoryId, fromMonth: monthKey(state.trackingStart), amountCents: cents, rollover: false, alertPercent: 80 })
  }
  const target = parseAmountInput(state.emergencyTarget)
  if (target) await createEntity('savingsGoals', { name: 'Fonds d’urgence', kind: 'emergency', targetCents: target, startingCents: 0, deadline: null, priority: 1, accountId: null, plannedMonthlyCents: null })
}

/** Écrit toutes les données de l'assistant, puis génère les échéances. */
export async function commitOnboarding(state: OnboardingState, today: string): Promise<void> {
  const accountIds = await createAccounts(state)
  const mainAccount = accountIds.values().next().value ?? null
  await createRecurring(state, mainAccount, today)
  await createPlanning(state, accountIds, mainAccount)
  const settings = await db.settings.toCollection().first()
  const amount = parseAmountInput(state.revenueAmount)
  if (settings) {
    await updateEntity('settings', settings.id, {
      trackingStartDate: state.trackingStart, syncMode: state.mode,
      revenueDeclarations: state.declareRevenue && amount ? [{ id: newId(), month: state.revenueMonth, amountCents: amount, gross: true, note: 'Chiffre d’affaires déclaré avant prélèvements — ce n’est pas de la trésorerie encaissée' }] : [],
    })
  }
  await ensureOccurrences(today)
}
