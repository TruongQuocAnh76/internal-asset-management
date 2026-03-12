<script setup lang="ts">
import type { UserSummary } from '../../users/types/user.types'
import type { ChatRoomType, CreateChatRoomPayload } from '../types/chat.types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: CreateChatRoomPayload): void
}>()

const { user } = useAuth()
const { getUsers } = useUsers()

const type = ref<ChatRoomType>('DIRECT')
const name = ref('')
const search = ref('')
const allUsers = ref<UserSummary[]>([])
const selected = ref<UserSummary[]>([])
const loadingUsers = ref(false)
const submitting = ref(false)

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase()
  return allUsers.value.filter(
    (u) =>
      u.id !== user.value?.id &&
      !selected.value.find((s) => s.id === u.id) &&
      (`${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
  )
})

watch(
  () => props.open,
  async (val) => {
    if (val) {
      type.value = 'DIRECT'
      name.value = ''
      search.value = ''
      selected.value = []
      loadingUsers.value = true
      try {
        allUsers.value = await getUsers()
      } finally {
        loadingUsers.value = false
      }
    }
  },
)

function toggleUser(u: UserSummary) {
  const idx = selected.value.findIndex((s) => s.id === u.id)
  if (idx !== -1) {
    selected.value.splice(idx, 1)
  } else {
    if (type.value === 'DIRECT' && selected.value.length >= 1) return
    selected.value.push(u)
  }
}

const canSubmit = computed(() => {
  if (selected.value.length === 0) return false
  if (type.value === 'GROUP' && !name.value.trim()) return false
  return true
})

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return
  const currentUserId = user.value?.id
  if (!currentUserId) return

  submitting.value = true
  const participantIds = [currentUserId, ...selected.value.map((u) => u.id)]
  const chatName =
    type.value === 'GROUP'
      ? name.value.trim()
      : `${user.value?.first_name ?? ''} & ${selected.value[0]?.first_name ?? ''}`

  emit('create', { name: chatName, type: type.value, participantIds })
  submitting.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
            <h3 class="text-base font-semibold text-secondary-900">New Conversation</h3>
            <button
              @click="emit('close')"
              class="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <!-- Type toggle -->
            <div class="flex rounded-lg border border-secondary-200 overflow-hidden">
              <button
                v-for="t in ['DIRECT', 'GROUP'] as const"
                :key="t"
                class="flex-1 py-2 text-sm font-medium transition-colors"
                :class="type === t ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-50'"
                @click="type = t; selected = []"
              >
                {{ t === 'DIRECT' ? 'Direct Message' : 'Group Chat' }}
              </button>
            </div>

            <!-- Group name -->
            <div v-if="type === 'GROUP'">
              <label class="block text-xs font-medium text-secondary-700 mb-1">Group name</label>
              <input
                v-model="name"
                type="text"
                placeholder="e.g. Project Alpha"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <!-- Selected chips -->
            <div v-if="selected.length" class="flex flex-wrap gap-2">
              <span
                v-for="u in selected"
                :key="u.id"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium"
              >
                {{ u.first_name }} {{ u.last_name }}
                <button @click="toggleUser(u)" class="ml-0.5 hover:text-primary-900">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>

            <!-- User search -->
            <div>
              <label class="block text-xs font-medium text-secondary-700 mb-1">
                {{ type === 'DIRECT' ? 'Select person' : 'Add members' }}
              </label>
              <input
                v-model="search"
                type="text"
                placeholder="Search by name or username…"
                class="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              />

              <div v-if="loadingUsers" class="space-y-2">
                <div v-for="i in 3" :key="i" class="h-10 bg-secondary-100 rounded-lg animate-pulse" />
              </div>

              <div v-else class="max-h-48 overflow-y-auto space-y-1">
                <button
                  v-for="u in filteredUsers"
                  :key="u.id"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-secondary-50 transition-colors"
                  @click="toggleUser(u)"
                >
                  <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {{ u.first_name[0] }}{{ u.last_name[0] }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-secondary-900">{{ u.first_name }} {{ u.last_name }}</p>
                    <p class="text-xs text-secondary-500">{{ u.username }}</p>
                  </div>
                </button>
                <p v-if="!filteredUsers.length" class="text-sm text-secondary-400 text-center py-4">
                  No users found
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3">
            <button
              @click="emit('close')"
              class="px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              :disabled="!canSubmit || submitting"
              @click="handleSubmit"
              class="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? 'Creating…' : 'Start Chat' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
