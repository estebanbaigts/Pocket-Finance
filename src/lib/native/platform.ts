import { Capacitor } from '@capacitor/core'

/** Vrai dans l'application iOS (Capacitor), faux dans le navigateur. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** Demande au navigateur de ne pas effacer IndexedDB sous pression d'espace (sans effet si refusé). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
