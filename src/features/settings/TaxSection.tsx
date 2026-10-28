import { Plus, Trash2 } from 'lucide-react'
import type { TaxParameter } from '@/domain/model'
import { Badge, Button, Panel, Select, TextInput } from '@/components/ui'
import { newId, updateEntity } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'

/** Paramètres fiscaux saisis par l'utilisateur : taux, source, date de vérification, statut. Aucun taux par défaut. */
export function TaxSection() {
  const { settings } = useLedger()
  if (!settings) return null
  const params = settings.taxParameters
  const save = (next: TaxParameter[]) => void updateEntity('settings', settings.id, { taxParameters: next })
  const set = (id: string, patch: Partial<TaxParameter>) => save(params.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  return (
    <Panel title="Paramètres fiscaux" eyebrow="Prélèvements, cotisations">
      <p className="mb-3 text-[13px] text-ink-2">Aucun taux n’est fourni par défaut : renseigne-les depuis une source officielle (ex. urssaf.fr, impots.gouv.fr) et note la date de vérification.</p>
      <ul className="flex flex-col gap-3">
        {params.map((p) => (
          <li key={p.id} className="grid gap-2 rounded-md border border-line p-3 min-[700px]:grid-cols-[1.4fr_0.7fr_1.4fr_1fr_1fr_auto]">
            <TextInput aria-label="Libellé" placeholder="Ex. Cotisations micro-entreprise" defaultValue={p.label} onBlur={(e) => set(p.id, { label: e.target.value })} />
            <TextInput aria-label="Taux en %" inputMode="decimal" placeholder="Taux %" defaultValue={p.rateBps === null ? '' : String(p.rateBps / 100).replace('.', ',')} onBlur={(e) => { const v = e.target.value.replace(',', '.'); set(p.id, { rateBps: v === '' || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 100) }) }} />
            <TextInput aria-label="Source" placeholder="Source" defaultValue={p.source} onBlur={(e) => set(p.id, { source: e.target.value })} />
            <TextInput aria-label="Vérifié le" type="date" defaultValue={p.verifiedAt ?? ''} onBlur={(e) => set(p.id, { verifiedAt: e.target.value || null })} />
            <Select aria-label="Statut" value={p.status} onChange={(e) => set(p.id, { status: e.target.value as TaxParameter['status'] })}><option value="unconfirmed">À confirmer</option><option value="confirmed">Confirmé</option></Select>
            <button type="button" aria-label="Supprimer" onClick={() => save(params.filter((x) => x.id !== p.id))} className="rounded-md p-2 text-ink-3 hover:text-danger"><Trash2 size={15} /></button>
            {p.status === 'unconfirmed' && <Badge tone="warning" className="self-start">Non confirmé</Badge>}
          </li>
        ))}
      </ul>
      <Button className="mt-3" icon={<Plus size={16} aria-hidden />} onClick={() => save([...params, { id: newId(), label: '', rateBps: null, source: '', verifiedAt: null, status: 'unconfirmed' }])}>Ajouter un paramètre</Button>
    </Panel>
  )
}
