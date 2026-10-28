import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Mise en page iPhone (navigation inférieure, feuilles depuis le bas). */
export function useIsCompact(): boolean {
  return useMediaQuery('(max-width: 899px)')
}
