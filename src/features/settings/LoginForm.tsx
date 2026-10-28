import { useState } from 'react'
import { Button, Field, TextInput, useToast } from '@/components/ui'
import { NATIVE_AUTH_REDIRECT } from '@/lib/native/authRedirect'
import { isNativeApp } from '@/lib/native/platform'
import { sendLoginEmail } from '@/services/sync'

/**
 * Connexion sans mot de passe par lien e-mail. Dans l'app iOS, le lien rouvre l'application
 * (lien profond) ; sur le web, il rouvre cette page.
 */
export function LoginForm() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    const result = await sendLoginEmail(email.trim(), isNativeApp() ? NATIVE_AUTH_REDIRECT : window.location.origin)
    setBusy(false)
    if (result.ok) setSent(true)
    else toast({ title: result.error ?? 'Erreur', tone: 'error' })
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2 text-[13px] text-ink-2">
        <p>E-mail envoyé à {email}. {isNativeApp() ? 'Ouvre le lien depuis l’app Mail de cet iPhone : Pocket se rouvrira connecté.' : 'Ouvre le lien sur cet appareil pour te connecter.'}</p>
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setSent(false)}>Renvoyer ou changer d’adresse</Button>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Adresse e-mail" className="min-w-[220px] flex-1">{(p) => <TextInput type="email" autoComplete="email" inputMode="email" {...p} value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
      <Button variant="primary" disabled={busy || !email.includes('@')} onClick={send}>Recevoir un lien de connexion</Button>
    </div>
  )
}
