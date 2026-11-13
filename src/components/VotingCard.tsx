'use client'

import type { CardTextSize } from '@/lib/types'

interface VotingCardProps {
  label: string
  unit: string
  textSize: CardTextSize
  selected: boolean
  disabled: boolean
  onClick: () => void
}

const TEXT_SIZE = { lg: 'text-3xl', md: 'text-xl', sm: 'text-sm', xs: 'text-xs' } as const

export function VotingCard({
  label,
  unit,
  textSize,
  selected,
  disabled,
  onClick,
}: VotingCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative flex h-28 w-20 flex-col items-center justify-center rounded-xl border-2 px-1 transition-all duration-200',
        'cursor-pointer select-none outline-none',
        selected
          ? 'scale-105 border-brand-600 bg-brand-600 text-white shadow-lg vote-card-selected'
          : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-1 hover:border-brand-500 hover:shadow-md',
        disabled ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none' : '',
      ].join(' ')}
    >
      <span
        className={`${TEXT_SIZE[textSize]} w-full [overflow-wrap:anywhere] text-center font-bold leading-none ${
          selected ? 'text-white' : 'text-slate-900'
        }`}
      >
        {label}
      </span>
      {unit && (
        <span
          className={`mt-1 text-xs font-medium uppercase tracking-wide ${
            selected ? 'text-brand-100' : 'text-slate-400'
          }`}
        >
          {unit}
        </span>
      )}
    </button>
  )
}
