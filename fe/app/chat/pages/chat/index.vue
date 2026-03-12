<script setup lang="ts">
import type { ChatRoom, ChatMessage, CreateChatRoomPayload } from '../../types/chat.types'
import ChatInboxList from '../../components/ChatInboxList.vue'
import NewChatroomModal from '../../components/NewChatroomModal.vue'
import ChatWindow from '../../components/ChatWindow.vue'

definePageMeta({ layout: 'default' })

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
  onChatroomCreated,
  sendMessage,
  updateMessage,
  deleteMessage,
  createChatRoom,
} = useChat()

// ---- State ----
const rooms = ref<ChatRoom[]>([])
const loadingRooms = ref(false)
const activeRoom = ref<ChatRoom | null>(null)
const messages = ref<ChatMessage[]>([])
const loadingMessages = ref(false)
const cursor = ref<string | undefined>(undefined)
const showNewModal = ref(false)

// ---- Lifecycle ----
onMounted(async () => {
  connect()
  await loadRooms()

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

  const off4 = onChatroomCreated((room) => {
    if (!rooms.value.find((r) => r.id === room.id)) {
      rooms.value.unshift(room)
    }
  })

  onUnmounted(() => {
    off1(); off2(); off3(); off4()
    disconnect()
  })
})

// ---- Helpers ----
async function loadRooms() {
  const userId = user.value?.id
  if (!userId) return
  loadingRooms.value = true
  try {
    const data = await getChatRooms(userId)
    rooms.value = data
  } catch {
    // silently fail — user will see empty state
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
  router.push({ query: { room: room.id } })
  await fetchMessages(room.id)
}

async function fetchMessages(roomId: string, prepend = false) {
  loadingMessages.value = true
  try {
    const data = await getMessages(roomId, 50, cursor.value)
    if (prepend) {
      messages.value = [...data, ...messages.value]
    } else {
      messages.value = data
    }
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

function handleCreateRoom(payload: CreateChatRoomPayload) {
  createChatRoom(payload)
  showNewModal.value = false
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex">
    <!-- Inbox sidebar -->
    <div class="w-72 border-r border-secondary-200 bg-white flex flex-col shrink-0">
      <ChatInboxList
        :rooms="rooms"
        :active-room-id="activeRoom?.id"
        :loading="loadingRooms"
        @select="selectRoom"
        @new="showNewModal = true"
      />
    </div>

    <!-- Chat area -->
    <div class="flex-1 min-w-0">
      <ChatWindow
        v-if="activeRoom"
        :room="activeRoom"
        :messages="messages"
        :loading-messages="loadingMessages"
        @send-message="handleSendMessage"
        @edit-message="handleEditMessage"
        @delete-message="handleDeleteMessage"
        @load-more="fetchMessages(activeRoom!.id, true)"
        @update-room-name="handleUpdateRoomName"
      />

      <!-- Empty / placeholder -->
      <div v-else class="h-full flex flex-col items-center justify-center gap-4 text-secondary-400">
        <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <div class="text-center">
          <p class="font-medium text-secondary-600">Select a conversation</p>
          <p class="text-sm mt-1">or start a new one</p>
        </div>
        <button
          @click="showNewModal = true"
          class="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          New Conversation
        </button>
      </div>
    </div>

    <!-- New chatroom modal -->
    <NewChatroomModal
      :open="showNewModal"
      @close="showNewModal = false"
      @create="handleCreateRoom"
    />
  </div>
</template>
