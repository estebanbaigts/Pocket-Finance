import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** État vide qui oriente vers l'action suivante plutôt qu'une page blanche. */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && (
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive">{icon}</motion.div>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {children && <div className="max-w-[360px] text-[13px] text-ink-3">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
