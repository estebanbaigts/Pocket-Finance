import { useState } from 'react'
import { AmountInput, Button, Field, Select, TextInput, Toggle, useToast } from '@/components/ui'
import type { AccountKind } from '@/domain/model'
import { centsToInput, parseAmountInput } from '@/domain/money'
import { createEntity, updateEntity, type Draft } from '@/services/storage'

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = { checking: 'Compte courant', savings: 'Épargne', cash: 'Espèces', credit: 'Carte / crédit', other: 'Autre' }

export function blankAccount(today: string): Draft<'accounts'> {
  return { name: '', kind: 'checking', currency: 'EUR', openingBalanceCents: null, openingDate: today, includeInTotals: true, archived: false, origin: 'user_entered' }
}

/** Le solde peut rester inconnu : le compte est alors suivi en mouvements, sans solde inventé. */
export function AccountForm({ initial, id, onDone }: { initial: Draft<'accounts'>; id?: string; onDone: () => void }) {
  const toast = useToast()
  const [name, setName] = useState(initial.name)
  const [kind, setKind] = useState<AccountKind>(initial.kind)
  const [negative, setNegative] = useState((initial.openingBalanceCents ?? 0) < 0)
  const [balance, setBalance] = useState(initial.openingBalanceCents === null ? '' : centsToInput(Math.abs(initial.openingBalanceCents)))
  const [date, setDate] = useState(initial.openingDate ?? '')
  const [include, setInclude] = useState(initial.includeInTotals)
  const parsed = balance === '' ? null : parseAmountInput(balance)
  const invalid = name.trim() === '' || (balance !== '' && parsed === null) || (parsed !== null && !date)

  const submit = async () => {
    const draft: Draft<'accounts'> = {
      ...initial, name: name.trim(), kind, includeInTotals: include,
      openingBalanceCents: parsed === null ? null : negative ? -parsed : parsed, openingDate: date || null,
    }
    try {
      if (id) await updateEntity('accounts', id, draft)
      else await createEntity('accounts', draft)
      onDone()
    } catch {
      toast({ title: 'Enregistrement impossible.', tone: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nom" error={name === '' ? undefined : undefined}>{(p) => <TextInput data-autofocus placeholder="Ex. CIC compte courant" {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
      <Field label="Type">{(p) => <Select {...p} value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>{Object.entries(ACCOUNT_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>}</Field>
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Solde connu" optional hint="Laisse vide si tu ne le connais pas." error={balance !== '' && parsed === null ? 'Montant invalide' : undefined}>
          {(p) => <AmountInput {...p} value={balance} onChange={(e) => setBalance(e.target.value)} />}
        </Field>
        <Field label="À la date du (début de journée)" error={parsed !== null && !date ? 'Indique la date du solde' : undefined}>{(p) => <TextInput type="date" {...p} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      </div>
      <Toggle checked={negative} onChange={setNegative} label="Solde négatif (découvert)" />
      <Toggle checked={include} onChange={setInclude} label="Inclure dans le total" description="Désactive pour un compte que tu ne veux pas compter dans ton argent disponible." />
      <Button variant="primary" size="lg" className="w-full justify-center" disabled={invalid} onClick={submit}>{id ? 'Enregistrer' : 'Ajouter le compte'}</Button>
    </div>
  )
}
