import type { Transition } from 'motion/react'

/** Durées (secondes) alignées sur les tokens CSS --duration-*. */
export const duration = { fast: 0.14, base: 0.2, slow: 0.28, context: 0.42 } as const

/** Courbes naturelles, sans rebond excessif. */
export const ease = { out: [0.2, 0.8, 0.2, 1], inOut: [0.4, 0, 0.2, 1] } as const

export const transition = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
  /** Ressort amorti pour les feuilles et la réorganisation de listes. */
  spring: { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 },
} satisfies Record<string, Transition>
