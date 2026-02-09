<script setup lang="ts">
import type { AssignKitFormData, Kit } from '../types/kit.types'
import { useKits } from '../composables/useKits'

interface Props {
  visible: boolean
  kit: Kit | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'success': []
}>()

const { assignKit, getUsers } = useKits()

const formData = ref<AssignKitFormData>({
  userId: '',
  quantity: 1,
  checkoutDate: new Date().toISOString().split('T')[0],
  expectedReturnDate: '',
  handoverCondition: ''
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const users = ref<{ id: string; firstName: string; lastName: string; email: string }[]>([])
const userSearch = ref('')
const isSearchingUsers = ref(false)
const showUserDropdown = ref(false)
const selectedUser = ref<{ id: string; firstName: string; lastName: string; email: string } | null>(null)
const insufficientInventory = ref(false)
const assignmentOption = ref<'full' | 'partial' | 'hold' | 'escalate'>('full')

const handoverChecklist = [
  { id: 'physical', label: 'Physical condition verified', checked: ref(false) },
  { id: 'accessories', label: 'All accessories included', checked: ref(false) },
  { id: 'functional', label: 'Functionality tested', checked: ref(false) },
  { id: 'documented', label: 'Serial numbers documented', checked: ref(false) }
]

const searchUsers = async () => {
  if (userSearch.value.length < 2) {
    users.value = []
    return
  }

  isSearchingUsers.value = true
  try {
    users.value = await getUsers(userSearch.value)
  } catch (err) {
    console.error('Failed to search users:', err)
    users.value = []
  } finally {
    isSearchingUsers.value = false
  }
}

const selectUser = (user: typeof users.value[0]) => {
  selectedUser.value = user
  formData.value.userId = user.id
  userSearch.value = `${user.firstName} ${user.lastName}`
  showUserDropdown.value = false
  errors.value.userId = ''
}

const handleUserInputFocus = () => {
  showUserDropdown.value = true
  if (userSearch.value.length >= 2) {
    searchUsers()
  }
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.userId) {
    errors.value.userId = 'Please select a user'
  }

  if (formData.value.quantity < 1) {
    errors.value.quantity = 'Quantity must be at least 1'
  }

  if (!formData.value.checkoutDate) {
    errors.value.checkoutDate = 'Checkout date is required'
  }

  if (!formData.value.expectedReturnDate) {
    errors.value.expectedReturnDate = 'Expected return date is required'
  } else if (formData.value.expectedReturnDate < formData.value.checkoutDate) {
    errors.value.expectedReturnDate = 'Return date must be after checkout date'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm() || !props.kit) return

  // Check inventory availability
  if (formData.value.quantity > (props.kit.totalAvailableKits || 0)) {
    insufficientInventory.value = true
    return
  }

  isSubmitting.value = true
  try {
    // Build handover condition from checklist
    const checkedItems = handoverChecklist.filter(item => item.checked.value).map(item => item.label)
    formData.value.handoverCondition = checkedItems.join('; ') || 'Standard handover'

    await assignKit(props.kit.id, formData.value)
    emit('success')
    emit('close')
  } catch (err: any) {
    errors.value.general = err.data?.message || err.message || 'Failed to assign kit'
  } finally {
    isSubmitting.value = false
  }
}

const handleInsufficientInventoryAction = async () => {
  if (!props.kit) return

  switch (assignmentOption.value) {
    case 'partial':
      formData.value.quantity = props.kit.totalAvailableKits
      insufficientInventory.value = false
      break
    case 'hold':
      // Create a hold request - would need backend support
      errors.value.general = 'Hold functionality requires backend implementation'
      break
    case 'escalate':
      // Escalate to procurement - would need backend support
      errors.value.general = 'Escalation functionality requires backend implementation'
      break
    default:
      insufficientInventory.value = false
  }
}

const resetForm = () => {
  formData.value = {
    userId: '',
    quantity: 1,
    checkoutDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    handoverCondition: ''
  }
  errors.value = {}
  selectedUser.value = null
  userSearch.value = ''
  insufficientInventory.value = false
  handoverChecklist.forEach(item => item.checked.value = false)
}

watch(() => props.visible, (visible) => {
  if (!visible) {
    resetForm()
  }
})

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

watch(userSearch, () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(searchUsers, 300)
})
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
              <p v-if="kit" class="text-sm text-secondary-600">{{ kit.name }}</p>
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
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- General Error -->
            <div v-if="errors.general" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <span class="text-danger-700">{{ errors.general }}</span>
              </div>
            </div>

            <!-- Insufficient Inventory Warning -->
            <div v-if="insufficientInventory" class="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div class="flex-1">
                  <p class="font-medium text-warning-800">Insufficient Inventory</p>
                  <p class="text-sm text-warning-700 mt-1">
                    Only {{ kit?.totalAvailableKits || 0 }} complete kit(s) available. You requested {{ formData.quantity }}.
                  </p>
                  
                  <div class="mt-4 space-y-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="assignmentOption" type="radio" value="partial" class="text-warning-600 focus:ring-warning-500" />
                      <span class="text-sm text-warning-800">Partial fulfill (assign {{ kit?.totalAvailableKits || 0 }} kit(s))</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="assignmentOption" type="radio" value="hold" class="text-warning-600 focus:ring-warning-500" />
                      <span class="text-sm text-warning-800">Put request on hold</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="assignmentOption" type="radio" value="escalate" class="text-warning-600 focus:ring-warning-500" />
                      <span class="text-sm text-warning-800">Escalate to procurement</span>
                    </label>
                  </div>

                  <button
                    @click="handleInsufficientInventoryAction"
                    class="mt-4 px-4 py-2 text-sm font-medium text-warning-700 bg-warning-100 hover:bg-warning-200 rounded-lg transition-colors"
                  >
                    Continue with selected option
                  </button>
                </div>
              </div>
            </div>

            <!-- User Selection -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Requester <span class="text-danger-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="userSearch"
                  type="text"
                  placeholder="Search for a user..."
                  @focus="handleUserInputFocus"
                  @blur="setTimeout(() => showUserDropdown = false, 200)"
                  class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="errors.userId ? 'border-danger-500' : 'border-secondary-300'"
                />
                
                <!-- User Dropdown -->
                <div
                  v-if="showUserDropdown && (users.length > 0 || isSearchingUsers)"
                  class="absolute top-full left-0 right-0 mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                >
                  <div v-if="isSearchingUsers" class="px-4 py-3 text-sm text-secondary-500 text-center">
                    Searching...
                  </div>
                  <button
                    v-else
                    v-for="user in users"
                    :key="user.id"
                    @mousedown.prevent="selectUser(user)"
                    class="w-full px-4 py-2 text-left hover:bg-secondary-50 transition-colors"
                  >
                    <div class="font-medium text-secondary-900">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="text-sm text-secondary-500">{{ user.email }}</div>
                  </button>
                </div>
              </div>
              <p v-if="errors.userId" class="text-sm text-danger-600 mt-1">{{ errors.userId }}</p>
              <div v-if="selectedUser" class="mt-2 flex items-center gap-2 text-sm text-success-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Selected: {{ selectedUser.firstName }} {{ selectedUser.lastName }}
              </div>
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Quantity <span class="text-danger-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="formData.quantity"
                  type="number"
                  min="1"
                  :max="kit?.totalAvailableKits || 1"
                  class="w-24 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="errors.quantity ? 'border-danger-500' : 'border-secondary-300'"
                />
                <span class="text-sm text-secondary-500">
                  of {{ kit?.totalAvailableKits || 0 }} available
                </span>
              </div>
              <p v-if="errors.quantity" class="text-sm text-danger-600 mt-1">{{ errors.quantity }}</p>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">
                  Checkout Date <span class="text-danger-500">*</span>
                </label>
                <input
                  v-model="formData.checkoutDate"
                  type="date"
                  class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="errors.checkoutDate ? 'border-danger-500' : 'border-secondary-300'"
                />
                <p v-if="errors.checkoutDate" class="text-sm text-danger-600 mt-1">{{ errors.checkoutDate }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">
                  Expected Return <span class="text-danger-500">*</span>
                </label>
                <input
                  v-model="formData.expectedReturnDate"
                  type="date"
                  :min="formData.checkoutDate"
                  class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="errors.expectedReturnDate ? 'border-danger-500' : 'border-secondary-300'"
                />
                <p v-if="errors.expectedReturnDate" class="text-sm text-danger-600 mt-1">{{ errors.expectedReturnDate }}</p>
              </div>
            </div>

            <!-- Handover Checklist -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-3">Handover Condition Checklist</label>
              <div class="space-y-2 bg-secondary-50 rounded-lg p-4">
                <label
                  v-for="item in handoverChecklist"
                  :key="item.id"
                  class="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    v-model="item.checked.value"
                    type="checkbox"
                    class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-secondary-700">{{ item.label }}</span>
                </label>
              </div>
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
