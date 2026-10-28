import type { ScenarioName, Transaction } from '../model'

const RANK: Record<ScenarioName, number> = { prudent: 0, realistic: 1, favorable: 2 }
export const SCENARIOS: ScenarioName[] = ['prudent', 'realistic', 'favorable']

/**
 * Scénario minimal d'un revenu attendu, si l'utilisateur ne l'a pas choisi :
 * confirmé → dès le prudent ; prévu et confiance élevée → réaliste ; sinon → favorable uniquement.
 * Aucune probabilité arbitraire : un revenu est inclus entièrement ou pas du tout.
 */
export function incomeScenario(txn: Transaction): ScenarioName {
  if (txn.scenario) return txn.scenario
  if (txn.status === 'confirmed') return 'prudent'
  return txn.confidence === 'high' ? 'realistic' : 'favorable'
}

/** Les dépenses prévues sont incluses dans tous les scénarios ; les revenus selon leur scénario. */
export function includedIn(txn: Transaction, scenario: ScenarioName): boolean {
  if (txn.type !== 'income') return true
  return RANK[scenario] >= RANK[incomeScenario(txn)]
}

/** Montant variable (ex. 80–100 €) : borne haute en prudent, milieu en réaliste, borne basse en favorable. */
export function scenarioAmount(txn: Transaction, scenario: ScenarioName): number {
  if (txn.amountMinCents === null || txn.type === 'income') return txn.amountCents
  if (scenario === 'prudent') return txn.amountCents
  if (scenario === 'favorable') return txn.amountMinCents
  return Math.round((txn.amountCents + txn.amountMinCents) / 2)
}

/** Effet d'une opération sur l'ensemble des comptes suivis (un transfert interne vaut 0). */
export function trackedEffect(txn: Transaction, tracked: ReadonlySet<string>, amount: number): number {
  const fromTracked = txn.accountId === null || tracked.has(txn.accountId)
  if (txn.type === 'income') return fromTracked ? amount : 0
  if (txn.type === 'expense') return fromTracked ? -amount : 0
  const toTracked = txn.toAccountId !== null && tracked.has(txn.toAccountId)
  if (fromTracked && !toTracked) return -amount
  if (!fromTracked && toTracked) return amount
  return 0
}
