import { describe, it, expect } from 'vitest'
import {
  createRoom,
  joinRoom,
  castVote,
  revealVotes,
  clearVotes,
  changeMode,
  transferHost,
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

describe('transferring the host role', () => {
  it('moves host controls to the chosen participant', () => {
    const { code } = createRoom('Sarah', 'host-a', 't-a')
    joinRoom(code, 'Tom', 'member-b', 't-b')
    const state = transferHost('t-a', 'member-b')!.roomState
    expect(state.participants.find(p => p.id === 'member-b')?.isCreator).toBe(true)
    expect(state.participants.find(p => p.id === 'host-a')?.isCreator).toBe(false)
    expect(revealVotes('t-b')).not.toBeNull()
    expect(revealVotes('t-a')).toBeNull()
  })

  it('only lets the current host transfer', () => {
    const { code } = createRoom('Sarah', 'host-c', 't-c')
    joinRoom(code, 'Tom', 'member-d', 't-d')
    joinRoom(code, 'Ana', 'member-e', 't-e')
    expect(transferHost('t-d', 'member-e')).toBeNull()
    expect(transferHost('t-d', 'member-d')).toBeNull()
  })

  it('rejects targets who are not in the room', () => {
    const { code } = createRoom('Sarah', 'host-f', 't-f')
    joinRoom(code, 'Tom', 'member-g', 't-g')
    removeParticipant('t-g')
    expect(transferHost('t-f', 'member-g')).toBeNull()
    expect(transferHost('t-f', 'nobody')).toBeNull()
    expect(transferHost('t-f', 'host-f')).toBeNull()
  })

  it('keeps the round as it was', () => {
    const { code } = createRoom('Sarah', 'host-h', 't-h')
    joinRoom(code, 'Tom', 'member-i', 't-i')
    changeMode('t-h', 'spike')
    castVote('t-h', 2)
    castVote('t-i', 3)
    revealVotes('t-h')
    const state = transferHost('t-h', 'member-i')!.roomState
    expect(state.mode).toBe('spike')
    expect(state.revealed).toBe(true)
    expect(Object.keys(state.votes)).toHaveLength(2)
  })

  it('does not hand host back to the previous host when they rejoin', () => {
    const { code } = createRoom('Sarah', 'host-j', 't-j')
    joinRoom(code, 'Tom', 'member-k', 't-k')
    transferHost('t-j', 'member-k')
    removeParticipant('t-j')
    const state = stateOf(joinRoom(code, 'Sarah', 'host-j', 't-j2'))
    expect(state.participants.find(p => p.id === 'host-j')?.isCreator).toBe(false)
    expect(state.participants.find(p => p.id === 'member-k')?.isCreator).toBe(true)
  })
})

describe('t-shirt sizing and vote validation', () => {
  it('lets the host switch to t-shirt sizes and accepts sizes as votes', () => {
    const { code } = createRoom('Sarah', 'host-ts', 'ts-h')
    joinRoom(code, 'Tom', 'member-ts', 'ts-m')
    expect(changeMode('ts-h', 'tshirt')!.roomState.mode).toBe('tshirt')
    castVote('ts-h', 3)
    castVote('ts-m', 3)
    const revealed = revealVotes('ts-h')!.roomState
    expect(revealed.votes).toEqual({ 'host-ts': 3, 'member-ts': 3 })
  })

  it('rejects votes that do not belong to the current mode', () => {
    createRoom('Sarah', 'host-v', 'v-h')
    expect(castVote('v-h', 4)).toBeNull() // 4 is not a story point
    expect(castVote('v-h', 5)).not.toBeNull()
    changeMode('v-h', 'tshirt')
    expect(castVote('v-h', 8)).toBeNull() // no "8 sizes"
    expect(castVote('v-h', 1.5)).toBeNull()
    expect(castVote('v-h', 4)).not.toBeNull()
    changeMode('v-h', 'spike')
    expect(castVote('v-h', 2.5)).not.toBeNull()
  })

  it('rejects unknown modes', () => {
    createRoom('Sarah', 'host-u', 'u-h')
    expect(changeMode('u-h', 'bogus' as never)).toBeNull()
  })
})
