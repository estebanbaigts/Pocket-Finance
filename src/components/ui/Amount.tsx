import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { formatCents, formatSignedCents } from '@/domain/money'
import { cn } from '@/lib/cn'

type Tone = 'auto' | 'neutral' | 'positive' | 'danger' | 'warning' | 'muted'

interface AmountProps {
  cents: number | null
  signed?: boolean
  tone?: Tone
  className?: string
  /** Animation courte (≤ 350 ms) lors d'un changement de valeur ; la valeur finale est toujours annoncée. */
  animated?: boolean
  unknownLabel?: string
}

const toneClass: Record<Exclude<Tone, 'auto'>, string> = {
  neutral: 'text-ink', positive: 'text-positive', danger: 'text-danger', warning: 'text-warning', muted: 'text-ink-3',
}

function resolveTone(tone: Tone, cents: number): Exclude<Tone, 'auto'> {
  if (tone !== 'auto') return tone
  return cents < 0 ? 'danger' : 'neutral'
}

export function Amount({ cents, signed = false, tone = 'neutral', className, animated = false, unknownLabel = 'Inconnu' }: AmountProps) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(cents ?? 0)
  const previous = useRef(cents ?? 0)

  useEffect(() => {
    if (cents === null) return
    if (!animated || reduce || previous.current === cents) {
      setShown(cents)
      previous.current = cents
      return
    }
    const controls = animate(previous.current, cents, { duration: 0.35, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) })
    previous.current = cents
    return () => controls.stop()
  }, [cents, animated, reduce])

  if (cents === null) return <span className={cn('num text-ink-3', className)}>{unknownLabel}</span>
  const format = signed ? formatSignedCents : formatCents
  return (
    <span className={cn('num whitespace-nowrap', toneClass[resolveTone(tone, cents)], className)}>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(cents)}</span>
    </span>
  )
}
