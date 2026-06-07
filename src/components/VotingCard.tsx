'use client'

import type { VoteMode } from '@/lib/types'

interface VotingCardProps {
  value: number
  mode: VoteMode
  selected: boolean
  disabled: boolean
  onClick: () => void
}

function formatUnit(value: number, mode: VoteMode): string {
  if (mode === 'spike') return value === 1 ? 'day' : 'days'
  return 'pts'
}

export function VotingCard({ value, mode, selected, disabled, onClick }: VotingCardProps) {
  const unit = formatUnit(value, mode)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative flex h-28 w-20 flex-col items-center justify-center rounded-xl border-2 transition-all duration-200',
        'cursor-pointer select-none outline-none',
        selected
          ? 'scale-105 border-brand-600 bg-brand-600 text-white shadow-lg vote-card-selected'
          : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-1 hover:border-brand-500 hover:shadow-md',
        disabled ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none' : '',
      ].join(' ')}
    >
      <span
        className={`text-3xl font-bold leading-none ${selected ? 'text-white' : 'text-slate-900'}`}
      >
        {value}
      </span>
      <span
        className={`mt-1 text-xs font-medium uppercase tracking-wide ${
          selected ? 'text-brand-100' : 'text-slate-400'
        }`}
      >
        {unit}
      </span>
    </button>
  )
}
