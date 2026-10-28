import type { Cents } from '../model'

/**
 * Règle d'arrondi unique : arrondi au centime le plus proche, demi-centime arrondi vers le haut
 * (en valeur absolue). Toutes les multiplications par un facteur passent par ici.
 */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value))
}

export function sumCents(values: Iterable<number>): number {
  let total = 0
  for (const value of values) total += value
  return total
}

/** Applique un facteur exprimé en pour mille (1200 = ×1,2) sans perte de précision. */
export function applyPermille(cents: Cents, permille: number): Cents {
  return roundHalfUp((cents * permille) / 1000)
}

/** Divise un montant en arrondissant au centime supérieur : utilisé pour les contributions minimales. */
export function divideCeil(cents: Cents, parts: number): Cents {
  if (parts <= 0) return cents
  return Math.ceil(cents / parts)
}
