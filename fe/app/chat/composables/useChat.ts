import { io, type Socket } from 'socket.io-client'
import type {
  ChatRoom,
  ChatMessage,
  CreateChatRoomPayload,
  SendMessagePayload,
} from '../types/chat.types'

let socket: Socket | null = null

function getSocket(backendUrl: string): Socket {
  if (!socket) {
    socket = io(backendUrl, { withCredentials: true, transports: ['websocket', 'polling'] })
  }
  return socket
}

export const useChat = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.backendUrl

  // ---- REST helpers ----
  // NOTE: requires backend to expose GET /chat/rooms?userId=... (see chat.service getChatRoomsByUserId)
  const getChatRooms = (userId: string) =>
    $fetch<ChatRoom[]>(`/chat/rooms`, { baseURL, credentials: 'include', params: { userId } })

  const getMessages = (chatRoomId: string, take = 50, cursor?: string) =>
    $fetch<ChatMessage[]>(`/chat/messages`, {
      baseURL,
      credentials: 'include',
      params: { chatRoomId, take, ...(cursor ? { cursor } : {}) },
    })

  const patchChatRoomName = (chatRoomId: string, name: string) =>
    $fetch(`/chat/${chatRoomId}/name`, {
      method: 'PATCH',
      baseURL,
      credentials: 'include',
      body: { chatRoomId, name },
    })

  // ---- Socket helpers ----
  const connect = () => getSocket(baseURL)

  const disconnect = () => {
    socket?.disconnect()
    socket = null
  }

  const onMessage = (handler: (msg: ChatMessage) => void) => {
    const s = getSocket(baseURL)
    s.on('message:received', handler)
    return () => s.off('message:received', handler)
  }

  const onMessageUpdated = (handler: (msg: ChatMessage) => void) => {
    const s = getSocket(baseURL)
    s.on('message:updated', handler)
    return () => s.off('message:updated', handler)
  }

  const onMessageDeleted = (handler: (data: { messageId: string }) => void) => {
    const s = getSocket(baseURL)
    s.on('message:deleted', handler)
    return () => s.off('message:deleted', handler)
  }

  const onChatroomCreated = (handler: (room: ChatRoom) => void) => {
    const s = getSocket(baseURL)
    s.on('chatroom:created', handler)
    return () => s.off('chatroom:created', handler)
  }

  const sendMessage = (payload: SendMessagePayload) => {
    getSocket(baseURL).emit('message:send', payload)
  }

  const updateMessage = (messageId: string, content: string) => {
    getSocket(baseURL).emit('messsage:update', { messageId, content })
  }

  const deleteMessage = (messageId: string) => {
    getSocket(baseURL).emit('message:delete', { messageId })
  }

  const createChatRoom = (payload: CreateChatRoomPayload) => {
    getSocket(baseURL).emit('chatroom:create', payload)
  }

  const joinChatRoom = (chatRoomId: string, userId: string[]) => {
    getSocket(baseURL).emit('chatroom:join', { chatRoomId, userId })
  }

  const leaveChatRoom = (chatRoomId: string, userId: string[]) => {
    getSocket(baseURL).emit('chatroom:leave', { chatRoomId, userId })
  }

  return {
    connect,
    disconnect,
    getChatRooms,
    getMessages,
    patchChatRoomName,
    onMessage,
    onMessageUpdated,
    onMessageDeleted,
    onChatroomCreated,
    sendMessage,
    updateMessage,
    deleteMessage,
    createChatRoom,
    joinChatRoom,
    leaveChatRoom,
  }
}
