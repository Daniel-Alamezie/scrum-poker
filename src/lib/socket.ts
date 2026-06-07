'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { RoomState, VoteMode, VoteValue } from './types'

const CLIENT_ID_KEY = 'scrum-poker-client-id'

/**
 * A stable per-tab identity that survives client-side navigation (and short
 * reconnects), unlike the socket id. This is how room ownership is tracked:
 * the creator keeps the same clientId when moving from the landing page into
 * the room, so the server can recognise them as host on the new socket.
 */
function getOrCreateClientId(): string {
  let id = sessionStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const clientIdRef = useRef<string | null>(null)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    clientIdRef.current = getOrCreateClientId()

    const socket = io({ autoConnect: true })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('room-state', (data: { room: RoomState; participantId: string }) => {
      setRoomState(data.room)
      setParticipantId(data.participantId)
    })

    socket.on('room-update', (room: RoomState) => {
      setRoomState(room)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const createRoom = useCallback((name: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit(
        'create-room',
        { name, clientId: clientIdRef.current },
        (res: { code?: string; error?: string }) => {
          if (res.error) reject(new Error(res.error))
          else resolve(res.code!)
        }
      )
    })
  }, [])

  const joinRoom = useCallback((code: string, name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit(
        'join-room',
        { code, name, clientId: clientIdRef.current },
        (res: { error?: string }) => {
          if (res.error) reject(new Error(res.error))
          else resolve()
        }
      )
    })
  }, [])

  const castVote = useCallback((value: VoteValue) => {
    socketRef.current?.emit('cast-vote', { value })
  }, [])

  const revealVotes = useCallback(() => {
    socketRef.current?.emit('reveal-votes')
  }, [])

  const clearVotes = useCallback(() => {
    socketRef.current?.emit('clear-votes')
  }, [])

  const changeMode = useCallback((mode: VoteMode) => {
    socketRef.current?.emit('change-mode', { mode })
  }, [])

  return {
    roomState,
    participantId,
    connected,
    createRoom,
    joinRoom,
    castVote,
    revealVotes,
    clearVotes,
    changeMode,
  }
}
