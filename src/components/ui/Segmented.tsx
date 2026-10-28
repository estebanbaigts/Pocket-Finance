import { motion } from 'motion/react'
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { transition } from '../motion'

interface Option<T extends string> {
  value: T
  label: string
}

/** Contrôle segmenté (groupe de boutons radio) avec indicateur glissant. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const layoutId = useId()
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-md bg-surface-2 p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => onChange(option.value)}
            className={cn('relative h-8 flex-1 whitespace-nowrap rounded-[7px] px-3 text-[13px] font-medium transition-colors', active ? 'text-ink' : 'text-ink-3 hover:text-ink-2')}>
            {active && <motion.span layoutId={layoutId} transition={transition.spring} className="absolute inset-0 rounded-[7px] bg-surface shadow-sm" />}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
