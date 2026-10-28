import { Plus, X } from 'lucide-react'
import { AmountInput, Button, Field, Select, TextInput } from '@/components/ui'
import { newId } from '@/services/storage'
import type { AccountInput } from '../state'
import type { StepProps } from './types'

export function StepAccounts({ state, update }: StepProps) {
  const set = (key: string, patch: Partial<AccountInput>) => update({ accounts: state.accounts.map((a) => (a.key === key ? { ...a, ...patch } : a)) })
  return (
    <div className="flex flex-col gap-4">
      <Field label="Date de départ du suivi" hint="Les soldes saisis sont ceux de ce jour, en début de journée.">
        {(p) => <TextInput type="date" {...p} value={state.trackingStart} onChange={(e) => update({ trackingStart: e.target.value })} />}
      </Field>
      {state.accounts.map((a) => (
        <div key={a.key} className="rounded-lg border border-line bg-surface p-4">
          <div className="grid gap-3 min-[600px]:grid-cols-[1.4fr_1fr_1fr]">
            <Field label="Compte">{(p) => <TextInput {...p} value={a.name} onChange={(e) => set(a.key, { name: e.target.value })} />}</Field>
            <Field label="Type">{(p) => <Select {...p} value={a.kind} onChange={(e) => set(a.key, { kind: e.target.value as AccountInput['kind'] })}><option value="checking">Courant</option><option value="savings">Épargne</option><option value="cash">Espèces</option></Select>}</Field>
            <Field label="Solde actuel" optional hint="Vide = inconnu">{(p) => <AmountInput {...p} value={a.balance} onChange={(e) => set(a.key, { balance: e.target.value })} />}</Field>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13px] text-ink-2"><input type="checkbox" className="h-4 w-4 accent-[var(--danger)]" checked={a.negative} onChange={(e) => set(a.key, { negative: e.target.checked })} />Solde négatif (découvert)</label>
            {state.accounts.length > 1 && <button type="button" aria-label={`Retirer ${a.name}`} onClick={() => update({ accounts: state.accounts.filter((x) => x.key !== a.key) })} className="rounded-md p-1.5 text-ink-3 hover:bg-surface-2"><X size={16} /></button>}
          </div>
        </div>
      ))}
      <Button variant="ghost" icon={<Plus size={16} aria-hidden />} className="self-start" onClick={() => update({ accounts: [...state.accounts, { key: newId(), name: '', kind: 'savings', balance: '', negative: false }] })}>Ajouter un compte</Button>
    </div>
  )
}
