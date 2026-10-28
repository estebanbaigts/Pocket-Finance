import { describe, expect, it } from 'vitest'
import { applyPermille, centsToInput, divideCeil, formatCents, parseAmountInput, roundHalfUp } from '@/domain/money'

describe('saisie des montants', () => {
  it('convertit les formats français en centimes entiers', () => {
    expect(parseAmountInput('53,48')).toBe(5348)
    expect(parseAmountInput('171.68')).toBe(17168)
    expect(parseAmountInput('1 234,5')).toBe(123450)
    expect(parseAmountInput('900 €')).toBe(90000)
  })

  it('accepte un montant nul et refuse les saisies invalides', () => {
    expect(parseAmountInput('0')).toBe(0)
    expect(parseAmountInput('-5')).toBeNull()
    expect(parseAmountInput('12,345')).toBeNull()
    expect(parseAmountInput('abc')).toBeNull()
    expect(parseAmountInput('')).toBeNull()
  })

  it('évite les erreurs de flottants (0,1 + 0,2)', () => {
    const total = (parseAmountInput('0,1') ?? 0) + (parseAmountInput('0,2') ?? 0)
    expect(total).toBe(30)
  })

  it('reproduit une saisie éditable', () => {
    expect(centsToInput(5348)).toBe('53,48')
    expect(centsToInput(90000)).toBe('900')
    expect(centsToInput(null)).toBe('')
  })
})

describe('règles d’arrondi', () => {
  it('arrondit au centime, demi-centime vers le haut en valeur absolue', () => {
    expect(roundHalfUp(2.5)).toBe(3)
    expect(roundHalfUp(-2.5)).toBe(-3)
    expect(applyPermille(1001, 1500)).toBe(1502)
  })

  it('divise au centime supérieur', () => {
    expect(divideCeil(1000, 3)).toBe(334)
    expect(divideCeil(1000, 0)).toBe(1000)
  })

  it('formate en euros à la française', () => {
    expect(formatCents(123456).replace(/\s/g, ' ')).toBe('1 234,56 €')
  })
})
