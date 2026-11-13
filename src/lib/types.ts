export type VoteMode = 'fibonacci' | 'spike' | 'tshirt' | 'custom'

export const VOTE_MODES: readonly VoteMode[] = ['fibonacci', 'spike', 'tshirt', 'custom']

export const FIBONACCI_VALUES = [1, 2, 3, 5, 8] as const
export const SPIKE_VALUES = [1, 1.5, 2, 2.5, 3] as const

/**
 * T-shirt sizes travel as numbers (XS = 1 up to XL = 5) so votes, consensus
 * and the reveal work the same in every mode. Only the label differs.
 */
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const
export const TSHIRT_VALUES = [1, 2, 3, 4, 5] as const

export type VoteValue = number

/**
 * A custom deck is the host's own card labels, played left to right. Like
 * T-shirt sizes, votes travel as positions (first card = 1) and are only
 * labelled for display. Shared by the server and the deck editor so both
 * apply the same rules.
 */
export const CUSTOM_DECK_MIN = 2
export const CUSTOM_DECK_MAX = 8
export const CUSTOM_LABEL_MAX = 12

/** Length as people count it, so an emoji is one character, not two. */
export function labelLength(label: string): number {
  return Array.from(label).length
}

/** Why `label` cannot be added to `deck`, or null if it can. */
export function cardProblem(deck: readonly string[], label: string): string | null {
  const trimmed = label.trim()
  if (!trimmed) return 'Type something for the card first'
  if (labelLength(trimmed) > CUSTOM_LABEL_MAX)
    return `Keep cards to ${CUSTOM_LABEL_MAX} characters or fewer`
  if (deck.some(c => c.toLowerCase() === trimmed.toLowerCase()))
    return 'That card is already in the deck'
  if (deck.length >= CUSTOM_DECK_MAX) return `A deck can have up to ${CUSTOM_DECK_MAX} cards`
  return null
}

/** Checks a whole deck sent by a client. Returns the cleaned cards or null. */
export function parseCustomDeck(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null
  const deck: string[] = []
  for (const raw of input) {
    if (typeof raw !== 'string' || cardProblem(deck, raw)) return null
    deck.push(raw.trim())
  }
  return deck.length >= CUSTOM_DECK_MIN ? deck : null
}

export function isVoteMode(value: unknown): value is VoteMode {
  return VOTE_MODES.includes(value as VoteMode)
}

export function valuesForMode(
  mode: VoteMode,
  customDeck: readonly string[] = []
): readonly VoteValue[] {
  if (mode === 'spike') return SPIKE_VALUES
  if (mode === 'tshirt') return TSHIRT_VALUES
  if (mode === 'custom') return customDeck.map((_, i) => i + 1)
  return FIBONACCI_VALUES
}

/** The value as shown on a card: "5", "1.5", "M" or a custom label. */
export function formatVote(
  value: VoteValue,
  mode: VoteMode,
  customDeck: readonly string[] = []
): string {
  if (mode === 'tshirt') return TSHIRT_SIZES[value - 1] ?? String(value)
  if (mode === 'custom') return customDeck[value - 1] ?? String(value)
  return String(value)
}

/** The unit under or after a value. T-shirt sizes and custom cards have none. */
export function voteUnit(value: VoteValue, mode: VoteMode, short = false): string {
  if (mode === 'spike') return value === 1 ? 'day' : 'days'
  if (mode === 'tshirt' || mode === 'custom') return ''
  if (short) return 'pts'
  return value === 1 ? 'point' : 'points'
}

export interface Participant {
  id: string
  name: string
  hasVoted: boolean
  isCreator: boolean
}

export interface RoomState {
  code: string
  participants: Participant[]
  votes: Record<string, VoteValue>
  revealed: boolean
  mode: VoteMode
  /** The host's own cards. Kept when switching away so it can be dealt again. */
  customDeck: string[]
}

/**
 * Text size for a deck's card faces, so "8", "XL" and "Grande" all fit. Sized
 * by the longest label so every card in a deck matches.
 */
export type CardTextSize = 'lg' | 'md' | 'sm' | 'xs'

export function cardTextSize(labels: readonly string[]): CardTextSize {
  const n = Math.max(0, ...labels.map(labelLength))
  if (n <= 2) return 'lg'
  if (n <= 4) return 'md'
  if (n <= 7) return 'sm'
  // Up to 12 characters: smaller still, and the card lets it wrap to a second line.
  return 'xs'
}
