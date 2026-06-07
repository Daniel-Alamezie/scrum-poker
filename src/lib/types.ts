export type VoteMode = 'fibonacci' | 'spike'

export const FIBONACCI_VALUES = [1, 2, 3, 5, 8] as const
export const SPIKE_VALUES = [1, 1.5, 2, 2.5, 3] as const

export type VoteValue = number

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
