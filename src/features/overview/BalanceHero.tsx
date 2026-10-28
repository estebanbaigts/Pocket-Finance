import { motion } from 'motion/react'
import { Amount, Badge } from '@/components/ui'
import { item } from '@/components/motion'
import type { Financials } from '../data/useFinancials'

/** Réponse à « Combien ai-je réellement aujourd'hui ? » et « Combien me restera-t-il ? ». */
export function BalanceHero({ f }: { f: Financials }) {
  const { balance, forecast } = f
  const noAccount = balance.knownAccounts.length === 0
  return (
    <motion.section variants={item} aria-labelledby="balance-title" className="rounded-lg border border-line bg-surface px-5 py-6 min-[900px]:px-8 min-[900px]:py-8">
      <p id="balance-title" className="eyebrow">Argent réellement disponible</p>
      {noAccount ? (
        <p className="mt-3 text-[15px] text-ink-2">Aucun compte avec un solde connu. Ajoute un compte et son solde pour voir ton argent disponible.</p>
      ) : (
        <Amount cents={balance.knownCents} tone="auto" animated className="mt-2 block text-[44px] font-semibold leading-none tracking-tight min-[900px]:text-[56px]" />
      )}
      <p className="mt-3 text-[13px] text-ink-3">
        Solde calculé : soldes déclarés + opérations payées ou encaissées. Les revenus prévus ne sont pas comptés.
      </p>
      {balance.unknownAccounts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {balance.unknownAccounts.map((a) => <Badge key={a.id} tone="warning">Solde inconnu : {a.name}</Badge>)}
        </div>
      )}
      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
        {(['prudent', 'realistic', 'favorable'] as const).map((name) => {
          const p = forecast.scenarios[name]
          // Sans aucun solde connu, on n'affiche pas un « solde de fin de mois » partant de zéro : seulement la variation.
          const cents = noAccount ? p.endCents - p.startCents : p.endCents
          return (
            <div key={name}>
              <dt className="text-[12px] text-ink-3">{noAccount ? 'Variation prévue' : 'Fin de mois'} · {{ prudent: 'prudent', realistic: 'réaliste', favorable: 'favorable' }[name]}</dt>
              <dd><Amount cents={cents} signed={noAccount} tone="auto" animated className={name === 'realistic' ? 'text-[20px] font-semibold' : 'text-[16px] font-medium text-ink-2'} /></dd>
            </div>
          )
        })}
      </dl>
      {!noAccount && balance.unknownAccounts.length > 0 && <p className="mt-2 text-[12px] text-ink-3">Projection hors comptes au solde inconnu.</p>}
    </motion.section>
  )
}
