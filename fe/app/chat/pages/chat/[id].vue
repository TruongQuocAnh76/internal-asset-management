<script setup lang="ts">
/**
 * /chat/[id] — Deep-link to a specific chat room.
 * Loads the main /chat page pre-selecting the given room.
 */
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const {
  connect,
  disconnect,
  getChatRooms,
  getMessages,
  patchChatRoomName,
  onMessage,
  onMessageUpdated,
  onMessageDeleted,
  sendMessage,
  updateMessage,
  deleteMessage,
} = useChat()

import type { ChatRoom, ChatMessage } from '../../types/chat.types'
import ChatInboxList from '../../components/ChatInboxList.vue'
import ChatWindow from '../../components/ChatWindow.vue'
import NewChatroomModal from '../../components/NewChatroomModal.vue'
import { useChat } from '../../composables/useChat'

const rooms = ref<ChatRoom[]>([])
const loadingRooms = ref(false)
const activeRoom = ref<ChatRoom | null>(null)
const messages = ref<ChatMessage[]>([])
const loadingMessages = ref(false)
const cursor = ref<string | undefined>(undefined)
const showNewModal = ref(false)

onMounted(async () => {
  connect()
  await loadRooms()

  const roomId = route.params.id as string
  const found = rooms.value.find((r) => r.id === roomId)
  if (found) await selectRoom(found)

  const off1 = onMessage((msg) => {
    if (activeRoom.value && msg.chat_room_id === activeRoom.value.id) {
      messages.value.push(msg)
    }
    updateRoomLastMessage(msg)
  })

  const off2 = onMessageUpdated((updated) => {
    const idx = messages.value.findIndex((m) => m.id === updated.id)
    if (idx !== -1) messages.value[idx] = updated
  })

  const off3 = onMessageDeleted(({ messageId }) => {
    messages.value = messages.value.filter((m) => m.id !== messageId)
  })

  onUnmounted(() => { off1(); off2(); off3(); disconnect() })
})

async function loadRooms() {
  const userId = user.value?.id
  if (!userId) return
  loadingRooms.value = true
  try {
    rooms.value = await getChatRooms(userId)
  } finally {
    loadingRooms.value = false
  }
}

function updateRoomLastMessage(msg: ChatMessage) {
  const room = rooms.value.find((r) => r.id === msg.chat_room_id)
  if (room) room.lastMessage = msg
}

async function selectRoom(room: ChatRoom) {
  activeRoom.value = room
  messages.value = []
  cursor.value = undefined
  router.replace(`/chat/${room.id}`)
  loadingMessages.value = true
  try {
    const data = await getMessages(room.id, 50)
    messages.value = data
    if (data.length) cursor.value = data[0].id
  } finally {
    loadingMessages.value = false
  }
}

function handleSendMessage(content: string) {
  if (!activeRoom.value || !user.value?.id) return
  sendMessage({
    senderId: user.value.id,
    chatRoomId: activeRoom.value.id,
    content,
    type: 'TEXT',
    chatRoomType: activeRoom.value.type,
  })
}

function handleEditMessage(msg: ChatMessage) {
  updateMessage(msg.id, msg.content)
}

function handleDeleteMessage(messageId: string) {
  deleteMessage(messageId)
}

async function handleUpdateRoomName(name: string) {
  if (!activeRoom.value) return
  await patchChatRoomName(activeRoom.value.id, name)
  activeRoom.value.name = name
  const room = rooms.value.find((r) => r.id === activeRoom.value!.id)
  if (room) room.name = name
}

async function fetchMoreMessages() {
  if (!activeRoom.value) return
  const data = await getMessages(activeRoom.value.id, 50, cursor.value)
  messages.value = [...data, ...messages.value]
  if (data.length) cursor.value = data[0].id
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex">
    <div class="w-72 border-r border-secondary-200 bg-white flex flex-col shrink-0">
      <ChatInboxList
        :rooms="rooms"
        :active-room-id="activeRoom?.id"
        :loading="loadingRooms"
        @select="selectRoom"
        @new="showNewModal = true"
      />
    </div>

    <div class="flex-1 min-w-0">
      <ChatWindow
        v-if="activeRoom"
        :room="activeRoom"
        :messages="messages"
        :loading-messages="loadingMessages"
        @send-message="handleSendMessage"
        @edit-message="handleEditMessage"
        @delete-message="handleDeleteMessage"
        @load-more="fetchMoreMessages"
        @update-room-name="handleUpdateRoomName"
      />
      <div v-else class="h-full flex items-center justify-center text-secondary-400">
        <p class="text-sm">Room not found or you are not a participant.</p>
      </div>
    </div>

    <NewChatroomModal
      :open="showNewModal"
      @close="showNewModal = false"
      @create="(payload) => { useChat().createChatRoom(payload); showNewModal = false }"
    />
  </div>
</template>
