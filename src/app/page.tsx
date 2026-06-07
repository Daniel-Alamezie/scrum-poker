'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/lib/socket'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Tab = 'create' | 'join'

export default function HomePage() {
  const router = useRouter()
  const { createRoom, joinRoom } = useSocket()

  const [tab, setTab] = useState<Tab>('create')
  const [createName, setCreateName] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const code = await createRoom(createName.trim())
      sessionStorage.setItem('scrum-poker-name', createName.trim())
      router.push(`/room/${code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinName.trim() || !joinCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      await joinRoom(joinCode.trim().toUpperCase(), joinName.trim())
      sessionStorage.setItem('scrum-poker-name', joinName.trim())
      router.push(`/room/${joinCode.trim().toUpperCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="bg-brand-700 px-6 py-4 shadow-md">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <span className="text-2xl text-white">&#9824;</span>
          <span className="text-xl font-bold tracking-tight text-white">Scrum Poker</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">Plan together, in real time</h1>
            <p className="text-slate-600">
              Create a session and share the link with your team, or join one with a code.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => {
                  setTab('create')
                  setError(null)
                }}
                className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-colors ${
                  tab === 'create'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Start a session
              </button>
              <button
                onClick={() => {
                  setTab('join')
                  setError(null)
                }}
                className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-colors ${
                  tab === 'join'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Join a session
              </button>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {tab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    label="Your name"
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    placeholder="e.g. Sarah"
                    disabled={loading}
                    autoFocus
                  />
                  <Button type="submit" disabled={loading || !createName.trim()} className="w-full">
                    {loading ? 'Creating...' : 'Create session'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <Input
                    label="Your name"
                    value={joinName}
                    onChange={e => setJoinName(e.target.value)}
                    placeholder="e.g. Tom"
                    disabled={loading}
                  />
                  <Input
                    label="Room code"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2C3"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !joinName.trim() || !joinCode.trim()}
                    className="w-full"
                  >
                    {loading ? 'Joining...' : 'Join session'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Open source planning poker. No database, no sign-up.
          </p>
        </div>
      </main>
    </div>
  )
}
