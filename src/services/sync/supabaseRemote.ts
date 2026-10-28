import type { SupabaseClient } from '@supabase/supabase-js'
import { REMOTE_TABLES, type AnyEntity, type EntityName } from '../storage/schema'
import { fromRow, toRow } from './mapping'
import { RemoteUnavailableError, type PullPage, type PushResult, type RemoteAdapter } from './remote'

const PAGE_SIZE = 500
const UNIQUE_VIOLATION = '23505'

/**
 * Implémentation Supabase (PostgREST). Le verrou optimiste est appliqué par la clause
 * `version = <version de base>` ; le trigger serveur incrémente la version et horodate la ligne.
 */
export class SupabaseRemote implements RemoteAdapter {
  constructor(private readonly client: SupabaseClient) {}

  private async fetchOne(entity: EntityName, id: string): Promise<AnyEntity | null> {
    const { data, error } = await this.client.from(REMOTE_TABLES[entity]).select('*').eq('id', id).maybeSingle()
    if (error) throw new RemoteUnavailableError(error.code ?? 'lecture')
    return data ? fromRow(data as Record<string, unknown>) : null
  }

  async push(entity: EntityName, record: AnyEntity): Promise<PushResult> {
    const table = this.client.from(REMOTE_TABLES[entity])
    const row = toRow(record)
    if (record.version === 0) {
      const { error } = await table.insert({ ...row, version: 1 })
      if (!error) return { status: 'applied', version: 1 }
      if (error.code !== UNIQUE_VIOLATION) throw new RemoteUnavailableError(error.code ?? 'insertion')
    } else {
      const { data, error } = await table.update({ ...row, version: record.version + 1 }).eq('id', record.id).eq('version', record.version).select('version')
      if (error) throw new RemoteUnavailableError(error.code ?? 'mise à jour')
      if (data && data.length === 1) return { status: 'applied', version: (data[0] as { version: number }).version }
    }
    const remote = await this.fetchOne(entity, record.id)
    if (!remote) throw new RemoteUnavailableError('Enregistrement distant introuvable')
    return { status: 'conflict', remote }
  }

  async pull(entity: EntityName, since: string | null): Promise<PullPage> {
    let query = this.client.from(REMOTE_TABLES[entity]).select('*').order('server_updated_at', { ascending: true }).limit(PAGE_SIZE)
    if (since) query = query.gt('server_updated_at', since)
    const { data, error } = await query
    if (error) throw new RemoteUnavailableError(error.code ?? 'lecture')
    const rows = (data ?? []) as Record<string, unknown>[]
    const last = rows.at(-1)
    return { records: rows.map(fromRow), cursor: last ? String(last.server_updated_at) : since }
  }
}
