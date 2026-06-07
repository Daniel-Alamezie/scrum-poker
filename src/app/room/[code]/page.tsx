'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/lib/socket'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ModeSelector } from '@/components/ModeSelector'
import { VotingCards } from '@/components/VotingCards'
import { ParticipantList } from '@/components/ParticipantList'
import { RevealBoard } from '@/components/RevealBoard'
import type { VoteMode, VoteValue } from '@/lib/types'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string).toUpperCase()

  const {
    roomState,
    participantId,
    connected,
    joinRoom,
    castVote,
    revealVotes,
    clearVotes,
    changeMode,
  } = useSocket()

  const [joined, setJoined] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedValue, setSelectedValue] = useState<VoteValue | null>(null)
  const hasAutoJoined = useRef(false)

  // Auto-join if we have a stored name from creating or previously joining
  useEffect(() => {
    if (!connected || hasAutoJoined.current) return
    const storedName = sessionStorage.getItem('scrum-poker-name')
    if (!storedName) return

    hasAutoJoined.current = true
    joinRoom(code, storedName)
      .then(() => setJoined(true))
      .catch(() => {
        hasAutoJoined.current = false
      })
  }, [connected, code, joinRoom])

  // Clear selected card when a new round begins
  const revealed = roomState?.revealed
  useEffect(() => {
    if (revealed === false) setSelectedValue(null)
  }, [revealed])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) return
    setJoining(true)
    setJoinError(null)
    try {
      await joinRoom(code, nameInput.trim())
      sessionStorage.setItem('scrum-poker-name', nameInput.trim())
      setJoined(true)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join room')
    } finally {
      setJoining(false)
    }
  }

  function handleVote(value: VoteValue) {
    setSelectedValue(value)
    castVote(value)
  }

  function handleModeChange(mode: VoteMode) {
    setSelectedValue(null)
    changeMode(mode)
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Join overlay shown when landing directly on a room URL
  if (!joined || !roomState || !participantId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="bg-brand-700 px-6 py-4 shadow-md">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-white opacity-70 transition-opacity hover:opacity-100"
              aria-label="Back to home"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="font-bold text-white">Scrum Poker</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
            <h1 className="mb-1 text-xl font-bold text-slate-900">Join the session</h1>
            <p className="mb-6 text-sm text-slate-600">
              Room code: <span className="font-mono font-semibold text-slate-800">{code}</span>
            </p>

            {joinError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Your name"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Sarah"
                disabled={joining}
                autoFocus
              />
              <Button type="submit" disabled={joining || !nameInput.trim()} className="w-full">
                {joining ? 'Joining...' : 'Join session'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const isCreator = roomState.participants.find(p => p.id === participantId)?.isCreator ?? false
  const votedCount = roomState.participants.filter(p => p.hasVoted).length
  const totalCount = roomState.participants.length
  const canReveal = isCreator && votedCount > 0 && !roomState.revealed

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-brand-700 px-6 py-4 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-white opacity-70 transition-opacity hover:opacity-100"
              aria-label="Back to home"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-lg font-bold text-white">Scrum Poker</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-brand-800 px-3 py-1.5">
              <span className="text-xs font-medium text-brand-100">Room</span>
              <span className="font-mono font-bold tracking-widest text-white">{code}</span>
            </div>

            <button
              onClick={() => handleCopy(code)}
              className="text-xs font-medium text-white opacity-75 transition-opacity hover:opacity-100"
            >
              {copied ? 'Copied!' : 'Copy code'}
            </button>

            <button
              onClick={() => handleCopy(window.location.href)}
              className="text-xs font-medium text-white opacity-75 transition-opacity hover:opacity-100"
            >
              Copy link
            </button>
          </div>
        </div>
      </header>

      {/* Main content with extra bottom padding so the sticky bar never covers it */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-8 pb-28">
        <div className="flex flex-1 flex-col gap-6">
          {/* Mode selector */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700">
              Voting mode
            </h2>
            <ModeSelector mode={roomState.mode} onChange={handleModeChange} isCreator={isCreator} />
          </section>

          {/* Voting / reveal area */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-700">
              {roomState.revealed ? 'Results' : 'Cast your vote'}
            </h2>

            {roomState.revealed ? (
              <RevealBoard
                participants={roomState.participants}
                votes={roomState.votes}
                mode={roomState.mode}
              />
            ) : (
              <VotingCards
                mode={roomState.mode}
                selectedValue={selectedValue}
                disabled={false}
                onVote={handleVote}
              />
            )}
          </section>
        </div>

        {/* Participant sidebar */}
        <aside className="w-72 flex-shrink-0">
          <ParticipantList
            participants={roomState.participants}
            currentParticipantId={participantId}
          />
        </aside>
      </main>

      {/* Sticky creator action bar, always visible at the bottom */}
      {isCreator && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Host controls</span>
            <span className="text-xs text-slate-500">
              {roomState.revealed
                ? 'Clear votes to start the next round'
                : votedCount === 0
                  ? 'Waiting for the first vote'
                  : `${votedCount} of ${totalCount} voted`}
            </span>
          </div>

          {!roomState.revealed ? (
            <Button onClick={revealVotes} disabled={!canReveal}>
              {votedCount === 0 ? 'Reveal votes' : `Reveal votes (${votedCount}/${totalCount})`}
            </Button>
          ) : (
            <Button onClick={clearVotes}>Clear and vote again</Button>
          )}
        </div>
      )}
    </div>
  )
}
