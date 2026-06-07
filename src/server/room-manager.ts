import { randomBytes } from 'crypto'
import type { VoteMode, VoteValue, Participant, RoomState } from '../lib/types'

interface ParticipantInternal {
  clientId: string
  name: string
  socketId: string
}

interface RoomInternal {
  code: string
  creatorClientId: string
  participants: Map<string, ParticipantInternal>
  votes: Map<string, VoteValue>
  revealed: boolean
  mode: VoteMode
  emptyTimer?: ReturnType<typeof setTimeout>
}

const rooms = new Map<string, RoomInternal>()
const EMPTY_ROOM_TTL_MS = 5 * 60 * 1000

function generateCode(): string {
  return randomBytes(3).toString('hex').toUpperCase()
}

function toRoomState(room: RoomInternal): RoomState {
  const participants: Participant[] = Array.from(room.participants.values()).map(p => ({
    id: p.clientId,
    name: p.name,
    hasVoted: room.votes.has(p.clientId),
    isCreator: p.clientId === room.creatorClientId,
  }))

  const votes = room.revealed ? Object.fromEntries(room.votes.entries()) : {}

  return {
    code: room.code,
    participants,
    votes,
    revealed: room.revealed,
    mode: room.mode,
  }
}

export function createRoom(
  name: string,
  clientId: string,
  socketId: string
): { code: string; roomState: RoomState } {
  let code: string
  do {
    code = generateCode()
  } while (rooms.has(code))

  const room: RoomInternal = {
    code,
    creatorClientId: clientId,
    participants: new Map([[clientId, { clientId, name, socketId }]]),
    votes: new Map(),
    revealed: false,
    mode: 'fibonacci',
  }

  rooms.set(code, room)
  return { code, roomState: toRoomState(room) }
}

export function joinRoom(
  code: string,
  name: string,
  clientId: string,
  socketId: string
): { roomState: RoomState } | { error: string } {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { error: 'Room not found. Check the code and try again.' }

  if (room.emptyTimer) {
    clearTimeout(room.emptyTimer)
    room.emptyTimer = undefined
  }

  const existing = room.participants.get(clientId)
  if (existing) {
    // Same person rejoining (e.g. navigated from the landing page, or reconnected).
    // Update the socket and keep their identity, including creator status.
    existing.socketId = socketId
    existing.name = name
  } else {
    room.participants.set(clientId, { clientId, name, socketId })
  }

  return { roomState: toRoomState(room) }
}

function authoriseCreator(socketId: string): RoomInternal | null {
  const found = findBySocket(socketId)
  if (!found.room || !found.participant) return null
  if (found.participant.clientId !== found.room.creatorClientId) return null
  return found.room
}

export function castVote(
  socketId: string,
  value: VoteValue
): { roomState: RoomState; code: string } | null {
  const { room, participant } = findBySocket(socketId)
  if (!room || !participant || room.revealed) return null

  room.votes.set(participant.clientId, value)
  return { roomState: toRoomState(room), code: room.code }
}

export function revealVotes(socketId: string): { roomState: RoomState; code: string } | null {
  const room = authoriseCreator(socketId)
  if (!room) return null

  room.revealed = true
  return { roomState: toRoomState(room), code: room.code }
}

export function clearVotes(socketId: string): { roomState: RoomState; code: string } | null {
  const room = authoriseCreator(socketId)
  if (!room) return null

  room.votes.clear()
  room.revealed = false
  return { roomState: toRoomState(room), code: room.code }
}

export function changeMode(
  socketId: string,
  mode: VoteMode
): { roomState: RoomState; code: string } | null {
  const room = authoriseCreator(socketId)
  if (!room) return null

  room.mode = mode
  room.votes.clear()
  room.revealed = false
  return { roomState: toRoomState(room), code: room.code }
}

export function removeParticipant(socketId: string): { roomState: RoomState; code: string } | null {
  const { room, participant } = findBySocket(socketId)
  if (!room || !participant) return null

  // Guard against a navigation race: if this participant has already
  // reconnected on a newer socket, the socketId will no longer match and
  // findBySocket would not have returned them. Reaching here means this is
  // genuinely their current socket, so it is safe to remove their presence.
  room.participants.delete(participant.clientId)
  room.votes.delete(participant.clientId)

  // Ownership stays with the original creator's clientId. If they rejoin in
  // the same tab they are restored as host. We do not transfer ownership on
  // disconnect, which previously caused the creator to lose their controls.

  if (room.participants.size === 0) {
    room.emptyTimer = setTimeout(() => rooms.delete(room.code), EMPTY_ROOM_TTL_MS)
    return null
  }

  return { roomState: toRoomState(room), code: room.code }
}

function findBySocket(socketId: string): {
  room: RoomInternal | null
  participant: ParticipantInternal | null
} {
  for (const room of rooms.values()) {
    for (const participant of room.participants.values()) {
      if (participant.socketId === socketId) return { room, participant }
    }
  }
  return { room: null, participant: null }
}
