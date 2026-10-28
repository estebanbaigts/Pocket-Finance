import type { AnyEntity } from '../storage/schema'

const IGNORED = new Set(['version', 'updatedAt', 'createdAt'])

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]))
  }
  return value
}

/** Même contenu métier (hors métadonnées de synchronisation) : pas de conflit réel. */
export function sameContent(a: AnyEntity, b: AnyEntity): boolean {
  const strip = (record: AnyEntity) => Object.fromEntries(Object.entries(record).filter(([key]) => !IGNORED.has(key)))
  return JSON.stringify(stable(strip(a))) === JSON.stringify(stable(strip(b)))
}

/** Champs dont la valeur diffère, pour présenter un conflit de façon lisible. */
export function changedFields(a: AnyEntity, b: AnyEntity): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].filter((key) => !IGNORED.has(key) && JSON.stringify((a as never)[key]) !== JSON.stringify((b as never)[key]))
}
