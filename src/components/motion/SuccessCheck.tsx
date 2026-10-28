import { motion } from 'motion/react'

/** Coche animée (cercle qui apparaît, trait qui se dessine) : confirmation d'un enregistrement. */
export function SuccessCheck({ size = 20 }: { size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 24 24" aria-hidden initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 22 }}>
      <circle cx="12" cy="12" r="11" fill="var(--positive)" />
      <motion.path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }} />
    </motion.svg>
  )
}
