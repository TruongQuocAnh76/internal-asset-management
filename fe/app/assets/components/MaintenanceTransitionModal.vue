<script setup lang="ts">
import type { AssetItem, StateTransition, AssetStatus } from '../types/asset.types'

interface Props {
  isOpen: boolean
  transition: StateTransition | null
  assetItems: AssetItem[]
  loading: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  setMaintenance: [assetItemId: string, maintenanceNotes: string]
  resolveMaintenance: [
    assetItemId: string,
    resolvedStatus: 'READY' | 'BROKEN' | 'LIQUIDATED',
    repairCost: number,
    description: string,
  ]
}>()

const selectedItemId = ref('')
const maintenanceNotes = ref('')
const resolvedStatus = ref<'READY' | 'BROKEN' | 'LIQUIDATED'>('READY')
const repairCost = ref(0)
const description = ref('')
const localError = ref<string | null>(null)

// Is this a "send to maintenance" or "resolve maintenance" flow?
const isSetMode = computed(() => props.transition?.to === 'MAINTAINANCE')

// Filter items by status relevant to the transition
const eligibleItems = computed(() => {
  if (!props.transition) return []
  if (isSetMode.value) {
    // When sending to maintenance, show items that can be sent (same status as the "from" state)
    return props.assetItems.filter((item) => item.status === props.transition!.from)
  }
  // When resolving maintenance, show only items currently in maintenance
  return props.assetItems.filter((item) => item.status === 'MAINTAINANCE')
})

// Auto-select first eligible item when modal opens
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      localError.value = null
      maintenanceNotes.value = ''
      repairCost.value = 0
      description.value = ''
      if (props.transition) {
        resolvedStatus.value = (props.transition.to === 'MAINTAINANCE' ? 'READY' : props.transition.to) as 'READY' | 'BROKEN' | 'LIQUIDATED'
      }
      if (eligibleItems.value.length === 1) {
        selectedItemId.value = eligibleItems.value[0]!.id
      } else {
        selectedItemId.value = ''
      }
    }
  },
)

const handleConfirm = () => {
  localError.value = null

  if (!selectedItemId.value) {
    localError.value = 'Please select an asset item'
    return
  }

  if (isSetMode.value) {
    if (!maintenanceNotes.value.trim()) {
      localError.value = 'Please provide maintenance notes'
      return
    }
    emit('setMaintenance', selectedItemId.value, maintenanceNotes.value.trim())
  } else {
    emit(
      'resolveMaintenance',
      selectedItemId.value,
      resolvedStatus.value,
      repairCost.value || 0,
      description.value.trim(),
    )
  }
}

const handleClose = () => {
  localError.value = null
  emit('close')
}

const statusBadgeClass = (status: AssetStatus) => {
  const map: Record<AssetStatus, string> = {
    READY: 'bg-success-100 text-success-700 border-success-200',
    IN_USE: 'bg-primary-100 text-primary-700 border-primary-200',
    MAINTAINANCE: 'bg-warning-100 text-warning-700 border-warning-200',
    BROKEN: 'bg-danger-100 text-danger-700 border-danger-200',
    LIQUIDATED: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  }
  return map[status] || ''
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && transition"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-4">
            <div
              class="p-2 rounded-lg"
              :class="{
                'bg-warning-100 text-warning-600': transition.color === 'warning',
                'bg-success-100 text-success-600': transition.color === 'success',
                'bg-danger-100 text-danger-600': transition.color === 'danger',
                'bg-primary-100 text-primary-600': transition.color === 'primary',
              }"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-secondary-900">{{ transition.label }}</h3>
              <p class="text-sm text-secondary-500">{{ transition.description }}</p>
            </div>
          </div>

          <!-- Select Asset Item -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-secondary-700 mb-1.5">
              Select Item <span class="text-danger-500">*</span>
            </label>
            <div v-if="eligibleItems.length === 0" class="text-sm text-secondary-400 p-3 bg-secondary-50 rounded-lg">
              No eligible items for this action.
            </div>
            <div v-else class="space-y-2 max-h-40 overflow-y-auto">
              <label
                v-for="item in eligibleItems"
                :key="item.id"
                class="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors"
                :class="
                  selectedItemId === item.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-secondary-200 hover:bg-secondary-50'
                "
              >
                <input
                  v-model="selectedItemId"
                  type="radio"
                  :value="item.id"
                  class="text-primary-600 focus:ring-primary-500"
                />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-mono text-secondary-700">{{ item.id.slice(0, 8) }}…</span>
                  <span v-if="item.location_name" class="text-xs text-secondary-400 ml-2">{{ item.location_name }}</span>
                </div>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
                  :class="statusBadgeClass(item.status)"
                >
                  {{ item.status.replace('_', ' ') }}
                </span>
              </label>
            </div>
          </div>

          <!-- Set Maintenance fields -->
          <template v-if="isSetMode">
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">
                Maintenance Notes <span class="text-danger-500">*</span>
              </label>
              <textarea
                v-model="maintenanceNotes"
                rows="3"
                class="input-field w-full"
                placeholder="Describe the maintenance issue or work needed..."
              ></textarea>
            </div>
          </template>

          <!-- Resolve Maintenance fields -->
          <template v-else>
            <!-- Resolved Status -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">Resolution Status</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in [
                    { value: 'READY', label: 'Ready', bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
                    { value: 'BROKEN', label: 'Broken', bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-300' },
                    { value: 'LIQUIDATED', label: 'Liquidated', bg: 'bg-secondary-100', text: 'text-secondary-700', border: 'border-secondary-300' },
                  ]"
                  :key="opt.value"
                  type="button"
                  @click="resolvedStatus = opt.value as 'READY' | 'BROKEN' | 'LIQUIDATED'"
                  class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                  :class="
                    resolvedStatus === opt.value
                      ? `${opt.bg} ${opt.text} ${opt.border}`
                      : 'bg-white text-secondary-600 border-secondary-200 hover:bg-secondary-50'
                  "
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Repair Cost -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">Repair Cost</label>
              <input v-model.number="repairCost" type="number" min="0" class="input-field w-full" placeholder="0" />
            </div>

            <!-- Description -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
              <textarea
                v-model="description"
                rows="3"
                class="input-field w-full"
                placeholder="What was done to resolve the issue..."
              ></textarea>
            </div>

            <!-- Warning for destructive resolutions -->
            <div
              v-if="resolvedStatus === 'LIQUIDATED'"
              class="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2"
            >
              <svg class="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-danger-800">This action is irreversible</p>
                <p class="text-xs text-danger-600 mt-1">Liquidating removes this item from active inventory.</p>
              </div>
            </div>
          </template>

          <!-- Errors -->
          <div v-if="error || localError" class="mb-4 p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">
            {{ error || localError }}
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
              :disabled="loading"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleConfirm"
              class="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
              :class="{
                'bg-warning-600 text-white hover:bg-warning-700': transition.color === 'warning',
                'bg-success-600 text-white hover:bg-success-700': transition.color === 'success',
                'bg-danger-600 text-white hover:bg-danger-700': transition.color === 'danger',
                'bg-primary-600 text-white hover:bg-primary-700':
                  !transition.color || transition.color === 'primary' || transition.color === 'secondary',
              }"
              :disabled="loading || eligibleItems.length === 0"
            >
              <span v-if="loading" class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
              <span v-else>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
