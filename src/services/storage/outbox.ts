import { db } from './db'
import { outboxKey, type EntityName, type OutboxEntry } from './schema'

/** Marque un enregistrement comme modifié localement. À appeler dans la même transaction Dexie que l'écriture. */
export async function queueChange(entity: EntityName, recordId: string, at: string): Promise<void> {
  const key = outboxKey(entity, recordId)
  const existing = await db.outbox.get(key)
  await db.outbox.put({ key, entity, recordId, queuedAt: at, attempts: existing?.attempts ?? 0, lastError: null })
}

export async function pendingChanges(): Promise<OutboxEntry[]> {
  return db.outbox.orderBy('queuedAt').toArray()
}

/** Retire l'entrée seulement si l'enregistrement n'a pas été modifié pendant l'envoi. */
export async function acknowledge(entry: OutboxEntry): Promise<void> {
  await db.transaction('rw', db.outbox, async () => {
    const current = await db.outbox.get(entry.key)
    if (current && current.queuedAt === entry.queuedAt) await db.outbox.delete(entry.key)
  })
}

/** Erreur d'envoi : l'entrée reste en file pour une nouvelle tentative. Le message ne contient aucun montant. */
export async function recordFailure(entry: OutboxEntry, message: string): Promise<void> {
  await db.outbox.update(entry.key, { attempts: entry.attempts + 1, lastError: message })
}
