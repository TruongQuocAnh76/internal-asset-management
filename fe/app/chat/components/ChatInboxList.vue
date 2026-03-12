<script setup lang="ts">
import type { ChatRoom } from '../types/chat.types'

defineProps<{
  rooms: ChatRoom[]
  activeRoomId?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', room: ChatRoom): void
  (e: 'new'): void
}>()

function roomDisplayName(room: ChatRoom, currentUserId: string) {
  if (room.type === 'DIRECT') {
    const other = room.chatRoomParticipants?.find((p) => p.user_id !== currentUserId)
    if (other?.user) return `${other.user.first_name} ${other.user.last_name}`
  }
  return room.name
}

function roomInitials(room: ChatRoom, currentUserId: string) {
  const name = roomDisplayName(room, currentUserId)
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const { user } = useAuth()
const me = computed(() => user.value?.id ?? '')
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-secondary-200 shrink-0">
      <h2 class="text-base font-semibold text-secondary-900">Messages</h2>
      <button
        @click="emit('new')"
        class="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
        title="New conversation"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex-1 overflow-y-auto divide-y divide-secondary-100">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3 animate-pulse">
        <div class="w-10 h-10 rounded-full bg-secondary-200 shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 bg-secondary-200 rounded w-1/2" />
          <div class="h-3 bg-secondary-100 rounded w-3/4" />
        </div>
      </div>
    </div>

    <!-- Room list -->
    <div v-else-if="rooms.length" class="flex-1 overflow-y-auto divide-y divide-secondary-100">
      <button
        v-for="room in rooms"
        :key="room.id"
        class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary-50"
        :class="activeRoomId === room.id ? 'bg-primary-50' : ''"
        @click="emit('select', room)"
      >
        <!-- Avatar -->
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          :class="room.type === 'GROUP' ? 'bg-violet-100 text-violet-700' : 'bg-primary-100 text-primary-700'"
        >
          <svg v-if="room.type === 'GROUP'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-else>{{ roomInitials(room, me) }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-secondary-900 truncate">
              {{ roomDisplayName(room, me) }}
            </span>
            <span v-if="room.lastMessage" class="text-xs text-secondary-400 shrink-0">
              {{ new Date(room.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
          <p class="text-xs text-secondary-500 truncate mt-0.5">
            {{ room.lastMessage?.content ?? 'No messages yet' }}
          </p>
        </div>
      </button>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-secondary-400">
      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <p class="text-sm text-center">No conversations yet.<br />Start one by clicking <strong>+</strong>.</p>
    </div>
  </div>
</template>
