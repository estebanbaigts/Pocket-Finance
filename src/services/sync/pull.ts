import { db, tableFor } from '../storage/db'
import { ENTITY_NAMES, outboxKey, type AnyEntity, type EntityName } from '../storage/schema'
import { sameContent } from './compare'
import type { RemoteAdapter } from './remote'

const cursorKey = (entity: EntityName) => `cursor:${entity}`

/** Paramètres : un seul enregistrement par compte. Celui du serveur remplace celui créé localement avant connexion. */
async function adoptRemoteSettings(remote: AnyEntity): Promise<boolean> {
  const local = await db.settings.toCollection().first()
  if (!local || local.id === remote.id) return false
  await db.transaction('rw', db.settings, db.outbox, async () => {
    await db.settings.delete(local.id)
    await db.outbox.delete(outboxKey('settings', local.id))
    await db.settings.put(remote as never)
  })
  return true
}

/**
 * Applique un enregistrement distant. S'il a aussi été modifié localement (présent en file) et que
 * le serveur a avancé, c'est un conflit : les deux versions sont conservées pour résolution explicite.
 */
async function applyRemote(entity: EntityName, remote: AnyEntity): Promise<'applied' | 'conflict' | 'skipped'> {
  if (entity === 'settings' && (await adoptRemoteSettings(remote))) return 'applied'
  const key = outboxKey(entity, remote.id)
  const local = (await tableFor(entity).get(remote.id)) as AnyEntity | undefined
  const pending = await db.outbox.get(key)
  if (!pending || !local) {
    await tableFor(entity).put(remote as never)
    return 'applied'
  }
  if (remote.version <= local.version) return 'skipped'
  if (sameContent(local, remote)) {
    await tableFor(entity).update(remote.id, { version: remote.version } as never)
    await db.outbox.delete(key)
    return 'applied'
  }
  await db.conflicts.put({ key, entity, recordId: remote.id, local, remote, detectedAt: new Date().toISOString() })
  return 'conflict'
}

export interface PullReport {
  pulled: number
  conflicts: number
}

/** Récupère les changements distants depuis le dernier curseur, entité par entité. Idempotent. */
export async function pullRemote(remote: RemoteAdapter): Promise<PullReport> {
  const report: PullReport = { pulled: 0, conflicts: 0 }
  for (const entity of ENTITY_NAMES) {
    const since = (await db.meta.get(cursorKey(entity)))?.value ?? null
    const page = await remote.pull(entity, since)
    for (const record of page.records) {
      const outcome = await applyRemote(entity, record)
      if (outcome === 'applied') report.pulled += 1
      if (outcome === 'conflict') report.conflicts += 1
    }
    if (page.cursor) await db.meta.put({ key: cursorKey(entity), value: page.cursor })
  }
  return report
}
