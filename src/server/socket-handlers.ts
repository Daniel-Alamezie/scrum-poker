import type { Server, Socket } from 'socket.io'
import type { VoteMode, VoteValue } from '../lib/types'
import {
  createRoom,
  joinRoom,
  castVote,
  revealVotes,
  clearVotes,
  changeMode,
  removeParticipant,
} from './room-manager'

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on(
      'create-room',
      (
        { name, clientId }: { name: string; clientId: string },
        callback: (res: { code?: string; error?: string }) => void
      ) => {
        if (!name?.trim()) {
          callback({ error: 'Name is required' })
          return
        }
        if (!clientId) {
          callback({ error: 'Missing client identity' })
          return
        }

        const result = createRoom(name.trim(), clientId, socket.id)
        socket.join(result.code)

        socket.emit('room-state', {
          room: result.roomState,
          participantId: clientId,
        })

        callback({ code: result.code })
      }
    )

    socket.on(
      'join-room',
      (
        { code, name, clientId }: { code: string; name: string; clientId: string },
        callback: (res: { error?: string }) => void
      ) => {
        if (!name?.trim()) {
          callback({ error: 'Name is required' })
          return
        }
        if (!code?.trim()) {
          callback({ error: 'Room code is required' })
          return
        }
        if (!clientId) {
          callback({ error: 'Missing client identity' })
          return
        }

        const result = joinRoom(code.trim(), name.trim(), clientId, socket.id)
        if ('error' in result) {
          callback({ error: result.error })
          return
        }

        const roomCode = code.trim().toUpperCase()
        socket.join(roomCode)

        socket.emit('room-state', {
          room: result.roomState,
          participantId: clientId,
        })

        socket.to(roomCode).emit('room-update', result.roomState)
        callback({})
      }
    )

    socket.on('cast-vote', ({ value }: { value: VoteValue }) => {
      const result = castVote(socket.id, value)
      if (result) {
        io.to(result.code).emit('room-update', result.roomState)
      }
    })

    socket.on('reveal-votes', () => {
      const result = revealVotes(socket.id)
      if (result) {
        io.to(result.code).emit('room-update', result.roomState)
      }
    })

    socket.on('clear-votes', () => {
      const result = clearVotes(socket.id)
      if (result) {
        io.to(result.code).emit('room-update', result.roomState)
      }
    })

    socket.on('change-mode', ({ mode }: { mode: VoteMode }) => {
      const result = changeMode(socket.id, mode)
      if (result) {
        io.to(result.code).emit('room-update', result.roomState)
      }
    })

    socket.on('disconnect', () => {
      const result = removeParticipant(socket.id)
      if (result) {
        socket.to(result.code).emit('room-update', result.roomState)
      }
    })
  })
}
