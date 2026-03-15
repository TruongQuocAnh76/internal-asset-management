import type { Socket } from 'socket.io-client'
import type {
  ChatRoom,
  ChatMessage,
  CreateChatRoomPayload,
  SendMessagePayload,
} from '../types/chat.types'

type SocketExceptionPayload = {
  message?: string | string[]
  error?: string
  status?: number
}

function normalizeSocketException(payload: unknown) {
  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is string => typeof entry === 'string').join(', ')
  }

  if (payload && typeof payload === 'object') {
    const exception = payload as SocketExceptionPayload

    if (Array.isArray(exception.message)) {
      return exception.message.join(', ')
    }

    if (typeof exception.message === 'string' && exception.message.trim()) {
      return exception.message
    }

    if (typeof exception.error === 'string' && exception.error.trim()) {
      return exception.error
    }
  }

  return 'Something went wrong while processing the chat request'
}

export const useChat = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.backendUrl
  const { $chatSocket } = useNuxtApp()

  const getChatSocket = () => $chatSocket as Socket
  const disconnectChatSocket = () => ($chatSocket as Socket).disconnect()

  // ---- REST helpers ----
  // NOTE: requires backend to expose GET /chat/rooms?userId=... (see chat.service getChatRoomsByUserId)
  const getChatRooms = (userId: string) =>
    $fetch<ChatRoom[]>(`/chat/rooms`, {
      baseURL,
      credentials: 'include',
      params: { userId },
    })

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
  const connect = () => getChatSocket()

  const disconnect = () => disconnectChatSocket()

  const onMessage = (handler: (msg: ChatMessage) => void) => {
    const s = getChatSocket()
    s.on('message:received', handler)
    return () => s.off('message:received', handler)
  }

  const onMessageUpdated = (handler: (msg: ChatMessage) => void) => {
    const s = getChatSocket()
    s.on('message:updated', handler)
    return () => s.off('message:updated', handler)
  }

  const onMessageDeleted = (handler: (data: { messageId: string }) => void) => {
    const s = getChatSocket()
    s.on('message:deleted', handler)
    return () => s.off('message:deleted', handler)
  }

  const onChatroomCreated = (handler: (room: ChatRoom) => void) => {
    const s = getChatSocket()
    s.on('chatroom:created', handler)
    return () => s.off('chatroom:created', handler)
  }

  const onException = (handler: (message: string, payload: unknown) => void) => {
    const s = getChatSocket()
    const listener = (payload: unknown) => {
      handler(normalizeSocketException(payload), payload)
    }

    s.on('exception', listener)
    return () => s.off('exception', listener)
  }

  const sendMessage = (payload: SendMessagePayload) => {
    getChatSocket().emit('message:send', payload)
  }

  const updateMessage = (messageId: string, content: string) => {
    getChatSocket().emit('message:update', { messageId, content })
  }

  const deleteMessage = (messageId: string) => {
    getChatSocket().emit('message:delete', { messageId })
  }

  const createChatRoom = (payload: CreateChatRoomPayload) => {
    getChatSocket().emit('chatroom:create', payload)
  }

  const joinChatRoom = (chatRoomId: string, userId: string[]) => {
    getChatSocket().emit('chatroom:join', { chatRoomId, userId })
  }

  const leaveChatRoom = (chatRoomId: string, userId: string[]) => {
    getChatSocket().emit('chatroom:leave', { chatRoomId, userId })
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
    onException,
    sendMessage,
    updateMessage,
    deleteMessage,
    createChatRoom,
    joinChatRoom,
    leaveChatRoom,
  }
}
