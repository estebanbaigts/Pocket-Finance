import { cn } from '@/lib/cn'

/** Chargement : blocs statiques à faible contraste, sans animation permanente (économie de batterie). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-md bg-surface-2', className)} />
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="flex flex-col gap-4 pt-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
    </div>
  )
}
