import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * `reducedMotion="user"` : si le système demande de réduire les animations, Motion ne conserve
 * que les fondus d'opacité. Aucune action ne dépend de la fin d'une animation.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
