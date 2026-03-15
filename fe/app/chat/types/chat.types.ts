export type ChatRoomType = 'DIRECT' | 'GROUP'
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE'

export interface ChatUser {
  id: string
  first_name: string
  last_name: string
  username: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  chat_room_id: string
  content: string
  type: MessageType
  created_at: string
  sender?: ChatUser
}

export interface ChatParticipant {
  id: string
  chat_room_id: string
  user_id: string
  joined_at: string
  user?: ChatUser
}

export interface ChatRoom {
  id: string
  chat_room_id?: string
  name: string
  type: ChatRoomType
  created_at: string
  chatRoomParticipants?: ChatParticipant[]
  messages?: ChatMessage[]
  /** Populated client-side for display convenience */
  lastMessage?: ChatMessage
  unreadCount?: number
}

export interface CreateChatRoomPayload {
  name: string
  type: ChatRoomType
  participantIds: string[]
}

export interface SendMessagePayload {
  senderId: string
  chatRoomId: string
  content: string
  type: MessageType
  chatRoomType: ChatRoomType
}
