'use client'

import { FIBONACCI_VALUES, SPIKE_VALUES } from '@/lib/types'
import type { VoteMode, VoteValue } from '@/lib/types'
import { VotingCard } from './VotingCard'

interface VotingCardsProps {
  mode: VoteMode
  selectedValue: VoteValue | null
  disabled: boolean
  onVote: (value: VoteValue) => void
}

export function VotingCards({ mode, selectedValue, disabled, onVote }: VotingCardsProps) {
  const values = mode === 'fibonacci' ? [...FIBONACCI_VALUES] : [...SPIKE_VALUES]

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {values.map(value => (
          <VotingCard
            key={value}
            value={value}
            mode={mode}
            selected={selectedValue === value}
            disabled={disabled}
            onClick={() => onVote(value)}
          />
        ))}
      </div>

      {selectedValue !== null && !disabled && (
        <p className="text-center text-sm text-slate-600">
          You voted{' '}
          <strong className="text-brand-700">
            {selectedValue}
            {mode === 'spike' ? (selectedValue === 1 ? ' day' : ' days') : ' points'}
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
