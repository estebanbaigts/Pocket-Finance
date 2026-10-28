import { useCallback, useSyncExternalStore } from 'react'
import { routeById, type RouteId } from './routes'

/** Routage par fragment d'URL (#/budgets) : fonctionne hors ligne et depuis l'écran d'accueil iOS. */
function readRoute(): RouteId {
  return routeById(window.location.hash.replace(/^#\/?/, '') || 'overview').id
}

export function useRoute(): [RouteId, (id: RouteId) => void] {
  const route = useSyncExternalStore(
    (notify) => {
      window.addEventListener('hashchange', notify)
      return () => window.removeEventListener('hashchange', notify)
    },
    readRoute,
    () => 'overview' as RouteId,
  )
  const navigate = useCallback((id: RouteId) => {
    if (readRoute() !== id) window.location.hash = `/${id}`
    window.scrollTo({ top: 0 })
  }, [])
  return [route, navigate]
}
