import type { Cents } from '../model'

/**
 * Convertit une saisie utilisateur française en centimes, sans passer par un flottant.
 * Accepte « 53,48 », « 53.48 », « 1 234,5 », « 900 € ». Retourne `null` si la saisie est invalide.
 */
export function parseAmountInput(input: string): Cents | null {
  const cleaned = input.replace(/[\s  €]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const [units = '0', decimals = ''] = cleaned.split('.')
  const cents = Number(units) * 100 + Number(decimals.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

export function isValidCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** Représentation éditable d'un montant (« 53,48 »), pour pré-remplir un champ. */
export function centsToInput(cents: Cents | null): string {
  if (cents === null) return ''
  const units = Math.trunc(cents / 100)
  const rest = Math.abs(cents % 100)
  return rest === 0 ? String(units) : `${units},${String(rest).padStart(2, '0')}`
}
