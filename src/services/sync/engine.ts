import { db } from '../storage/db'
import { pullRemote } from './pull'
import { pushPending } from './push'
import type { RemoteAdapter } from './remote'

export interface SyncOutcome {
  ok: boolean
  pushed: number
  pulled: number
  conflicts: number
  error: string | null
}

async function writeMeta(key: string, value: string | null): Promise<void> {
  if (value === null) await db.meta.delete(key)
  else await db.meta.put({ key, value })
}

/**
 * Un cycle de synchronisation : réception puis envoi. Réception d'abord, pour détecter
 * les conflits avant d'envoyer. Peut être relancé sans risque (idempotent).
 */
export async function syncOnce(remote: RemoteAdapter): Promise<SyncOutcome> {
  try {
    const pulled = await pullRemote(remote)
    const pushed = await pushPending(remote)
    await writeMeta('lastSyncAt', new Date().toISOString())
    await writeMeta('lastError', null)
    return { ok: true, pushed: pushed.pushed, pulled: pulled.pulled, conflicts: pulled.conflicts + pushed.conflicts, error: null }
  } catch (error) {
    // Journalisation sans contenu financier : uniquement le type d'erreur.
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    await writeMeta('lastError', message)
    return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: message }
  }
}

/** Délai avant nouvelle tentative : 5 s, 10 s, 20 s… plafonné à 5 minutes. */
export function retryDelayMs(failures: number): number {
  return Math.min(5 * 60_000, 5_000 * 2 ** Math.max(0, failures))
}
