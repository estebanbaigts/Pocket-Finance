import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { RecurringRule } from '@/domain/model'
import { formatDateFr, todayIso } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { frequencyLabel, monthlyEquivalent, nextOccurrence } from '@/domain/recurrence'
import { Amount, Badge, ConfirmDialog, EmptyState, Sheet, useToast } from '@/components/ui'
import { softDelete } from '@/services/storage'
import { RULE_KIND_LABEL } from './ruleSchema'
import { RuleForm } from './RuleForm'
import { toRuleDraft } from './ruleDraft'

/** Règles récurrentes : fréquence, prochaine échéance, équivalent mensuel, statut de confirmation. */
export function RuleList({ rules }: { rules: RecurringRule[] }) {
  const toast = useToast()
  const [editing, setEditing] = useState<RecurringRule | null>(null)
  const [deleting, setDeleting] = useState<RecurringRule | null>(null)
  const today = todayIso()
  if (rules.length === 0) return <EmptyState title="Aucune échéance récurrente">Ajoute ton loyer, tes abonnements ou tes crédits pour qu’ils apparaissent automatiquement chaque mois.</EmptyState>

  return (
    <>
      <ul className="divide-y divide-[var(--border)]">
        {rules.map((rule) => {
          const next = rule.startDate ? nextOccurrence(rule, today) : null
          return (
            <li key={rule.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{rule.label}</p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3">
                  <span>{RULE_KIND_LABEL[rule.kind]} · {frequencyLabel(rule)}</span>
                  {next && <span>Prochaine : {rule.dayUnknown ? `avant le ${formatDateFr(next, 'day')}` : formatDateFr(next, 'day')}</span>}
                  {!rule.startDate && <Badge tone="warning">Calendrier à confirmer</Badge>}
                  {!rule.active && <Badge>Inactive</Badge>}
                  {rule.amountMinCents !== null && <Badge tone="info">{formatCents(rule.amountMinCents)} à {formatCents(rule.amountCents)}</Badge>}
                  {rule.origin === 'user_declared' && <Badge>Déclaré</Badge>}
                </p>
              </div>
              <div className="text-right">
                <Amount cents={rule.amountCents} className="block text-[14px] font-medium" />
                {rule.frequency !== 'monthly' && <span className="num text-[11px] text-ink-3">≈ {formatCents(monthlyEquivalent(rule))}/mois</span>}
              </div>
              <button type="button" aria-label={`Modifier ${rule.label}`} onClick={() => setEditing(rule)} className="rounded-md p-2 text-ink-3 hover:bg-surface-2 hover:text-ink"><Pencil size={15} /></button>
              <button type="button" aria-label={`Supprimer ${rule.label}`} onClick={() => setDeleting(rule)} className="rounded-md p-2 text-ink-3 hover:bg-surface-2 hover:text-danger"><Trash2 size={15} /></button>
            </li>
          )
        })}
      </ul>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Modifier l’échéance" size="lg">
        {editing && <RuleForm key={editing.id} initial={toRuleDraft(editing)} id={editing.id} onDone={() => { toast({ title: 'Échéance mise à jour' }); setEditing(null) }} />}
      </Sheet>
      <ConfirmDialog open={deleting !== null} title="Supprimer cette règle ?" message="Les échéances déjà générées restent dans tes opérations (tu peux les supprimer une à une). Aucune nouvelle échéance ne sera créée."
        confirmLabel="Supprimer la règle" onCancel={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await softDelete('recurringRules', deleting.id); setDeleting(null); toast({ title: 'Règle supprimée' }) }} />
    </>
  )
}
