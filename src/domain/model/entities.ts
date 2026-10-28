import type { Cents, DataOrigin, Id, IsoDate, MonthKey, SyncedEntity } from './base'
import type { TransactionStatus, TransactionType } from './status'

export type AccountKind = 'checking' | 'savings' | 'cash' | 'credit' | 'other'

export interface Account extends SyncedEntity {
  name: string
  kind: AccountKind
  currency: 'EUR'
  /** Solde connu à `openingDate` (début de journée). `null` = inconnu : aucun solde n'est inventé. */
  openingBalanceCents: number | null
  openingDate: IsoDate | null
  includeInTotals: boolean
  archived: boolean
  origin: DataOrigin
}

export type CategoryKind = 'expense' | 'income' | 'savings'

export interface Category extends SyncedEntity {
  name: string
  kind: CategoryKind
  /** Jeton de couleur fonctionnelle (voir styles/tokens.css). */
  tone: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'slate' | 'teal' | 'rose'
  /** Dépense plutôt fixe (loyer, crédit) ou variable (alimentation, loisirs). */
  fixed: boolean
}

export type Confidence = 'high' | 'medium' | 'low'
/** Scénario le plus prudent dans lequel un revenu attendu est inclus. */
export type ScenarioName = 'prudent' | 'realistic' | 'favorable'

export interface Transaction extends SyncedEntity {
  type: TransactionType
  amountCents: Cents
  /** Borne basse pour un montant variable (ex. 80–100 €). `amountCents` est alors la borne haute. */
  amountMinCents: Cents | null
  currency: 'EUR'
  date: IsoDate
  valueDate: IsoDate | null
  /** La date est une hypothèse (fin de mois) car l'échéance exacte n'est pas connue. */
  dateEstimated: boolean
  accountId: Id | null
  toAccountId: Id | null
  categoryId: Id | null
  description: string
  status: TransactionStatus
  recurringRuleId: Id | null
  /** Clé de l'occurrence générée par une règle récurrente : garantit l'absence de doublons. */
  occurrenceKey: string | null
  isBill: boolean
  payee: string | null
  debtId: Id | null
  goalId: Id | null
  confidence: Confidence | null
  scenario: ScenarioName | null
  source: string | null
  invoiceRef: string | null
  attachmentName: string | null
  note: string | null
  origin: DataOrigin
}

export type Frequency = 'weekly' | 'monthly' | 'yearly' | 'custom_days'
export type RuleKind = 'bill' | 'subscription' | 'income' | 'debt_installment' | 'savings' | 'other'

export interface RecurringRule extends SyncedEntity {
  kind: RuleKind
  type: TransactionType
  label: string
  payee: string | null
  amountCents: Cents
  amountMinCents: Cents | null
  accountId: Id | null
  toAccountId: Id | null
  categoryId: Id | null
  frequency: Frequency
  /** Tous les N (semaines, mois, ans ou jours selon la fréquence). */
  interval: number
  /** `null` = calendrier inconnu : la règle n'est pas projetée tant qu'il n'est pas précisé. */
  startDate: IsoDate | null
  /** Jour du mois inconnu : l'occurrence est placée en fin de mois et marquée comme estimée. */
  dayUnknown: boolean
  endDate: IsoDate | null
  occurrenceCount: number | null
  fixed: boolean
  debtId: Id | null
  goalId: Id | null
  confidence: Confidence | null
  scenario: ScenarioName | null
  active: boolean
  note: string | null
  origin: DataOrigin
}

export interface Budget extends SyncedEntity {
  categoryId: Id
  /** S'applique à partir de ce mois, jusqu'au prochain budget de la même catégorie. */
  fromMonth: MonthKey
  amountCents: Cents
  rollover: boolean
  alertPercent: number
}

export type DebtKind = 'loan' | 'installment' | 'overdraft' | 'other'
export type DebtStatus = 'active' | 'paid_off' | 'paused'

export interface Debt extends SyncedEntity {
  creditor: string
  label: string
  kind: DebtKind
  initialAmountCents: Cents | null
  /** Capital restant dû déclaré à `principalAsOf`. `null` = inconnu. */
  principalCents: Cents | null
  principalAsOf: IsoDate | null
  monthlyPaymentCents: Cents
  /** Taux annuel en points de base (1 % = 100). `null` = inconnu, jamais inventé. */
  annualRateBps: number | null
  nextDueDate: IsoDate | null
  remainingInstallments: number | null
  feesCents: Cents | null
  status: DebtStatus
  /** Pour un découvert : compte dont le solde négatif représente déjà cette dette. */
  linkedAccountId: Id | null
  note: string | null
  origin: DataOrigin
}

export interface DebtPayment extends SyncedEntity {
  debtId: Id
  date: IsoDate
  totalCents: Cents
  principalCents: Cents | null
  interestCents: Cents | null
  feesCents: Cents | null
  /** Transaction de sortie d'argent correspondante : le flux n'est compté qu'une fois, via elle. */
  transactionId: Id | null
}

export type GoalKind = 'emergency' | 'purchase' | 'travel' | 'project' | 'tax' | 'other'

export interface SavingsGoal extends SyncedEntity {
  name: string
  kind: GoalKind
  targetCents: Cents
  /** Montant déjà mis de côté avant le suivi dans l'application. */
  startingCents: Cents
  deadline: IsoDate | null
  priority: 1 | 2 | 3
  accountId: Id | null
  plannedMonthlyCents: Cents | null
}

export interface TaxParameter {
  id: Id
  label: string
  rateBps: number | null
  source: string
  verifiedAt: IsoDate | null
  status: 'unconfirmed' | 'confirmed'
}

export interface RevenueDeclaration {
  id: Id
  month: MonthKey
  amountCents: Cents
  /** Chiffre d'affaires avant prélèvements : ce n'est pas de la trésorerie disponible. */
  gross: boolean
  note: string
}

export interface Settings extends SyncedEntity {
  appName: string
  onboardingDone: boolean
  syncMode: 'local' | 'cloud'
  trackingStartDate: IsoDate | null
  /** Seuil sous lequel le solde projeté déclenche une alerte. */
  safetyThresholdCents: Cents
  /** Facteurs appliqués aux dépenses variables estimées, en pour mille (1000 = ×1). */
  scenarioFactors: Record<ScenarioName, number>
  /** Estimation mensuelle des dépenses variables imposée par l'utilisateur. `null` = calculée. */
  variableSpendingOverrideCents: Cents | null
  taxParameters: TaxParameter[]
  revenueDeclarations: RevenueDeclaration[]
}
