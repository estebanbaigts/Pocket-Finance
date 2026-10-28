import Dexie, { type Table } from 'dexie'
import type { ConflictEntry, EntityMap, EntityName, MetaEntry, OutboxEntry } from './schema'

type EntityTables = { [K in EntityName]: Table<EntityMap[K], string> }

/** Base IndexedDB locale : source de vérité de l'appareil, consultable et modifiable hors ligne. */
export class PocketDatabase extends Dexie {
  declare accounts: EntityTables['accounts']
  declare categories: EntityTables['categories']
  declare transactions: EntityTables['transactions']
  declare recurringRules: EntityTables['recurringRules']
  declare budgets: EntityTables['budgets']
  declare debts: EntityTables['debts']
  declare debtPayments: EntityTables['debtPayments']
  declare savingsGoals: EntityTables['savingsGoals']
  declare settings: EntityTables['settings']
  declare outbox: Table<OutboxEntry, string>
  declare conflicts: Table<ConflictEntry, string>
  declare meta: Table<MetaEntry, string>

  constructor(name = 'pocket') {
    super(name)
    this.version(1).stores({
      accounts: 'id, updatedAt',
      categories: 'id, updatedAt',
      transactions: 'id, date, accountId, categoryId, status, recurringRuleId, occurrenceKey, debtId, goalId, updatedAt',
      recurringRules: 'id, updatedAt',
      budgets: 'id, categoryId, fromMonth, updatedAt',
      debts: 'id, updatedAt',
      debtPayments: 'id, debtId, transactionId, updatedAt',
      savingsGoals: 'id, updatedAt',
      settings: 'id',
      outbox: 'key, entity, queuedAt',
      conflicts: 'key, entity',
      meta: 'key',
    })
  }
}

export let db = new PocketDatabase()

/** Repart d'une base vierge (tests, suppression explicite des données locales). */
export async function resetDatabase(name = 'pocket'): Promise<PocketDatabase> {
  db.close()
  await Dexie.delete(name)
  db = new PocketDatabase(name)
  return db
}

export function tableFor<K extends EntityName>(entity: K): Table<EntityMap[K], string> {
  return db[entity] as unknown as Table<EntityMap[K], string>
}

/** Toutes les tables d'entités, pour les transactions Dexie couvrant plusieurs tables. */
export function entityTables(): Table[] {
  return [db.accounts, db.categories, db.transactions, db.recurringRules, db.budgets, db.debts, db.debtPayments, db.savingsGoals, db.settings]
}
