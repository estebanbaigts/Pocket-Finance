import type { Account, Budget, Category, Debt, DebtPayment, RecurringRule, SavingsGoal, Settings, Transaction } from '@/domain/model'

/** Entités synchronisées : clé locale (Dexie) → type. */
export interface EntityMap {
  accounts: Account
  categories: Category
  transactions: Transaction
  recurringRules: RecurringRule
  budgets: Budget
  debts: Debt
  debtPayments: DebtPayment
  savingsGoals: SavingsGoal
  settings: Settings
}

export type EntityName = keyof EntityMap
export type AnyEntity = EntityMap[EntityName]

/** Ordre d'envoi : les entités référencées passent avant celles qui les référencent (clés étrangères). */
export const ENTITY_NAMES: EntityName[] = [
  'settings', 'accounts', 'categories', 'debts', 'savingsGoals', 'recurringRules', 'transactions', 'budgets', 'debtPayments',
]

/** Nom de la table PostgreSQL correspondante (voir db/migrations). */
export const REMOTE_TABLES: Record<EntityName, string> = {
  accounts: 'accounts', categories: 'categories', transactions: 'transactions', recurringRules: 'recurring_rules',
  budgets: 'budgets', debts: 'debts', debtPayments: 'debt_payments', savingsGoals: 'savings_goals', settings: 'app_settings',
}

/** Modification locale en attente d'envoi. Une seule entrée par enregistrement (les modifications se cumulent). */
export interface OutboxEntry {
  key: string
  entity: EntityName
  recordId: string
  /** Horodatage de la dernière modification locale : permet de savoir si l'enregistrement a bougé pendant l'envoi. */
  queuedAt: string
  attempts: number
  lastError: string | null
}

/** Conflit détecté : les deux versions sont conservées jusqu'à une résolution explicite. */
export interface ConflictEntry {
  key: string
  entity: EntityName
  recordId: string
  local: AnyEntity
  remote: AnyEntity
  detectedAt: string
}

export interface MetaEntry {
  key: string
  value: string
}

export function outboxKey(entity: EntityName, recordId: string): string {
  return `${entity}:${recordId}`
}
