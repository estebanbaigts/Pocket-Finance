import { db } from '../storage/db'

export type SyncState = 'local' | 'synced' | 'pending' | 'error' | 'conflict' | 'offline'

export interface SyncStatus {
  state: SyncState
  pendingCount: number
  conflictCount: number
  lastSyncAt: string | null
  lastError: string | null
}

/** État affiché à l'utilisateur : « Synchronisé », « En attente », « Erreur », « Conflit », « Hors ligne ». */
export function deriveState(input: Omit<SyncStatus, 'state'>, cloudEnabled: boolean, online: boolean): SyncState {
  if (!cloudEnabled) return 'local'
  if (input.conflictCount > 0) return 'conflict'
  if (!online) return 'offline'
  if (input.lastError) return 'error'
  if (input.pendingCount > 0) return 'pending'
  return 'synced'
}

export async function readSyncStatus(cloudEnabled: boolean, online: boolean): Promise<SyncStatus> {
  const [pendingCount, conflictCount, lastSync, lastError] = await Promise.all([
    db.outbox.count(), db.conflicts.count(), db.meta.get('lastSyncAt'), db.meta.get('lastError'),
  ])
  const base = { pendingCount, conflictCount, lastSyncAt: lastSync?.value ?? null, lastError: lastError?.value ?? null }
  return { ...base, state: deriveState(base, cloudEnabled, online) }
}
