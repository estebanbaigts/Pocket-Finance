import { motion } from 'motion/react'
import { useId } from 'react'
import { formatCentsRounded } from '@/domain/money'
import { transition } from '../motion'

export interface Series {
  name: string
  color: string
  points: { label: string; cents: number }[]
  dashed?: boolean
}

const W = 640
const H = 220
const PAD = { top: 12, right: 12, bottom: 24, left: 56 }

/** Courbe SVG légère (sans dépendance). Une alternative textuelle est fournie par l'écran appelant. */
export function LineChart({ series, thresholdCents, title }: { series: Series[]; thresholdCents?: number; title: string }) {
  const id = useId()
  const all = series.flatMap((s) => s.points.map((p) => p.cents)).concat(thresholdCents ?? [])
  const min = Math.min(0, ...all)
  const max = Math.max(1, ...all)
  const count = Math.max(1, (series[0]?.points.length ?? 1) - 1)
  const x = (i: number) => PAD.left + (i / count) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min || 1)) * (H - PAD.top - PAD.bottom)
  const ticks = [min, (min + max) / 2, max]
  const labels = series[0]?.points ?? []

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={id} className="h-auto w-full overflow-visible">
      <title id={id}>{title}</title>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)" className="num">{formatCentsRounded(t)}</text>
        </g>
      ))}
      {min < 0 && <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--ink-3)" strokeWidth={1} />}
      {thresholdCents !== undefined && (
        <g>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(thresholdCents)} y2={y(thresholdCents)} stroke="var(--warning)" strokeDasharray="4 4" />
          <text x={W - PAD.right} y={y(thresholdCents) - 5} textAnchor="end" fontSize="11" fill="var(--warning)">Seuil</text>
        </g>
      )}
      {series.map((s) => (
        <motion.path key={s.name} d={s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.cents).toFixed(1)}`).join(' ')}
          fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.5 : 2.25} strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={transition.slow} />
      ))}
      {labels.map((p, i) => (i === 0 || i === labels.length - 1 || i % 7 === 0) && (
        <text key={p.label} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--ink-3)">{p.label}</text>
      ))}
    </svg>
  )
}
