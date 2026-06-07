'use client'

import type { VoteMode } from '@/lib/types'

interface ModeSelectorProps {
  mode: VoteMode
  onChange: (mode: VoteMode) => void
  isCreator: boolean
}

const modes: { value: VoteMode; label: string; description: string }[] = [
  { value: 'fibonacci', label: 'Story points', description: '1, 2, 3, 5, 8' },
  { value: 'spike', label: 'Spike', description: '1 to 3 days' },
]

export function ModeSelector({ mode, onChange, isCreator }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => isCreator && onChange(m.value)}
            disabled={!isCreator}
            className={[
              'flex flex-col items-start rounded-lg border px-4 py-2 text-left text-sm transition-all',
              mode === m.value
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : isCreator
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
                  : 'cursor-not-allowed border-slate-200 bg-white text-slate-500',
            ].join(' ')}
          >
            <span className="font-semibold">{m.label}</span>
            <span className="text-xs opacity-70">{m.description}</span>
          </button>
        ))}
      </div>
      {!isCreator && (
        <p className="text-xs text-slate-500">Only the host can change the voting mode.</p>
      )}
    </div>
  )
}
