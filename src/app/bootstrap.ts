import { todayIso } from '@/domain/dates'
import { ensureDefaults, ensureOccurrences } from '@/services/storage'
import { isNativeApp, requestPersistentStorage } from '@/lib/native/platform'
import { APP_NAME } from './config'

let started: Promise<void> | null = null

/** Au démarrage (une seule fois) : paramètres et catégories par défaut, puis échéances manquantes. */
export function bootstrap(): Promise<void> {
  started ??= ensureDefaults(APP_NAME).then(() => ensureOccurrences(todayIso())).then(() => void requestPersistentStorage())
  return started
}

/** Regénère les échéances quand l'application revient au premier plan (ex. un nouveau mois a commencé). */
export function watchForeground(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void ensureOccurrences(todayIso())
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}

/** Enregistre le service worker en production uniquement (le mode développement reste sans cache). */
export function registerServiceWorker(): void {
  // Dans l'app iOS, les fichiers sont déjà embarqués : pas de service worker.
  if (!import.meta.env.PROD || isNativeApp() || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => console.warn('Service worker non enregistré : mode hors ligne indisponible'))
  })
}
