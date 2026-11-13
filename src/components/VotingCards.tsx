'use client'

import { cardTextSize, formatVote, valuesForMode, voteUnit } from '@/lib/types'
import type { VoteMode, VoteValue } from '@/lib/types'
import { VotingCard } from './VotingCard'

interface VotingCardsProps {
  mode: VoteMode
  customDeck: readonly string[]
  selectedValue: VoteValue | null
  disabled: boolean
  onVote: (value: VoteValue) => void
}

export function VotingCards({
  mode,
  customDeck,
  selectedValue,
  disabled,
  onVote,
}: VotingCardsProps) {
  const values = valuesForMode(mode, customDeck)
  const textSize = cardTextSize(values.map(v => formatVote(v, mode, customDeck)))
  const selectedUnit = selectedValue === null ? '' : voteUnit(selectedValue, mode)
  // A new mode or deck remounts the row, so the cards deal in again on every screen.
  const deckKey = `${mode}:${customDeck.join('|')}`

  return (
    <div className="flex flex-col items-center gap-6">
      <div key={deckKey} className="flex flex-wrap justify-center gap-3">
        {values.map((value, index) => (
          <div key={value} className="deal-card" style={{ animationDelay: `${index * 70}ms` }}>
            <VotingCard
              label={formatVote(value, mode, customDeck)}
              unit={voteUnit(value, mode, true)}
              textSize={textSize}
              selected={selectedValue === value}
              disabled={disabled}
              onClick={() => onVote(value)}
            />
          </div>
        ))}
      </div>

      {selectedValue !== null && !disabled && (
        <p className="text-center text-sm text-slate-600">
          You voted{' '}
          <strong className="text-brand-700">
            {formatVote(selectedValue, mode, customDeck)}
            {selectedUnit && ` ${selectedUnit}`}
          </strong>
          . You can change your vote until the host reveals.
        </p>
      )}

      {disabled && (
        <p className="text-center text-sm text-slate-500">
          Votes are locked while results are showing.
        </p>
      )}
    </div>
  )
}
