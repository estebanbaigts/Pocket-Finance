import { useRef, useState } from 'react'
import { Button, ConfirmDialog, Panel, useToast } from '@/components/ui'
import { exportBackup, parseBackup, restoreBackup, type BackupCheck } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  link.click()
  URL.revokeObjectURL(url)
}

/** Sauvegarde JSON indépendante du fournisseur ; restauration validée puis confirmée. */
export function BackupSection() {
  const { settings } = useLedger()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Extract<BackupCheck, { ok: true }> | null>(null)

  const doExport = async () => {
    const backup = await exportBackup(settings?.appName ?? 'Pocket')
    download(`pocket-sauvegarde-${backup.exportedAt.slice(0, 10)}.json`, JSON.stringify(backup, null, 2))
    toast({ title: 'Sauvegarde téléchargée' })
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const check = parseBackup(await file.text())
    if (input.current) input.current.value = ''
    if (!check.ok) toast({ title: check.error, tone: 'error' })
    else setPending(check)
  }

  return (
    <Panel title="Sauvegarde et restauration">
      <p className="mb-3 text-[13px] text-ink-2">Le fichier contient toutes tes données en clair (JSON). Conserve-le dans un endroit sûr : il n’est pas chiffré.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={doExport}>Exporter mes données</Button>
        <Button onClick={() => input.current?.click()}>Restaurer une sauvegarde…</Button>
        <input ref={input} type="file" accept="application/json,.json" className="sr-only" aria-label="Fichier de sauvegarde" onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      <ConfirmDialog open={pending !== null} title="Remplacer les données de cet appareil ?"
        message={pending ? `La sauvegarde du ${new Date(pending.backup.exportedAt).toLocaleString('fr-FR')} contient ${pending.counts.transactions} opérations et ${pending.counts.accounts} comptes. Les données actuelles de cet appareil seront remplacées. Exporte-les d’abord si besoin.` : ''}
        confirmLabel="Restaurer" onCancel={() => setPending(null)}
        onConfirm={async () => { if (pending) { await restoreBackup(pending.backup); toast({ title: 'Sauvegarde restaurée' }) } setPending(null) }} />
    </Panel>
  )
}
