import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatMonthFr, monthKey, todayIso } from '@/domain/dates'
import { formatCents, parseAmountInput } from '@/domain/money'
import { AmountInput, Button, Panel, TextInput } from '@/components/ui'
import { newId, updateEntity } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'

/** Chiffre d'affaires déclaré (avant prélèvements) : information, jamais trésorerie. */
export function RevenueSection() {
  const { settings } = useLedger()
  const [month, setMonth] = useState(monthKey(todayIso()))
  const [amount, setAmount] = useState('')
  if (!settings) return null
  const list = settings.revenueDeclarations
  const cents = parseAmountInput(amount)

  return (
    <Panel title="Chiffre d’affaires déclaré" eyebrow="Avant prélèvements">
      <ul className="mb-3 divide-y divide-[var(--border)]">
        {list.length === 0 && <li className="py-2 text-[13px] text-ink-3">Aucune déclaration.</li>}
        {list.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2 text-[14px]">
            <span className="flex-1 capitalize">{formatMonthFr(d.month)}</span>
            <span className="num">{formatCents(d.amountCents)}</span>
            <button type="button" aria-label="Supprimer" onClick={() => void updateEntity('settings', settings.id, { revenueDeclarations: list.filter((x) => x.id !== d.id) })} className="rounded-md p-1.5 text-ink-3 hover:text-danger"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <TextInput aria-label="Mois" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
        <div className="w-40"><AmountInput aria-label="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <Button icon={<Plus size={16} aria-hidden />} disabled={!cents || !month} onClick={() => { void updateEntity('settings', settings.id, { revenueDeclarations: [...list, { id: newId(), month, amountCents: cents ?? 0, gross: true, note: '' }] }); setAmount('') }}>Ajouter</Button>
      </div>
    </Panel>
  )
}
