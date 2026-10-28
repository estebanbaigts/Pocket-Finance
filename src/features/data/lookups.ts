import type { Account, Category } from '@/domain/model'

export function accountName(accounts: readonly Account[], id: string | null): string {
  if (id === null) return 'Sans compte'
  return accounts.find((a) => a.id === id)?.name ?? 'Compte supprimé'
}

export function categoryOf(categories: readonly Category[], id: string | null): Category | null {
  return id === null ? null : categories.find((c) => c.id === id) ?? null
}

/** Couleur de catégorie (token CSS) pour les pastilles et graphiques. */
export function toneVar(tone: Category['tone'] | undefined): string {
  return `var(--tone-${tone ?? 'slate'})`
}

export function activeAccounts(accounts: readonly Account[]): Account[] {
  return accounts.filter((a) => !a.archived)
}
