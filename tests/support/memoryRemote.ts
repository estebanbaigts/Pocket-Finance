import type { AnyEntity, EntityName } from '@/services/storage/schema'
import { RemoteUnavailableError, type PullPage, type PushResult, type RemoteAdapter } from '@/services/sync/remote'

/**
 * Serveur en mémoire reproduisant les règles des migrations SQL : verrou optimiste sur `version`,
 * incrément serveur, curseur de récupération. Permet de tester le moteur sans réseau.
 */
export class MemoryRemote implements RemoteAdapter {
  private rows = new Map<string, { record: AnyEntity; seq: number }>()
  private seq = 0
  online = true
  pushes = 0

  private key(entity: EntityName, id: string) {
    return `${entity}:${id}`
  }

  async push(entity: EntityName, record: AnyEntity): Promise<PushResult> {
    if (!this.online) throw new RemoteUnavailableError()
    this.pushes += 1
    const existing = this.rows.get(this.key(entity, record.id))
    if ((existing?.record.version ?? 0) !== record.version) {
      if (!existing) return { status: 'conflict', remote: { ...record, version: 0 } }
      return { status: 'conflict', remote: structuredClone(existing.record) }
    }
    const version = record.version + 1
    this.seq += 1
    this.rows.set(this.key(entity, record.id), { record: { ...structuredClone(record), version }, seq: this.seq })
    return { status: 'applied', version }
  }

  async pull(entity: EntityName, since: string | null): Promise<PullPage> {
    if (!this.online) throw new RemoteUnavailableError()
    const after = since === null ? 0 : Number(since)
    const rows = [...this.rows.entries()].filter(([k, v]) => k.startsWith(`${entity}:`) && v.seq > after)
    const cursor = rows.length ? String(Math.max(...rows.map(([, v]) => v.seq))) : since
    return { records: rows.map(([, v]) => structuredClone(v.record)), cursor }
  }

  /** Simule une modification faite depuis un autre appareil. */
  editFromOtherDevice(entity: EntityName, id: string, patch: Record<string, unknown>) {
    const existing = this.rows.get(this.key(entity, id))
    if (!existing) throw new Error('absent')
    this.seq += 1
    this.rows.set(this.key(entity, id), { record: { ...existing.record, ...patch, version: existing.record.version + 1 } as AnyEntity, seq: this.seq })
  }

  get(entity: EntityName, id: string): AnyEntity | undefined {
    return this.rows.get(this.key(entity, id))?.record
  }
}
