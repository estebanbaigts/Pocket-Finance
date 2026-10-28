import { BarChart3, CalendarClock, Landmark, LayoutDashboard, LineChart, PiggyBank, ReceiptText, Settings, Wallet, CreditCard, type LucideIcon } from 'lucide-react'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type RouteId = 'overview' | 'transactions' | 'budgets' | 'bills' | 'accounts' | 'debts' | 'savings' | 'forecast' | 'analysis' | 'settings'

export interface RouteDef {
  id: RouteId
  label: string
  short: string
  icon: LucideIcon
  group: 'today' | 'plan' | 'review'
  page: LazyExoticComponent<ComponentType>
}

export const ROUTES: RouteDef[] = [
  { id: 'overview', label: 'Vue d’ensemble', short: 'Accueil', icon: LayoutDashboard, group: 'today', page: lazy(() => import('@/features/overview/OverviewPage')) },
  { id: 'transactions', label: 'Transactions', short: 'Opérations', icon: ReceiptText, group: 'today', page: lazy(() => import('@/features/transactions/TransactionsPage')) },
  { id: 'bills', label: 'Factures et échéances', short: 'Échéances', icon: CalendarClock, group: 'today', page: lazy(() => import('@/features/bills/BillsPage')) },
  { id: 'budgets', label: 'Budgets', short: 'Budgets', icon: Wallet, group: 'plan', page: lazy(() => import('@/features/budgets/BudgetsPage')) },
  { id: 'forecast', label: 'Prévisions', short: 'Prévisions', icon: LineChart, group: 'plan', page: lazy(() => import('@/features/forecast/ForecastPage')) },
  { id: 'savings', label: 'Épargne', short: 'Épargne', icon: PiggyBank, group: 'plan', page: lazy(() => import('@/features/savings/SavingsPage')) },
  { id: 'debts', label: 'Dettes', short: 'Dettes', icon: CreditCard, group: 'plan', page: lazy(() => import('@/features/debts/DebtsPage')) },
  { id: 'accounts', label: 'Comptes', short: 'Comptes', icon: Landmark, group: 'review', page: lazy(() => import('@/features/accounts/AccountsPage')) },
  { id: 'analysis', label: 'Analyses', short: 'Analyses', icon: BarChart3, group: 'review', page: lazy(() => import('@/features/analysis/AnalysisPage')) },
  { id: 'settings', label: 'Paramètres', short: 'Réglages', icon: Settings, group: 'review', page: lazy(() => import('@/features/settings/SettingsPage')) },
]

export const GROUP_LABEL: Record<RouteDef['group'], string> = { today: 'Au quotidien', plan: 'Planifier', review: 'Suivre' }

export function routeById(id: string): RouteDef {
  return ROUTES.find((r) => r.id === id) ?? ROUTES[0]!
}
