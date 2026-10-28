import { useState } from 'react'
import { Field, Panel, Segmented, TextInput, useToast } from '@/components/ui'
import { applyTheme, storedTheme, type ThemeChoice } from '@/lib/theme'
import { updateEntity } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'

export function GeneralSection() {
  const { settings } = useLedger()
  const toast = useToast()
  const [theme, setTheme] = useState<ThemeChoice>(storedTheme())
  const [name, setName] = useState(settings?.appName ?? '')
  if (!settings) return null
  return (
    <Panel title="Général">
      <div className="flex flex-col gap-4">
        <Field label="Nom affiché" hint="Le nom par défaut se règle aussi avec VITE_APP_NAME.">
          {(p) => <TextInput {...p} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} onBlur={async () => { if (name.trim() && name !== settings.appName) { await updateEntity('settings', settings.id, { appName: name.trim() }); document.title = name.trim(); toast({ title: 'Nom mis à jour' }) } }} />}
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink-2">Apparence (cet appareil)</p>
          <Segmented label="Apparence" value={theme} onChange={(v) => { setTheme(v); applyTheme(v) }} options={[{ value: 'system', label: 'Système' }, { value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]} />
        </div>
      </div>
    </Panel>
  )
}
