import { describe, it, expect } from 'vitest'
import { formatVote, valuesForMode, voteUnit } from './types'

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
