import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { overlay, transition } from '../motion'
import { useIsCompact } from '@/lib/useMediaQuery'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Boîte de dialogue : feuille ancrée en bas sur iPhone, panneau centré sur Mac. Échap ferme, le focus est piégé puis restitué. */
export function Sheet({ open, onClose, title, description, children, footer, size = 'md' }: SheetProps) {
  const compact = useIsCompact()
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panel.current) return
      const nodes = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (nodes.length === 0) return
      const [head, tail] = [nodes[0]!, nodes[nodes.length - 1]!]
      if (event.shiftKey && document.activeElement === head) { event.preventDefault(); tail.focus() }
      else if (!event.shiftKey && document.activeElement === tail) { event.preventDefault(); head.focus() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex: 'var(--layer-sheet)' }}>
          <motion.div className="absolute inset-0 bg-[var(--overlay)]" variants={overlay} initial="hidden" animate="visible" exit="exit" onClick={onClose} />
          <motion.div
            ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
            initial={compact ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={compact ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={compact ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={transition.spring}
            className={cn(
              'absolute flex flex-col bg-surface shadow-lg',
              compact
                ? 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[18px] safe-bottom'
                : cn('left-1/2 top-[8vh] max-h-[84vh] w-[calc(100%-48px)] -translate-x-1/2 rounded-lg border border-line', size === 'lg' ? 'max-w-[680px]' : 'max-w-[520px]'),
            )}
          >
            {compact && <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 rounded-full bg-surface-3" />}
            <header className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
              <div>
                <h2 id={titleId} className="display text-[22px] leading-tight text-ink">{title}</h2>
                {description && <p className="mt-1 text-[13px] text-ink-3">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="-mr-2 rounded-md p-2 text-ink-3 hover:bg-surface-2 hover:text-ink">
                <X size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
