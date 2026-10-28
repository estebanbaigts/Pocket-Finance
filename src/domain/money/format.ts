const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const euroRound = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

/** « 1 234,56 € ». La division par 100 n'intervient qu'à l'affichage. */
export function formatCents(cents: number): string {
  return euro.format(cents / 100)
}

/** « +1 234,56 € » / « −12,00 € », pour les flux. */
export function formatSignedCents(cents: number): string {
  const sign = cents > 0 ? '+' : cents < 0 ? '−' : ''
  return `${sign}${euro.format(Math.abs(cents) / 100)}`
}

/** « 1 235 € » : montants arrondis pour les graphiques et résumés. */
export function formatCentsRounded(cents: number): string {
  return euroRound.format(Math.round(cents / 100))
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio)
}
