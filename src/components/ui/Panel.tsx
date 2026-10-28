import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { item } from '../motion'

interface PanelProps {
  title?: ReactNode
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
  id?: string
}

/** Surface de contenu : bordure fine, pas d'ombre, rayon modéré. */
export function Panel({ title, eyebrow, action, children, className, padded = true, id }: PanelProps) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <motion.section variants={item} aria-labelledby={headingId} className={cn('rounded-lg border border-line bg-surface', className)}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 id={headingId} className="text-[15px] font-semibold text-ink">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(padded && 'px-5 pb-5 pt-3')}>{children}</div>
    </motion.section>
  )
}
