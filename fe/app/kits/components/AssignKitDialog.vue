<script setup lang="ts">
import type { Kit } from '../types/kit.types'

interface Props {
  visible: boolean
  kit: Kit | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'success': []
}>()

const { assignRequest } = useRequests()
const { getUsers } = useUsers()

type UserResult = { id: string; first_name: string; last_name: string; email: string }

const requesterId = ref('')
const reason = ref('')
const priority = ref<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
const dueDate = ref('')

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const users = ref<UserResult[]>([])
const userSearch = ref('')
const isSearchingUsers = ref(false)
const showUserDropdown = ref(false)
const selectedUser = ref<UserResult | null>(null)

const searchUsers = async () => {
  if (userSearch.value.length < 2) {
    users.value = []
    return
  }
  isSearchingUsers.value = true
  try {
    users.value = await getUsers(userSearch.value) as UserResult[]
  } catch {
    users.value = []
  } finally {
    isSearchingUsers.value = false
  }
}

const selectUser = (user: UserResult) => {
  selectedUser.value = user
  requesterId.value = user.id
  userSearch.value = `${user.first_name} ${user.last_name}`
  showUserDropdown.value = false
  errors.value.requesterId = ''
}

const handleUserInputFocus = () => {
  showUserDropdown.value = true
  if (userSearch.value.length >= 2) searchUsers()
}

const validateForm = (): boolean => {
  errors.value = {}
  if (!requesterId.value) errors.value.requesterId = 'Please select a user'
  if (!reason.value.trim()) errors.value.reason = 'Reason is required'
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm() || !props.kit) return
  isSubmitting.value = true
  try {
    await assignRequest({
      kitId: props.kit.id,
      requesterId: requesterId.value,
      reason: reason.value.trim(),
      priority: priority.value,
      ...(dueDate.value ? { dueDate: dueDate.value } : {})
    })
    emit('success')
    emit('close')
  } catch (err: any) {
    errors.value.general = err.data?.message || err.message || 'Failed to assign kit'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  requesterId.value = ''
  reason.value = ''
  priority.value = 'MEDIUM'
  dueDate.value = ''
  errors.value = {}
  selectedUser.value = null
  userSearch.value = ''
}

watch(() => props.visible, (visible) => {
  if (!visible) resetForm()
})

let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch(userSearch, () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(searchUsers, 300)
})

const handleUserBlur = () => {
  setTimeout(() => { showUserDropdown.value = false }, 200)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-secondary-900">Assign Kit</h2>
              <p v-if="kit" class="text-sm text-secondary-600">{{ kit.template.name }}</p>
            </div>
            <button
              @click="emit('close')"
              class="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-5">
            <!-- General Error -->
            <div v-if="errors.general" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-danger-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <span class="text-danger-700">{{ errors.general }}</span>
              </div>
            </div>

            <!-- Assign To -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Assign To <span class="text-danger-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="userSearch"
                  type="text"
                  placeholder="Search by name or email..."
                  @focus="handleUserInputFocus"
                  @blur="setTimeout(() => showUserDropdown = false, 200)"
                  class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="errors.requesterId ? 'border-danger-500' : 'border-secondary-300'"
                />
                <div
                  v-if="showUserDropdown && (users.length > 0 || isSearchingUsers)"
                  class="absolute top-full left-0 right-0 mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                >
                  <div v-if="isSearchingUsers" class="px-4 py-3 text-sm text-secondary-500 text-center">
                    Searching...
                  </div>
                  <button
                    v-else
                    v-for="u in users"
                    :key="u.id"
                    @mousedown.prevent="selectUser(u)"
                    class="w-full px-4 py-2 text-left hover:bg-secondary-50 transition-colors"
                  >
                    <div class="font-medium text-secondary-900">{{ u.first_name }} {{ u.last_name }}</div>
                    <div class="text-sm text-secondary-500">{{ u.email }}</div>
                  </button>
                </div>
              </div>
              <p v-if="errors.requesterId" class="text-sm text-danger-600 mt-1">{{ errors.requesterId }}</p>
              <div v-if="selectedUser" class="mt-2 flex items-center gap-2 text-sm text-success-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                {{ selectedUser.first_name }} {{ selectedUser.last_name }}
              </div>
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Reason <span class="text-danger-500">*</span>
              </label>
              <textarea
                v-model="reason"
                rows="3"
                placeholder="Why is this kit being assigned?"
                class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                :class="errors.reason ? 'border-danger-500' : 'border-secondary-300'"
              />
              <p v-if="errors.reason" class="text-sm text-danger-600 mt-1">{{ errors.reason }}</p>
            </div>

            <!-- Priority -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Priority</label>
              <div class="flex gap-3">
                <label
                  v-for="p in (['LOW', 'MEDIUM', 'HIGH'] as const)"
                  :key="p"
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-sm font-medium"
                  :class="priority === p
                    ? p === 'LOW' ? 'border-success-500 bg-success-50 text-success-700'
                      : p === 'MEDIUM' ? 'border-warning-500 bg-warning-50 text-warning-700'
                      : 'border-danger-500 bg-danger-50 text-danger-700'
                    : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'"
                >
                  <input v-model="priority" type="radio" :value="p" class="sr-only" />
                  {{ p.charAt(0) + p.slice(1).toLowerCase() }}
                </label>
              </div>
            </div>

            <!-- Due Date -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Due Date <span class="text-secondary-400 font-normal">(optional)</span></label>
              <input
                v-model="dueDate"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
                class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3">
            <button
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="isSubmitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ isSubmitting ? 'Assigning...' : 'Assign Kit' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>