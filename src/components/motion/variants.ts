import type { Variants } from 'motion/react'
import { duration, ease, transition } from './tokens'

/** Apparition progressive d'un écran : opacité + légère translation, puis enfants en cascade. */
export const page: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out, staggerChildren: 0.04 } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

export const item: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transition.base },
}

/** Ligne de liste : entre, sort et se déplace sans à-coup lors d'un filtrage. */
export const listRow: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: transition.base },
  exit: { opacity: 0, height: 0, transition: { duration: duration.fast } },
}

export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}
