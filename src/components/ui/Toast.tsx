import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { transition } from '../motion'
import { cn } from '@/lib/cn'

interface ToastInput {
  title: string
  tone?: 'success' | 'error' | 'info'
  action?: { label: string; onClick: () => void }
  durationMs?: number
}

interface ToastItem extends ToastInput {
  id: number
}

const ToastContext = createContext<(toast: ToastInput) => void>(() => undefined)

/** Retour visuel d'enregistrement ou d'erreur. Les erreurs restent jusqu'à fermeture : elles ne disparaissent pas d'elles-mêmes. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), [])
  const push = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.random()
    setItems((list) => [...list.slice(-2), { ...toast, id }])
    if (toast.tone !== 'error') window.setTimeout(() => dismiss(id), toast.durationMs ?? (toast.action ? 6000 : 3200))
  }, [dismiss])
  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+12px)] flex flex-col items-center gap-2 px-4 min-[900px]:bottom-6" style={{ zIndex: 'var(--layer-toast)' }}>
        <AnimatePresence initial={false}>
          {items.map((toast) => (
            <motion.div
              key={toast.id} layout initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={transition.spring}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={cn('pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-lg border px-4 py-3 shadow-md',
                toast.tone === 'error' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-line bg-ink text-bg')}
            >
              {toast.tone === 'error' ? <AlertTriangle size={18} aria-hidden /> : toast.tone === 'info' ? <Info size={18} aria-hidden /> : <Check size={18} aria-hidden />}
              <p className="flex-1 text-[14px] font-medium">{toast.title}</p>
              {toast.action && (
                <button type="button" className="rounded-sm px-2 py-1 text-[13px] font-semibold underline-offset-2 hover:underline" onClick={() => { toast.action?.onClick(); dismiss(toast.id) }}>
                  {toast.action.label}
                </button>
              )}
              {toast.tone === 'error' && <button type="button" onClick={() => dismiss(toast.id)} className="text-[13px] font-semibold">Fermer</button>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
