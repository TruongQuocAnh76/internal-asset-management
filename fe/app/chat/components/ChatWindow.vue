<script setup lang="ts">
import type { ChatRoom, ChatMessage } from '../types/chat.types'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  room: ChatRoom
  messages: ChatMessage[]
  loadingMessages?: boolean
  hasMoreMessages?: boolean
}>()

const emit = defineEmits<{
  (e: 'sendMessage', content: string): void
  (e: 'editMessage', message: ChatMessage): void
  (e: 'deleteMessage', messageId: string): void
  (e: 'loadMore'): void
  (e: 'updateRoomName', name: string): void
}>()

const { user } = useAuth()
const me = computed(() => user.value?.id ?? '')

const draft = ref('')
const editingMessage = ref<ChatMessage | null>(null)
const editDraft = ref('')
const editInputRef = ref<HTMLTextAreaElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const renamingRoom = ref(false)
const newRoomName = ref(props.room.name)
const isGroup = computed(() => props.room.type === 'GROUP')
const isLoadingHistory = ref(false)
const historyLoadBaseHeight = ref(0)
const stickToBottom = ref(true)

const canLoadMore = computed(
  () => Boolean(props.hasMoreMessages) && !props.loadingMessages,
)

function updateStickToBottom() {
  if (!scrollEl.value) return
  const threshold = 40
  const distanceFromBottom =
    scrollEl.value.scrollHeight - scrollEl.value.scrollTop - scrollEl.value.clientHeight
  stickToBottom.value = distanceFromBottom <= threshold
}

function handleScroll() {
  if (!scrollEl.value) return

  updateStickToBottom()

  if (scrollEl.value.scrollTop <= 0 && canLoadMore.value && !isLoadingHistory.value) {
    isLoadingHistory.value = true
    historyLoadBaseHeight.value = scrollEl.value.scrollHeight
    emit('loadMore')
  }
}

// Keep scroll stable when prepending history, otherwise stick to latest when near bottom.
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (!scrollEl.value) return

    if (isLoadingHistory.value) {
      const delta = scrollEl.value.scrollHeight - historyLoadBaseHeight.value
      scrollEl.value.scrollTop = Math.max(delta, 0)
      return
    }

    if (stickToBottom.value) {
      scrollEl.value.scrollTop = scrollEl.value.scrollHeight
    }
  },
  { immediate: true },
)

watch(
  () => props.loadingMessages,
  (loading) => {
    if (!loading) {
      isLoadingHistory.value = false
    }
  },
)

function submitMessage() {
  const content = draft.value.trim()
  if (!content) return
  emit('sendMessage', content)
  draft.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitMessage()
  }
}

function startEdit(msg: ChatMessage) {
  editingMessage.value = msg
  editDraft.value = msg.content
  nextTick(() => editInputRef.value?.focus())
}

function cancelEdit() {
  editingMessage.value = null
  editDraft.value = ''
}

function submitEdit() {
  const content = editDraft.value.trim()
  if (!content || !editingMessage.value) return
  emit('editMessage', { ...editingMessage.value, content })
  cancelEdit()
}

function handleEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
  if (e.key === 'Escape') cancelEdit()
}

function submitRename() {
  const name = newRoomName.value.trim()
  if (!name || name === props.room.name) { renamingRoom.value = false; return }
  emit('updateRoomName', name)
  renamingRoom.value = false
}

function roomDisplayName() {
  if (props.room.type === 'DIRECT') {
    const other = props.room.chatRoomParticipants?.find((p) => p.user_id !== me.value)
    if (other?.user) return `${other.user.first_name} ${other.user.last_name}`
  }
  return props.room.name
}

const participantsSummary = computed(() => {
  if (!isGroup.value || !props.room.chatRoomParticipants) return ''
  return props.room.chatRoomParticipants
    .map((p) => p.user ? `${p.user.first_name} ${p.user.last_name}` : '')
    .filter(Boolean)
    .join(', ')
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-secondary-200 shrink-0 bg-white">
      <!-- Avatar -->
      <div
        class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
        :class="isGroup ? 'bg-violet-100 text-violet-700' : 'bg-primary-100 text-primary-700'"
      >
        <svg v-if="isGroup" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span v-else>{{ roomDisplayName()[0] }}</span>
      </div>

      <!-- Name -->
      <div class="flex-1 min-w-0">
        <div v-if="renamingRoom && isGroup" class="flex items-center gap-2">
          <input
            v-model="newRoomName"
            class="border border-secondary-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            @keydown.enter="submitRename"
            @keydown.escape="renamingRoom = false"
          />
          <button @click="submitRename" class="text-xs text-primary-600 font-medium hover:text-primary-800">Save</button>
          <button @click="renamingRoom = false" class="text-xs text-secondary-500 hover:text-secondary-700">Cancel</button>
        </div>
        <div v-else class="flex items-center gap-1.5">
          <span class="font-semibold text-secondary-900 text-sm truncate">{{ roomDisplayName() }}</span>
          <button
            v-if="isGroup"
            @click="renamingRoom = true; newRoomName = room.name"
            class="p-0.5 rounded text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
            title="Rename group"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        <p v-if="isGroup && participantsSummary" class="text-xs text-secondary-500 truncate">{{ participantsSummary }}</p>
      </div>
    </div>

    <!-- Messages area -->
    <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-3" @scroll="handleScroll">
      <div v-if="loadingMessages && messages.length" class="flex justify-center py-1">
        <span class="text-xs text-secondary-500">Loading earlier messages...</span>
      </div>

      <div v-if="loadingMessages" class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex gap-3 animate-pulse" :class="i % 2 === 0 ? 'justify-end' : ''">
          <div v-if="i % 2 !== 0" class="w-7 h-7 rounded-full bg-secondary-200 shrink-0" />
          <div class="h-9 rounded-2xl bg-secondary-200" :style="{ width: `${Math.random() * 30 + 30}%` }" />
        </div>
      </div>

      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :is-mine="msg.sender_id === me"
        :show-sender="isGroup"
        @edit="startEdit"
        @delete="emit('deleteMessage', $event)"
      />
    </div>

    <!-- Edit banner -->
    <div v-if="editingMessage" class="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center gap-3 shrink-0">
      <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-amber-700">Editing message</p>
        <p class="text-xs text-amber-600 truncate">{{ editingMessage.content }}</p>
      </div>
      <button @click="cancelEdit" class="text-amber-500 hover:text-amber-700">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Input area -->
    <div class="px-4 py-3 border-t border-secondary-200 bg-white shrink-0">
      <div v-if="editingMessage" class="flex gap-2">
        <textarea
          ref="editInputRef"
          v-model="editDraft"
          rows="1"
          class="flex-1 resize-none rounded-xl border border-amber-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Edit message…"
          @keydown="handleEditKeydown"
        />
        <button
          @click="submitEdit"
          :disabled="!editDraft.trim()"
          class="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          Save
        </button>
      </div>
      <div v-else class="flex gap-2">
        <textarea
          v-model="draft"
          rows="1"
          class="flex-1 resize-none rounded-xl border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          @keydown="handleKeydown"
        />
        <button
          @click="submitMessage"
          :disabled="!draft.trim()"
          class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
