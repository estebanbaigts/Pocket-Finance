import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { item } from '../motion'

/** En-tête éditorial : surtitre, titre en serif, sous-titre, actions. */
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <motion.header variants={item} className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-2">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="display text-[30px] leading-[1.1] text-ink min-[900px]:text-[36px]">{title}</h1>
        {subtitle && <div className="mt-2 max-w-[620px] text-[14px] text-ink-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.header>
  )
}
