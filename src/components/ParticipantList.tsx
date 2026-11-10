'use client'

import { useLayoutEffect, useRef } from 'react'
import type { Participant } from '@/lib/types'
import { playHostHandover } from '@/lib/host-handover-animation'

interface ParticipantListProps {
  participants: Participant[]
  currentParticipantId: string
  /** Only passed for the current host, who can hand the role to someone else. */
  onMakeHost?: (participantId: string, name: string) => void
}

export function ParticipantList({
  participants,
  currentParticipantId,
  onMakeHost,
}: ParticipantListProps) {
  const votedCount = participants.filter(p => p.hasVoted).length
  const hostId = participants.find(p => p.isCreator)?.id ?? null
  const previousHostId = useRef<string | null>(null)
  const nameEls = useRef(new Map<string, HTMLElement>())
  const badgeEls = useRef(new Map<string, HTMLElement>())

  // Celebrate a handover on every screen in the room, not just the host's.
  // The first render (joining a room) only records who the host is.
  useLayoutEffect(() => {
    const previous = previousHostId.current
    previousHostId.current = hostId
    if (!previous || !hostId || previous === hostId) return
    const badge = badgeEls.current.get(hostId)
    if (!badge) return
    return playHostHandover(nameEls.current.get(previous) ?? null, badge)
  }, [hostId])

  function register(map: Map<string, HTMLElement>, id: string) {
    return (el: HTMLElement | null) => {
      if (el) map.set(id, el)
      else map.delete(id)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-sm font-semibold text-slate-800">Participants</span>
        <span className="text-xs text-slate-500">
          {votedCount} of {participants.length} voted
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {participants.map(participant => (
          <li key={participant.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
                  participant.isCreator
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {participant.name.charAt(0)}
              </span>

              <span
                ref={register(nameEls.current, participant.id)}
                className="truncate text-sm font-medium text-slate-800"
              >
                {participant.name}
                {participant.id === currentParticipantId && (
                  <span className="font-normal text-slate-400"> (you)</span>
                )}
              </span>

              {participant.isCreator && (
                <span
                  ref={register(badgeEls.current, participant.id)}
                  className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-brand-700"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z" />
                  </svg>
                  host
                </span>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {onMakeHost && !participant.isCreator && (
                <button
                  type="button"
                  onClick={() => onMakeHost(participant.id, participant.name)}
                  aria-label={`Make ${participant.name} the host`}
                  className="text-xs font-medium text-brand-700 underline hover:no-underline"
                >
                  Make host
                </button>
              )}
              <VoteStatus hasVoted={participant.hasVoted} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VoteStatus({ hasVoted }: { hasVoted: boolean }) {
  if (hasVoted) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Voted
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Waiting
    </span>
  )
}
