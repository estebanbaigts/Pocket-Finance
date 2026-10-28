import type { Category, CategoryKind } from '@/domain/model'
import { cn } from '@/lib/cn'
import { toneVar } from '../data/lookups'

/** Choix de catégorie en un geste : pastilles sur une ligne défilante (iPhone) ou en grille (Mac). */
export function CategoryPicker({ categories, kind, value, onChange }: { categories: Category[]; kind: CategoryKind; value: string; onChange: (id: string) => void }) {
  const options = categories.filter((c) => c.kind === kind).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-ink-2">Catégorie</legend>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 min-[600px]:flex-wrap">
        {options.map((category) => {
          const active = category.id === value
          return (
            <button key={category.id} type="button" aria-pressed={active} onClick={() => onChange(active ? '' : category.id)}
              className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-[13px] transition-colors',
                active ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-ink-2 hover:border-ink-3')}>
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: toneVar(category.tone) }} />
              {category.name}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
