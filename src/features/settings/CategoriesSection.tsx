import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Category, CategoryKind } from '@/domain/model'
import { Button, Panel, Select, TextInput, useToast } from '@/components/ui'
import { createEntity, softDelete, updateEntity } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'
import { toneVar } from '../data/lookups'

const KIND: Record<CategoryKind, string> = { expense: 'Dépense', income: 'Revenu', savings: 'Épargne' }
const TONES: Category['tone'][] = ['green', 'amber', 'red', 'blue', 'violet', 'slate', 'teal', 'rose']

export function CategoriesSection() {
  const { categories, transactions } = useLedger()
  const toast = useToast()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CategoryKind>('expense')
  const used = new Set(transactions.map((t) => t.categoryId))

  const add = async () => {
    if (!name.trim()) return
    await createEntity('categories', { name: name.trim(), kind, tone: TONES[categories.length % TONES.length] ?? 'slate', fixed: false })
    setName('')
    toast({ title: 'Catégorie ajoutée' })
  }

  return (
    <Panel title="Catégories">
      <ul className="mb-4 divide-y divide-[var(--border)]">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: toneVar(c.tone) }} />
            <input aria-label={`Nom de la catégorie ${c.name}`} defaultValue={c.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) void updateEntity('categories', c.id, { name: v }) }} className="min-w-0 flex-1 rounded-sm bg-transparent px-1 py-1 text-[14px] text-ink focus:bg-surface-2 focus:outline-none" />
            <span className="text-[12px] text-ink-3">{KIND[c.kind]}</span>
            {c.kind === 'expense' && (
              <label className="flex items-center gap-1 text-[12px] text-ink-3"><input type="checkbox" checked={c.fixed} onChange={(e) => void updateEntity('categories', c.id, { fixed: e.target.checked })} className="accent-[var(--positive)]" />Fixe</label>
            )}
            <button type="button" disabled={used.has(c.id)} title={used.has(c.id) ? 'Utilisée par des opérations' : 'Supprimer'} aria-label={`Supprimer ${c.name}`} onClick={() => void softDelete('categories', c.id)} className="rounded-md p-1.5 text-ink-3 hover:text-danger disabled:opacity-30"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <TextInput aria-label="Nouvelle catégorie" placeholder="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} className="min-w-[180px] flex-1" />
        <Select aria-label="Type" value={kind} onChange={(e) => setKind(e.target.value as CategoryKind)} className="w-auto">{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
        <Button icon={<Plus size={16} aria-hidden />} onClick={add}>Ajouter</Button>
      </div>
    </Panel>
  )
}
