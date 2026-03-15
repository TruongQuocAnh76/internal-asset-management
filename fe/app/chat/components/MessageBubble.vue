<script setup lang="ts">
import type { ChatMessage } from '../types/chat.types'

const props = defineProps<{
  message: ChatMessage
  isMine: boolean
  showSender?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', message: ChatMessage): void
  (e: 'delete', messageId: string): void
}>()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function closeMenu(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeMenu, true))
onUnmounted(() => document.removeEventListener('click', closeMenu, true))

const formattedTime = computed(() =>
  new Date(props.message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
)

const senderName = computed(() => {
  const s = props.message.sender
  if (!s) return 'Unknown'
  return `${s.first_name} ${s.last_name}`
})
</script>

<template>
  <div :class="['flex gap-2 group', isMine ? 'justify-end' : 'justify-start']">
    <!-- Avatar (other's messages) -->
    <div
      v-if="!isMine"
      class="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0 self-end mb-1"
    >
      {{ message.sender?.first_name?.[0] ?? '?' }}{{ message.sender?.last_name?.[0] ?? '' }}
    </div>

    <div :class="['max-w-[70%] flex flex-col', isMine ? 'items-end' : 'items-start']">
      <!-- Sender name in group chats -->
      <span v-if="showSender && !isMine" class="text-xs text-secondary-500 mb-0.5 px-1">
        {{ senderName }}
      </span>

      <div class="relative flex items-end gap-1">
        <!-- Bubble -->
        <div
          :class="[
            'px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words',
            isMine
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-white border border-secondary-200 text-secondary-900 rounded-bl-sm',
          ]"
        >
          {{ message.content }}
        </div>

        <!-- Context menu trigger -->
        <div v-if="isMine" class="relative shrink-0 self-center" ref="menuRef">
          <button
            @click.stop="menuOpen = !menuOpen"
            class="p-1 rounded text-secondary-300 opacity-0 group-hover:opacity-100 hover:text-secondary-600 hover:bg-secondary-100 transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          <div
            v-if="menuOpen"
            class="absolute bottom-6 right-0 bg-white border border-secondary-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]"
          >
            <button
              class="w-full text-left px-3 py-1.5 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
              @click="emit('edit', message); menuOpen = false"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              class="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              @click="emit('delete', message.id); menuOpen = false"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <span class="text-[10px] text-secondary-400 mt-0.5 px-1">{{ formattedTime }}</span>
    </div>
  </div>
</template>
