/**
 * Préférences de confort propres à cet appareil (dernier compte utilisé, etc.).
 * Jamais de données financières ici ; tout accès est protégé (navigation privée, stockage bloqué).
 */
export function readPreference(key: string): string | null {
  try {
    return window.localStorage.getItem(`pocket:${key}`)
  } catch {
    return null
  }
}

export function writePreference(key: string, value: string): void {
  try {
    window.localStorage.setItem(`pocket:${key}`, value)
  } catch {
    // Stockage indisponible : la préférence n'est simplement pas mémorisée.
  }
}
