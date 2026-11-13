import { describe, it, expect } from 'vitest'
import { cardProblem, cardTextSize, formatVote, valuesForMode, voteUnit } from './types'

describe('vote labels', () => {
  it('maps t-shirt values to sizes, smallest first', () => {
    expect(valuesForMode('tshirt').map(v => formatVote(v, 'tshirt'))).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
    ])
  })

  it('keeps numbers and units for the other modes', () => {
    expect(formatVote(1.5, 'spike')).toBe('1.5')
    expect(voteUnit(1, 'spike')).toBe('day')
    expect(voteUnit(5, 'fibonacci')).toBe('points')
    expect(voteUnit(5, 'fibonacci', true)).toBe('pts')
    expect(voteUnit(3, 'tshirt')).toBe('')
  })
})

describe('custom deck helpers', () => {
  const deck = ['Short', 'Tall', 'Grande']

  it('labels custom votes by position', () => {
    expect(valuesForMode('custom', deck)).toEqual([1, 2, 3])
    expect(formatVote(3, 'custom', deck)).toBe('Grande')
    expect(voteUnit(1, 'custom')).toBe('')
  })

  it('explains why a card cannot be added', () => {
    expect(cardProblem(deck, '  ')).toMatch(/Type something/)
    expect(cardProblem(deck, 'tall')).toMatch(/already in the deck/)
    expect(cardProblem(deck, 'x'.repeat(13))).toMatch(/12 characters/)
    expect(cardProblem(['1', '2', '3', '4', '5', '6', '7', '8'], 'nine')).toMatch(/up to 8/)
    expect(cardProblem(deck, 'Venti')).toBeNull()
  })

  it('sizes a whole deck by its longest card', () => {
    expect(cardTextSize(['1', '8'])).toBe('lg')
    expect(cardTextSize(['🐭', '🐘'])).toBe('lg')
    expect(cardTextSize(['XS', 'Tall'])).toBe('md')
    expect(cardTextSize(['Tall', 'Grande'])).toBe('sm')
    expect(cardTextSize(['Grande', 'rtegverecw'])).toBe('xs')
  })
})
