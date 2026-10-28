import { db, tableFor } from './db'
import { newId, nowIso } from './ids'
import { queueChange } from './outbox'
import type { EntityMap, EntityName } from './schema'

type SystemFields = 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'version'
export type Draft<K extends EntityName> = Omit<EntityMap[K], SystemFields> & { id?: string }
export type Patch<K extends EntityName> = Partial<Omit<EntityMap[K], SystemFields>>

/** Crée un enregistrement et le place en file de synchronisation, de façon atomique. */
export async function createEntity<K extends EntityName>(entity: K, draft: Draft<K>): Promise<EntityMap[K]> {
  const at = nowIso()
  const record = { ...draft, id: draft.id ?? newId(), createdAt: at, updatedAt: at, deletedAt: null, version: 0 } as EntityMap[K]
  await db.transaction('rw', tableFor(entity), db.outbox, async () => {
    await tableFor(entity).add(record)
    await queueChange(entity, record.id, at)
  })
  return record
}

/** Modifie un enregistrement. `version` n'est pas touchée : elle reflète la dernière version serveur connue. */
export async function updateEntity<K extends EntityName>(entity: K, id: string, patch: Patch<K>): Promise<EntityMap[K]> {
  const at = nowIso()
  return db.transaction('rw', tableFor(entity), db.outbox, async () => {
    const current = await tableFor(entity).get(id)
    if (!current) throw new Error(`Enregistrement introuvable (${entity})`)
    const next = { ...current, ...patch, updatedAt: at } as EntityMap[K]
    await tableFor(entity).put(next)
    await queueChange(entity, id, at)
    return next
  })
}

/** Suppression logique : l'enregistrement reste présent pour propager la suppression et permettre l'annulation. */
export async function softDelete(entity: EntityName, id: string): Promise<void> {
  await setDeleted(entity, id, nowIso())
}

/** Annule une suppression logique (« Annuler » après suppression). */
export async function restoreEntity(entity: EntityName, id: string): Promise<void> {
  await setDeleted(entity, id, null)
}

async function setDeleted(entity: EntityName, id: string, deletedAt: string | null): Promise<void> {
  const at = nowIso()
  await db.transaction('rw', tableFor(entity), db.outbox, async () => {
    const current = await tableFor(entity).get(id)
    if (!current) return
    await tableFor(entity).put({ ...current, deletedAt, updatedAt: at })
    await queueChange(entity, id, at)
  })
}
