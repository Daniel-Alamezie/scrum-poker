'use client'

import { useMemo } from 'react'
import type { Participant, VoteMode, VoteValue } from '@/lib/types'

interface RevealBoardProps {
  participants: Participant[]
  votes: Record<string, VoteValue>
  mode: VoteMode
}

// Shown when the room cannot agree on a single number. Light, but still
// professional. No em dashes by design.
const NO_CONSENSUS_LINES = [
  "Okay, let's discuss",
  'Time to deliberate',
  'Let the council begin',
  'Split decision, make your case',
  'The room is divided, talk it out',
  'No clear winner, over to the team',
]

function unitLabel(value: VoteValue, mode: VoteMode): string {
  if (mode === 'spike') return value === 1 ? 'day' : 'days'
  return value === 1 ? 'point' : 'points'
}

/**
 * The single most frequent value, or null when there is a tie for the top
 * spot (which means the room has not landed on a common number).
 */
function getCommonValue(votes: VoteValue[]): VoteValue | null {
  if (votes.length === 0) return null
  const freq = new Map<VoteValue, number>()
  for (const v of votes) freq.set(v, (freq.get(v) ?? 0) + 1)
  const max = Math.max(...freq.values())
  const top = [...freq.entries()].filter(([, c]) => c === max).map(([v]) => v)
  return top.length === 1 ? top[0] : null
}

export function RevealBoard({ participants, votes, mode }: RevealBoardProps) {
  const voteValues = useMemo(
    () => participants.map(p => votes[p.id]).filter((v): v is VoteValue => v !== undefined),
    [participants, votes]
  )

  const commonValue = useMemo(() => getCommonValue(voteValues), [voteValues])
  const abstained = participants.filter(p => votes[p.id] === undefined)
  const isUnanimous = voteValues.length > 1 && new Set(voteValues).size === 1

  // Stable pick so the ice-breaker line does not flicker on re-render while
  // the same round is showing. Seeded from the votes themselves.
  const iceBreaker = useMemo(() => {
    const seed = voteValues.reduce((a, b) => a + b, 0) + voteValues.length
    return NO_CONSENSUS_LINES[seed % NO_CONSENSUS_LINES.length]
  }, [voteValues])

  return (
    <div className="flex flex-col gap-8">
      {/* Headline conclusion */}
      {commonValue !== null ? (
        <div
          className={`rounded-2xl border p-6 text-center ${
            isUnanimous ? 'border-brand-200 bg-brand-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p
            className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
              isUnanimous ? 'text-brand-700' : 'text-amber-700'
            }`}
          >
            {isUnanimous ? 'Unanimous' : 'The room agrees on'}
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={`text-5xl font-bold leading-none ${
                isUnanimous ? 'text-brand-700' : 'text-amber-700'
              }`}
            >
              {commonValue}
            </span>
            <span
              className={`text-xl font-semibold ${
                isUnanimous ? 'text-brand-600' : 'text-amber-600'
              }`}
            >
              {unitLabel(commonValue, mode)}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-6 text-center">
          <div className="mb-2 text-3xl">&#129336;</div>
          <p className="text-2xl font-bold text-slate-700">{iceBreaker}</p>
          <p className="mt-1 text-sm text-slate-500">
            No single number stood out. Compare the cards below and resolve it together.
          </p>
        </div>
      )}

      {/* Per-participant revealed cards */}
      <div className="flex flex-wrap justify-center gap-4">
        {participants.map((participant, index) => {
          const vote = votes[participant.id]
          const hasVote = vote !== undefined
          const isCommon = commonValue !== null && vote === commonValue

          return (
            <div
              key={participant.id}
              className="reveal-card flex flex-col items-center gap-2"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="card-scene h-28 w-20">
                <div className="card-flipper is-flipped">
                  <div className="card-face flex items-center justify-center border-2 border-slate-200 bg-slate-100">
                    <span className="text-2xl font-bold text-slate-300">?</span>
                  </div>

                  <div
                    className={`card-face card-face--back flex flex-col items-center justify-center border-2 ${
                      !hasVote
                        ? 'border-slate-200 bg-slate-100'
                        : isCommon
                          ? 'border-brand-600 bg-brand-600'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    {hasVote ? (
                      <>
                        <span
                          className={`text-3xl font-bold leading-none ${
                            isCommon ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {vote}
                        </span>
                        <span
                          className={`mt-1 text-xs font-medium uppercase tracking-wide ${
                            isCommon ? 'text-brand-100' : 'text-slate-400'
                          }`}
                        >
                          {mode === 'spike' ? (vote === 1 ? 'day' : 'days') : 'pts'}
                        </span>
                      </>
                    ) : (
                      <span className="px-2 text-center text-xs text-slate-400">No vote</span>
                    )}
                  </div>
                </div>
              </div>

              <span className="max-w-20 truncate text-center text-xs font-medium text-slate-700">
                {participant.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Secondary stats. Deliberately no average, so the headline number is
          the only suggested estimate the room sees. */}
      <div className="flex flex-wrap justify-center gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Votes in</p>
          <p className="text-lg font-bold text-slate-700">{voteValues.length}</p>
        </div>

        {abstained.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Abstained</p>
            <p className="text-lg font-bold text-slate-700">{abstained.length}</p>
          </div>
        )}
      </div>
    </div>
  )
}
