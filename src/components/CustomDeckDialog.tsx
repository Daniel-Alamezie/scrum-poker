'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  CUSTOM_DECK_MAX,
  CUSTOM_DECK_MIN,
  CUSTOM_LABEL_MAX,
  cardProblem,
  cardTextSize,
} from '@/lib/types'

interface CustomDeckDialogProps {
  open: boolean
  /** The room's current deck, so the host edits rather than starts over. */
  initialDeck: readonly string[]
  /** Resolves once the room has the deck; rejects with a message to show. */
  onDeal: (labels: string[]) => Promise<void>
  onCancel: () => void
}

// Starting points. Each one runs smallest to biggest, like the built-in modes.
const PRESETS: { name: string; cards: string[] }[] = [
  { name: '🐾 Animals', cards: ['🐭', '🐱', '🐶', '🐴', '🐘'] },
  { name: '☕ Coffee', cards: ['Short', 'Tall', 'Grande', 'Venti'] },
  { name: '🌶️ Spice', cards: ['Mild', 'Medium', 'Hot', '🔥🔥🔥'] },
  { name: '😬 Gut feel', cards: ['Easy', 'Hmm', 'Yikes'] },
]

const PREVIEW_TEXT = {
  lg: 'text-2xl',
  md: 'text-base',
  sm: 'text-[11px]',
  xs: 'text-[10px]',
} as const

/**
 * Lets the host build their own deck: type cards one at a time or start from
 * a preset, see them laid out as real cards, reorder or remove them, then deal
 * them to the room. Same native <dialog> pattern as the make-host confirm.
 */
export function CustomDeckDialog({ open, initialDeck, onDeal, onCancel }: CustomDeckDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [deck, setDeck] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(0)
  const [newest, setNewest] = useState<string | null>(null)
  const [dealing, setDealing] = useState(false)
  // True once the host has changed anything. Closing the dialog (a stray click
  // outside, Escape, Close) keeps those edits; only dealing or Start over clears them.
  const [edited, setEdited] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (!edited) {
        setDeck([...initialDeck])
        setDraft('')
      }
      setError(null)
      setNewest(null)
      setDealing(false)
      dialog.showModal()
      inputRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    // Only runs when the dialog opens or closes, not on every room update while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function fail(message: string) {
    setError(message)
    setShake(n => n + 1)
  }

  function addCard(e: React.FormEvent) {
    e.preventDefault()
    const problem = cardProblem(deck, draft)
    if (problem) return fail(problem)
    const card = draft.trim()
    setDeck([...deck, card])
    setNewest(card)
    setDraft('')
    setError(null)
    setEdited(true)
  }

  function removeCard(index: number) {
    setDeck(deck.filter((_, i) => i !== index))
    setError(null)
    setEdited(true)
  }

  function moveCard(index: number, by: -1 | 1) {
    const next = [...deck]
    const target = index + by
    ;[next[index], next[target]] = [next[target], next[index]]
    setDeck(next)
    setEdited(true)
  }

  function applyPreset(cards: string[]) {
    setDeck(cards)
    setNewest(null)
    setError(null)
    setEdited(true)
    inputRef.current?.focus()
  }

  function startOver() {
    setDeck([...initialDeck])
    setDraft('')
    setNewest(null)
    setError(null)
    setEdited(false)
    inputRef.current?.focus()
  }

  async function deal() {
    if (dealing) return
    if (deck.length < CUSTOM_DECK_MIN) {
      return fail(`Add at least ${CUSTOM_DECK_MIN} cards to deal`)
    }
    setDealing(true)
    try {
      await onDeal(deck)
      setEdited(false)
    } catch (err) {
      fail(err instanceof Error ? err.message : 'The cards could not be dealt. Try again.')
    } finally {
      setDealing(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={e => {
        e.preventDefault()
        onCancel()
      }}
      onClick={handleBackdropClick}
      aria-labelledby="deck-title"
      className="deck-dialog w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 shadow-2xl"
    >
      {open && (
        <div className="p-6">
          <h2 id="deck-title" className="text-lg font-bold text-slate-900">
            Build your own deck
          </h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">
            Anything goes: sizes, emoji, coffee orders. Cards play left to right, so put the
            smallest first.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p.cards)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                {p.name}
              </button>
            ))}
          </div>

          <form onSubmit={addCard} className="mb-1 flex gap-2">
            <input
              key={shake}
              ref={inputRef}
              value={draft}
              onChange={e => {
                setDraft(e.target.value)
                setEdited(true)
                if (error) setError(null)
              }}
              placeholder="Type a card and press Enter"
              aria-label="New card"
              aria-invalid={error ? true : undefined}
              aria-describedby="deck-error"
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30'
              } ${shake > 0 ? 'input-shake' : ''}`}
            />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
          <p id="deck-error" role="status" className="mb-3 min-h-5 text-xs text-red-600">
            {error}
          </p>

          <div className="mb-1 flex min-h-[7.5rem] flex-wrap content-start gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
            {deck.length === 0 ? (
              <p className="m-auto text-center text-sm text-slate-400">
                Your cards will appear here
              </p>
            ) : (
              deck.map((card, i) => (
                <div
                  key={card}
                  className={`group relative flex h-24 w-16 flex-col items-center justify-center rounded-lg border-2 border-slate-200 bg-white px-1 shadow-sm ${
                    card === newest ? 'deck-card-new' : ''
                  }`}
                >
                  <span
                    className={`${PREVIEW_TEXT[cardTextSize(deck)]} w-full [overflow-wrap:anywhere] text-center font-bold leading-none text-slate-900`}
                  >
                    {card}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCard(i)}
                    aria-label={`Remove ${card}`}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs leading-none text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => moveCard(i, -1)}
                        aria-label={`Move ${card} left`}
                        className="rounded px-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        ‹
                      </button>
                    )}
                    {i < deck.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveCard(i, 1)}
                        aria-label={`Move ${card} right`}
                        className="rounded px-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        ›
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="mb-6 text-xs text-slate-500">
            {deck.length} of {CUSTOM_DECK_MAX} cards, up to {CUSTOM_LABEL_MAX} characters each.
            Hover a card to move or remove it.
          </p>

          <div className="flex items-center gap-2">
            {edited && (
              <button
                type="button"
                onClick={startOver}
                className="mr-auto text-xs font-medium text-slate-500 underline hover:text-slate-800 hover:no-underline"
              >
                Start over
              </button>
            )}
            <Button variant="secondary" onClick={onCancel} className="ml-auto">
              Close
            </Button>
            <Button onClick={deal} aria-busy={dealing}>
              {dealing ? 'Dealing…' : 'Deal these cards'}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
