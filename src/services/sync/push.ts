import { db, tableFor } from '../storage/db'
import { acknowledge, pendingChanges, recordFailure } from '../storage/outbox'
import { ENTITY_NAMES, type AnyEntity, type OutboxEntry } from '../storage/schema'
import { sameContent } from './compare'
import { RemoteUnavailableError, type RemoteAdapter } from './remote'

export interface PushReport {
  pushed: number
  conflicts: number
}

/** Met à jour la version locale sans repasser par la file (ce n'est pas une modification métier). */
async function adoptVersion(entry: OutboxEntry, version: number): Promise<void> {
  await tableFor(entry.entity).update(entry.recordId, { version } as never)
}

async function storeConflict(entry: OutboxEntry, local: AnyEntity, remote: AnyEntity): Promise<void> {
  await db.conflicts.put({ key: entry.key, entity: entry.entity, recordId: entry.recordId, local, remote, detectedAt: new Date().toISOString() })
}

function byDependencyOrder(a: OutboxEntry, b: OutboxEntry): number {
  return ENTITY_NAMES.indexOf(a.entity) - ENTITY_NAMES.indexOf(b.entity) || a.queuedAt.localeCompare(b.queuedAt)
}

/**
 * Envoie les modifications en attente. Une modification en conflit n'est jamais écrasée :
 * elle reste en file, bloquée, jusqu'à ce que l'utilisateur choisisse une version.
 * En cas d'erreur réseau, l'envoi s'arrête et tout reste en file pour la prochaine tentative.
 */
export async function pushPending(remote: RemoteAdapter): Promise<PushReport> {
  const report: PushReport = { pushed: 0, conflicts: 0 }
  const blocked = new Set((await db.conflicts.toArray()).map((c) => c.key))
  const entries = (await pendingChanges()).filter((e) => !blocked.has(e.key)).sort(byDependencyOrder)
  for (const entry of entries) {
    const local = (await tableFor(entry.entity).get(entry.recordId)) as AnyEntity | undefined
    if (!local) {
      await acknowledge(entry)
      continue
    }
    try {
      const result = await remote.push(entry.entity, local)
      if (result.status === 'applied') {
        await adoptVersion(entry, result.version)
        await acknowledge(entry)
        report.pushed += 1
      } else if (sameContent(local, result.remote)) {
        await adoptVersion(entry, result.remote.version)
        await acknowledge(entry)
      } else {
        await storeConflict(entry, local, result.remote)
        report.conflicts += 1
      }
    } catch (error) {
      await recordFailure(entry, error instanceof Error ? error.name : 'Erreur')
      if (error instanceof RemoteUnavailableError) throw error
      throw new RemoteUnavailableError('Envoi interrompu')
    }
  }
  return report
}
