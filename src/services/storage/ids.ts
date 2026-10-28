/** Identifiant aléatoire (UUID v4) généré localement. */
export function newId(): string {
  return crypto.randomUUID()
}

let lastStamp = 0

/** Horodatage strictement croissant : deux modifications successives ne partagent jamais le même. */
export function nowIso(): string {
  lastStamp = Math.max(Date.now(), lastStamp + 1)
  return new Date(lastStamp).toISOString()
}

/**
 * UUID déterministe dérivé d'une clé (FNV-1a sur 4 graines). Deux appareils qui génèrent la même
 * occurrence récurrente produisent le même identifiant : la synchronisation ne crée pas de doublon.
 */
export function deterministicId(key: string): string {
  const seeds = [0x811c9dc5, 0x050c5d1f, 0x9e3779b1, 0x85ebca6b]
  const hex = seeds
    .map((seed) => {
      let hash = seed
      for (let i = 0; i < key.length; i += 1) {
        hash ^= key.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) >>> 0
      }
      return hash.toString(16).padStart(8, '0')
    })
    .join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
