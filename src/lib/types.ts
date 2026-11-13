export type VoteMode = 'fibonacci' | 'spike' | 'tshirt'

export const VOTE_MODES: readonly VoteMode[] = ['fibonacci', 'spike', 'tshirt']

export const FIBONACCI_VALUES = [1, 2, 3, 5, 8] as const
export const SPIKE_VALUES = [1, 1.5, 2, 2.5, 3] as const

/**
 * T-shirt sizes travel as numbers (XS = 1 up to XL = 5) so votes, consensus
 * and the reveal work the same in every mode. Only the label differs.
 */
export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const
export const TSHIRT_VALUES = [1, 2, 3, 4, 5] as const

export type VoteValue = number

export function isVoteMode(value: unknown): value is VoteMode {
  return VOTE_MODES.includes(value as VoteMode)
}

export function valuesForMode(mode: VoteMode): readonly VoteValue[] {
  if (mode === 'spike') return SPIKE_VALUES
  if (mode === 'tshirt') return TSHIRT_VALUES
  return FIBONACCI_VALUES
}

/** The value as shown on a card: "5", "1.5" or "M". */
export function formatVote(value: VoteValue, mode: VoteMode): string {
  if (mode === 'tshirt') return TSHIRT_SIZES[value - 1] ?? String(value)
  return String(value)
}

/** The unit under or after a value. T-shirt sizes have none. */
export function voteUnit(value: VoteValue, mode: VoteMode, short = false): string {
  if (mode === 'spike') return value === 1 ? 'day' : 'days'
  if (mode === 'tshirt') return ''
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
}
