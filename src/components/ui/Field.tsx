import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const control = 'h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3 transition-colors focus:border-ink-2 focus:outline-none aria-[invalid=true]:border-danger'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
  className?: string
}

/** Libellé + contrôle + aide + erreur, reliés pour les lecteurs d'écran. */
export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
        {label}
        {optional && <span className="font-normal text-ink-3"> · facultatif</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && <p id={`${id}-hint`} className="text-[12px] text-ink-3">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-[12px] font-medium text-danger">{error}</p>}
    </div>
  )
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, className)} {...props} />
})

/** Saisie d'un montant en euros : clavier décimal sur iPhone, symbole € affiché. */
export const AmountInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { large?: boolean }>(function AmountInput({ className, large, ...props }, ref) {
  return (
    <div className="relative">
      <input ref={ref} inputMode="decimal" autoComplete="off" placeholder="0,00" className={cn(control, 'num pr-9', large && 'h-14 text-2xl font-semibold', className)} {...props} />
      <span aria-hidden="true" className={cn('pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3', large && 'text-xl')}>€</span>
    </div>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, 'appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8', className)} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")' }} {...props}>
      {children}
    </select>
  )
})

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <label htmlFor={id} className="text-[14px] font-medium text-ink">{label}</label>
        {description && <p className="text-[12px] text-ink-3">{description}</p>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-positive' : 'bg-surface-3')}
      >
        <span className={cn('absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}
