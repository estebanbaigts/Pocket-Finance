import type { Account, Budget, Category, IsoDate, ScenarioName, Settings, Transaction } from '../model'
import { isPending } from '../model'
import { diffDays, monthEnd, monthKey } from '../dates'
import { applyPermille } from '../money'
import { live, totalBalance } from '../ledger'
import { SCENARIOS, includedIn, scenarioAmount, trackedEffect } from './inclusion'
import { estimateVariableSpending, variableSpentIn, type VariableEstimate } from './variable'

export interface ForecastInput {
  accounts: readonly Account[]
  transactions: readonly Transaction[]
  categories: readonly Category[]
  budgets: readonly Budget[]
  settings: Pick<Settings, 'scenarioFactors' | 'variableSpendingOverrideCents' | 'safetyThresholdCents'>
  today: IsoDate
}

export interface ForecastFlow {
  txn: Transaction
  effectCents: number
  overdue: boolean
}

export interface ScenarioProjection {
  scenario: ScenarioName
  startCents: number
  incomeCents: number
  expensesCents: number
  variableCents: number
  endCents: number
  flows: ForecastFlow[]
}

export interface Forecast {
  today: IsoDate
  endDate: IsoDate
  remainingDays: number
  variable: VariableEstimate
  variableSpentCents: number
  scenarios: Record<ScenarioName, ScenarioProjection>
  unknownAccounts: Account[]
  excludedRuleCount: number
}

function projectScenario(input: ForecastInput, scenario: ScenarioName, tracked: ReadonlySet<string>, startCents: number, remainingVariable: number): ScenarioProjection {
  const endDate = monthEnd(monthKey(input.today))
  const flows = live(input.transactions)
    .filter((txn) => isPending(txn.status) && txn.date <= endDate && includedIn(txn, scenario))
    .map((txn) => ({ txn, effectCents: trackedEffect(txn, tracked, scenarioAmount(txn, scenario)), overdue: txn.date < input.today }))
    .filter((flow) => flow.effectCents !== 0)
    .sort((a, b) => a.txn.date.localeCompare(b.txn.date))
  const incomeCents = flows.filter((f) => f.effectCents > 0).reduce((s, f) => s + f.effectCents, 0)
  const expensesCents = flows.filter((f) => f.effectCents < 0).reduce((s, f) => s - f.effectCents, 0)
  const variableCents = applyPermille(remainingVariable, input.settings.scenarioFactors[scenario])
  return { scenario, startCents, incomeCents, expensesCents, variableCents, endCents: startCents + incomeCents - expensesCents - variableCents, flows }
}

/**
 * Projection de fin de mois : soldes connus + opérations en attente jusqu'à la fin du mois
 * (revenus selon le scénario) − dépenses variables restantes estimées × facteur du scénario.
 */
export function projectMonthEnd(input: ForecastInput, excludedRuleCount = 0): Forecast {
  const month = monthKey(input.today)
  const balance = totalBalance(input.accounts, input.transactions, input.today)
  const tracked = new Set(live(input.accounts).filter((a) => a.includeInTotals && !a.archived).map((a) => a.id))
  const variable = estimateVariableSpending(input.transactions, input.categories, input.budgets, month, input.settings.variableSpendingOverrideCents)
  const variableSpentCents = variableSpentIn(input.transactions, input.categories, month)
  const remainingVariable = Math.max(0, variable.monthlyCents - variableSpentCents)
  const scenarios = Object.fromEntries(
    SCENARIOS.map((name) => [name, projectScenario(input, name, tracked, balance.knownCents, remainingVariable)]),
  ) as Record<ScenarioName, ScenarioProjection>
  const endDate = monthEnd(month)
  return { today: input.today, endDate, remainingDays: diffDays(input.today, endDate) + 1, variable, variableSpentCents, scenarios, unknownAccounts: balance.unknownAccounts, excludedRuleCount }
}
