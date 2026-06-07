import { describe, it, expect } from 'vitest'
import {
  createRoom,
  joinRoom,
  castVote,
  revealVotes,
  clearVotes,
  changeMode,
  removeParticipant,
} from './room-manager'

// Helper: the room state from a join result, or throw if it errored.
function stateOf(res: { roomState: unknown } | { error: string }) {
  if ('error' in res) throw new Error(res.error)
  return res.roomState as ReturnType<typeof createRoom>['roomState']
}

describe('room creation and joining', () => {
  it('creates a room with the creator as the only participant and host', () => {
    const { code, roomState } = createRoom('Sarah', 'client-a', 'socket-a')
    expect(code).toHaveLength(6)
    expect(roomState.participants).toHaveLength(1)
    expect(roomState.participants[0].name).toBe('Sarah')
    expect(roomState.participants[0].isCreator).toBe(true)
    expect(roomState.mode).toBe('fibonacci')
    expect(roomState.revealed).toBe(false)
  })

  it('lets a second person join as a non-host participant', () => {
    const { code } = createRoom('Sarah', 'client-a', 'socket-a')
    const state = stateOf(joinRoom(code, 'Tom', 'client-b', 'socket-b'))
    expect(state.participants).toHaveLength(2)
    const tom = state.participants.find(p => p.id === 'client-b')
    expect(tom?.isCreator).toBe(false)
  })

  it('rejects joining a room that does not exist', () => {
    const res = joinRoom('ZZZZZZ', 'Tom', 'client-b', 'socket-b')
    expect('error' in res).toBe(true)
  })
})

describe('host ownership survives navigation', () => {
  it('restores the creator as host when the old socket dies before rejoin', () => {
    const { code } = createRoom('Sarah', 'creator', 'socket-landing')
    // Landing page socket disconnects during navigation.
    removeParticipant('socket-landing')
    // Room page connects on a brand new socket but the same clientId.
    const state = stateOf(joinRoom(code, 'Sarah', 'creator', 'socket-room'))
    const creator = state.participants.find(p => p.id === 'creator')
    expect(creator?.isCreator).toBe(true)
    expect(revealVotes('socket-room')).not.toBeNull()
  })

  it('survives the race where the new socket joins before the old disconnect fires', () => {
    const { code } = createRoom('Sarah', 'creator2', 'socket-landing2')
    joinRoom(code, 'Sarah', 'creator2', 'socket-room2')
    // The stale landing socket disconnect arrives late and must not evict them.
    removeParticipant('socket-landing2')
    const state = stateOf(joinRoom(code, 'Sarah', 'creator2', 'socket-room2'))
    expect(state.participants).toHaveLength(1)
    expect(state.participants[0].isCreator).toBe(true)
    expect(revealVotes('socket-room2')).not.toBeNull()
  })
})

describe('host-only controls', () => {
  it('blocks non-hosts from reveal, clear, and mode change', () => {
    const { code } = createRoom('Sarah', 'creator', 'sock-c')
    joinRoom(code, 'Tom', 'member', 'sock-m')
    expect(revealVotes('sock-m')).toBeNull()
    expect(clearVotes('sock-m')).toBeNull()
    expect(changeMode('sock-m', 'spike')).toBeNull()
  })

  it('allows the host to reveal, clear, and change mode', () => {
    createRoom('Sarah', 'creator', 'sock-c2')
    expect(revealVotes('sock-c2')).not.toBeNull()
    expect(clearVotes('sock-c2')).not.toBeNull()
    expect(changeMode('sock-c2', 'spike')).not.toBeNull()
  })
})

describe('voting visibility', () => {
  it('hides votes until reveal, then exposes them', () => {
    const { code } = createRoom('Sarah', 'creator', 's-c')
    joinRoom(code, 'Tom', 'member', 's-m')
    castVote('s-c', 5)
    const hidden = castVote('s-m', 8)!.roomState
    expect(Object.keys(hidden.votes)).toHaveLength(0)
    expect(hidden.participants.every(p => p.hasVoted)).toBe(true)

    const revealed = revealVotes('s-c')!.roomState
    expect(Object.keys(revealed.votes)).toHaveLength(2)
  })

  it('clears votes and unreveals for the next round', () => {
    const { code } = createRoom('Sarah', 'creator', 's-c2')
    joinRoom(code, 'Tom', 'member', 's-m2')
    castVote('s-c2', 3)
    revealVotes('s-c2')
    const cleared = clearVotes('s-c2')!.roomState
    expect(cleared.revealed).toBe(false)
    expect(Object.keys(cleared.votes)).toHaveLength(0)
    expect(cleared.participants.every(p => !p.hasVoted)).toBe(true)
  })

  it('changing mode resets the round', () => {
    const { code } = createRoom('Sarah', 'creator', 's-c3')
    joinRoom(code, 'Tom', 'member', 's-m3')
    castVote('s-c3', 5)
    revealVotes('s-c3')
    const switched = changeMode('s-c3', 'spike')!.roomState
    expect(switched.mode).toBe('spike')
    expect(switched.revealed).toBe(false)
    expect(Object.keys(switched.votes)).toHaveLength(0)
  })

  it('does not record votes once the round is revealed', () => {
    createRoom('Sarah', 'creator', 's-c4')
    revealVotes('s-c4')
    expect(castVote('s-c4', 5)).toBeNull()
  })
})
