import { motion } from 'motion/react'
import { formatDateFr } from '@/domain/dates'
import { item, transition } from '@/components/motion'
import { cn } from '@/lib/cn'
import type { Financials } from '../data/useFinancials'
import { greeting, moodLine } from './mood'

const DOT = { calm: 'bg-positive', watch: 'bg-warning-fill', alert: 'bg-danger', setup: 'bg-info' }

/** En-tête chaleureux : salutation selon l'heure et résumé de la situation en une phrase. */
export function Greeting({ f }: { f: Financials }) {
  const mood = moodLine(f)
  const date = formatDateFr(f.today, 'long')
  return (
    <motion.header variants={item} className="pb-6 pt-2">
      <p className="eyebrow mb-1">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
      <h1 className="display text-[32px] leading-[1.1] text-ink min-[900px]:text-[38px]">{greeting(new Date().getHours())} 👋</h1>
      <motion.p key={mood.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={transition.slow}
        className="mt-3 flex max-w-[620px] items-start gap-2.5 text-[15px] text-ink-2">
        <span className="relative mt-[7px] flex h-2.5 w-2.5 shrink-0">
          {mood.tone !== 'calm' && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-50 [animation-iteration-count:3]', DOT[mood.tone])} />}
          <span className={cn('relative h-2.5 w-2.5 rounded-full', DOT[mood.tone])} />
        </span>
        {mood.text}
      </motion.p>
    </motion.header>
  )
}
