import type { ReactNode } from 'react'

/** État vide qui oriente vers l'action suivante plutôt qu'une page blanche. */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-2">{icon}</div>}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {children && <div className="max-w-[360px] text-[13px] text-ink-3">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
