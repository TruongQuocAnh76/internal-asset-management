<script setup lang="ts">
import type { StateTransition } from '../types/asset.types'
import type { AssetStatus } from '../types/asset.types'

interface Props {
  isOpen: boolean
  transition: StateTransition | null
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'confirm': [status: AssetStatus, reason: string]
}>()

const reason = ref('')

const handleConfirm = () => {
  if (!props.transition) return
  emit('confirm', props.transition.to, reason.value)
}

const handleClose = () => {
  reason.value = ''
  emit('close')
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
        v-if="isOpen" 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div 
            v-if="isOpen && transition"
            class="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <!-- Header -->
            <div class="flex items-center gap-3 mb-4">
              <div 
                class="p-2 rounded-lg"
                :class="{
                  'bg-success-100 text-success-600': transition.color === 'success',
                  'bg-warning-100 text-warning-600': transition.color === 'warning',
                  'bg-danger-100 text-danger-600': transition.color === 'danger',
                  'bg-primary-100 text-primary-600': transition.color === 'primary',
                  'bg-secondary-100 text-secondary-600': !transition.color || transition.color === 'secondary'
                }"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-secondary-900">
                  {{ transition.label }}
                </h3>
                <p class="text-sm text-secondary-500">
                  Change asset status
                </p>
              </div>
            </div>

            <!-- Description -->
            <p class="text-sm text-secondary-600 mb-4">
              {{ transition.description }}
            </p>

            <!-- Reason Input -->
            <div class="mb-6" v-if="transition.requiresReason">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">
                Reason <span class="text-danger-500">*</span>
              </label>
              <textarea
                v-model="reason"
                rows="3"
                class="input-field w-full"
                placeholder="Please provide a reason for this status change..."
              ></textarea>
            </div>

            <!-- Warning for destructive actions -->
            <div 
              v-if="transition.to === 'LIQUIDATED'"
              class="mb-6 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2"
            >
              <svg class="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-danger-800">Warning: This action is irreversible</p>
                <p class="text-xs text-danger-600 mt-1">Liquidating an asset will permanently remove it from active inventory.</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <button
                type="button"
                @click="handleClose"
                class="btn-secondary"
                :disabled="loading"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleConfirm"
                class="btn-primary"
                :class="{
                  'bg-success-600 hover:bg-success-700': transition.color === 'success',
                  'bg-warning-600 hover:bg-warning-700': transition.color === 'warning',
                  'bg-danger-600 hover:bg-danger-700': transition.color === 'danger'
                }"
                :disabled="loading || (transition.requiresReason && !reason.trim())"
              >
                <span v-if="loading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
                <span v-else>Confirm</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
