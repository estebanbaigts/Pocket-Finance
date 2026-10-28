import { db, tableFor } from '../storage/db'
import { nowIso } from '../storage/ids'
import { queueChange } from '../storage/outbox'
import type { ConflictEntry } from '../storage/schema'

export type ConflictChoice = 'mine' | 'theirs'

/**
 * Résolution explicite d'un conflit :
 * - « mine »   : la version locale est conservée et sera renvoyée en s'appuyant sur la version serveur actuelle ;
 * - « theirs » : la version du serveur remplace la version locale, la modification locale est abandonnée.
 */
export async function resolveConflict(conflict: ConflictEntry, choice: ConflictChoice): Promise<void> {
  const table = tableFor(conflict.entity)
  await db.transaction('rw', table, db.outbox, db.conflicts, async () => {
    if (choice === 'mine') {
      await table.put({ ...conflict.local, version: conflict.remote.version } as never)
      await queueChange(conflict.entity, conflict.recordId, nowIso())
    } else {
      await table.put(conflict.remote as never)
      await db.outbox.delete(conflict.key)
    }
    await db.conflicts.delete(conflict.key)
  })
}

export async function listConflicts(): Promise<ConflictEntry[]> {
  return db.conflicts.toArray()
}
