import { useEffect } from 'react'
import { ROUTES, type RouteId } from './routes'

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

/**
 * Raccourcis clavier (Mac) : N = ajouter ; 1 à 9 puis 0 = sections ; ignorés pendant la saisie.
 */
export function useShortcuts(onAdd: () => void, navigate: (id: RouteId) => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (document.querySelector('[role="dialog"]')) return
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault()
        onAdd()
        return
      }
      const index = event.key === '0' ? 9 : Number(event.key) - 1
      const route = ROUTES[index]
      if (route && /^[0-9]$/.test(event.key)) navigate(route.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAdd, navigate])
}
