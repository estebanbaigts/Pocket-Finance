import { Cloud, HardDrive } from 'lucide-react'
import { cn } from '@/lib/cn'
import { isCloudConfigured } from '@/services/sync'
import { isNativeApp } from '@/lib/native/platform'
import type { StepProps } from './types'

export function StepMode({ state, update }: StepProps) {
  const cloud = isCloudConfigured()
  const option = (value: 'local' | 'cloud', title: string, text: string, Icon: typeof Cloud, disabled = false) => (
    <button type="button" disabled={disabled} aria-pressed={state.mode === value} onClick={() => update({ mode: value })}
      className={cn('flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors disabled:opacity-50', state.mode === value ? 'border-ink bg-surface' : 'border-line bg-surface hover:border-ink-3')}>
      <Icon size={20} aria-hidden className="mt-0.5 text-ink-2" />
      <span><span className="block text-[15px] font-semibold text-ink">{title}</span><span className="text-[13px] text-ink-3">{text}</span></span>
    </button>
  )
  return (
    <div className="flex flex-col gap-3">
      {option('local', 'Sur cet appareil uniquement', isNativeApp() ? 'Aucun compte nécessaire. Tes données restent sur cet iPhone ; pense aux sauvegardes.' : 'Aucun compte nécessaire. Tes données restent dans ce navigateur ; pense aux sauvegardes.', HardDrive)}
      {option('cloud', 'Synchronisé entre Mac et iPhone', cloud ? 'Connexion par e-mail après l’assistant. Les données restent aussi disponibles hors ligne.' : 'Non configuré : renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (voir le guide). Tu pourras l’activer plus tard.', Cloud, !cloud)}
    </div>
  )
}
