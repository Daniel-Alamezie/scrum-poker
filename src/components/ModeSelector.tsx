'use client'

import type { VoteMode } from '@/lib/types'

interface ModeSelectorProps {
  mode: VoteMode
  customDeck: readonly string[]
  onChange: (mode: VoteMode) => void
  /** Opens the deck editor. Custom always goes through it, so the host sees the cards first. */
  onCustomise: () => void
  isCreator: boolean
}

const presetModes: { value: VoteMode; label: string; description: string }[] = [
  { value: 'fibonacci', label: 'Story points', description: '1, 2, 3, 5, 8' },
  { value: 'spike', label: 'Spike', description: '1 to 3 days' },
  { value: 'tshirt', label: 'T-shirt sizes', description: 'XS to XL' },
]

export function ModeSelector({
  mode,
  customDeck,
  onChange,
  onCustomise,
  isCreator,
}: ModeSelectorProps) {
  const options = [
    ...presetModes,
    {
      value: 'custom' as const,
      label: 'Custom',
      description: customDeck.length > 0 ? customDeck.join(', ') : 'Make your own',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map(m => (
          <button
            key={m.value}
            onClick={() => {
              if (!isCreator) return
              if (m.value === 'custom') onCustomise()
              else onChange(m.value)
            }}
            disabled={!isCreator}
            className={[
              'flex max-w-[12rem] flex-col items-start rounded-lg border px-4 py-2 text-left text-sm transition-all',
              mode === m.value
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : isCreator
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
                  : 'cursor-not-allowed border-slate-200 bg-white text-slate-500',
              m.value === 'custom' && mode !== 'custom' && isCreator ? 'border-dashed' : '',
            ].join(' ')}
          >
            <span className="flex items-center gap-1 font-semibold">
              {m.label}
              {m.value === 'custom' && isCreator && (
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.2 5.2l3.6 3.6M4 20l4.2-.9L19.4 7.9a2.5 2.5 0 00-3.5-3.5L4.9 15.8 4 20z"
                  />
                </svg>
              )}
            </span>
            <span className="w-full truncate text-xs opacity-70">{m.description}</span>
          </button>
        ))}
      </div>
      {!isCreator && (
        <p className="text-xs text-slate-500">Only the host can change the voting mode.</p>
      )}
    </div>
  )
}
