import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { transition } from '../motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'positive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:opacity-90',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 border border-line',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
  positive: 'bg-positive text-bg hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
  icon: 'h-10 w-10 justify-center',
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={transition.fast}
      className={cn(
        'inline-flex shrink-0 items-center rounded-md font-medium transition-[background-color,opacity,color] duration-150 disabled:opacity-45',
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  )
})
