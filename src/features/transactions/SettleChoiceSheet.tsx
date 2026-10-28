import type { Transaction } from '@/domain/model'
import { formatDateFr } from '@/domain/dates'
import { formatCents } from '@/domain/money'
import { Button, Sheet } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'

/**
 * Règlement d'une échéance dont la date est passée : la date de paiement change l'effet sur le
 * solde (avant la date du solde déclaré, le paiement est supposé déjà inclus). On demande donc.
 */
export function SettleChoiceSheet({ txn, today, onChoose, onClose }: { txn: Transaction | null; today: string; onChoose: (date: string) => void; onClose: () => void }) {
  const { accounts } = useLedger()
  const account = accounts.find((a) => a.id === txn?.accountId)
  const beforeOpening = txn && account?.openingDate && txn.date < account.openingDate
  return (
    <Sheet open={txn !== null} onClose={onClose} title="Quand a-t-elle été réglée ?" description={txn ? `${txn.description || 'Échéance'} · ${formatCents(txn.amountCents)}` : undefined}>
      {txn && (
        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" className="w-full justify-center" data-autofocus onClick={() => onChoose(txn.date)}>À la date prévue ({formatDateFr(txn.date, 'day')})</Button>
          <Button size="lg" className="w-full justify-center" onClick={() => onChoose(today)}>Aujourd’hui ({formatDateFr(today, 'day')})</Button>
          {beforeOpening && account?.openingDate && (
            <p className="text-[12px] text-ink-3">Le {formatDateFr(txn.date, 'day')} est antérieur au solde déclaré de « {account.name} » ({formatDateFr(account.openingDate, 'day')}) : un paiement à cette date est considéré comme déjà inclus dans ce solde. Choisis « Aujourd’hui » s’il n’a pas encore été débité.</p>
          )}
        </div>
      )}
    </Sheet>
  )
}
