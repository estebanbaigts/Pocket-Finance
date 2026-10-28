import type { Category, Settings } from '@/domain/model'
import { db } from './db'
import { createEntity, type Draft } from './repository'

type CategoryDraft = Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'version'>

/** Catégories initiales, toutes modifiables. L'épargne est de type « savings » : jamais une dépense. */
export function defaultCategories(): CategoryDraft[] {
  return [
    { name: 'Logement', kind: 'expense', tone: 'slate', fixed: true },
    { name: 'Alimentation', kind: 'expense', tone: 'green', fixed: false },
    { name: 'Transport', kind: 'expense', tone: 'blue', fixed: false },
    { name: 'Santé', kind: 'expense', tone: 'teal', fixed: false },
    { name: 'Abonnements', kind: 'expense', tone: 'violet', fixed: true },
    { name: 'Crédits', kind: 'expense', tone: 'red', fixed: true },
    { name: 'Loisirs', kind: 'expense', tone: 'amber', fixed: false },
    { name: 'Achats', kind: 'expense', tone: 'rose', fixed: false },
    { name: 'Impôts et cotisations', kind: 'expense', tone: 'slate', fixed: true },
    { name: 'Autres dépenses', kind: 'expense', tone: 'slate', fixed: false },
    { name: 'Salaire et activité', kind: 'income', tone: 'green', fixed: false },
    { name: 'Autres revenus', kind: 'income', tone: 'teal', fixed: false },
    { name: 'Épargne', kind: 'savings', tone: 'green', fixed: false },
  ]
}

export function defaultSettings(appName: string): Draft<'settings'> {
  return {
    appName,
    onboardingDone: false,
    syncMode: 'local',
    trackingStartDate: null,
    safetyThresholdCents: 10_000,
    scenarioFactors: { prudent: 1150, realistic: 1000, favorable: 900 },
    variableSpendingOverrideCents: null,
    taxParameters: [],
    revenueDeclarations: [],
  }
}

/** Garantit la présence des paramètres et des catégories par défaut au premier lancement. */
export async function ensureDefaults(appName: string): Promise<Settings> {
  const existing = await db.settings.toCollection().first()
  if (existing) return existing
  const settings = await createEntity('settings', defaultSettings(appName))
  if ((await db.categories.count()) === 0) {
    for (const category of defaultCategories()) await createEntity('categories', category)
  }
  return settings
}

export async function categoryIdByName(name: string): Promise<string | null> {
  const found = await db.categories.filter((c) => c.name === name && c.deletedAt === null).first()
  return found?.id ?? null
}
