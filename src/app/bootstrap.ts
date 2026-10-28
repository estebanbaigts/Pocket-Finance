import { todayIso } from '@/domain/dates'
import { ensureDefaults, ensureOccurrences } from '@/services/storage'
import { APP_NAME } from './config'

/** Au démarrage : paramètres et catégories par défaut, puis génération des échéances manquantes. */
export async function bootstrap(): Promise<void> {
  await ensureDefaults(APP_NAME)
  await ensureOccurrences(todayIso())
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
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => console.warn('Service worker non enregistré : mode hors ligne indisponible'))
  })
}
