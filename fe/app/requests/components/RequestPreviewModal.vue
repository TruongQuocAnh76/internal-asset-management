<script setup lang="ts">
import type { RequestFormData, RequestAsset, RequestKit } from '../types/request.types'
import PriorityBadge from './PriorityBadge.vue'

interface Props {
  isOpen: boolean
  formData: RequestFormData
  requesterInfo: {
    name: string
    email: string
    department: string
  }
  selectedAsset: RequestAsset | null
  selectedKit: RequestKit | null
  isSubmitting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'confirm': []
}>()

const handleClose = () => {
  if (!props.isSubmitting) {
    emit('close')
  }
}

const handleConfirm = () => {
  emit('confirm')
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
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
            v-if="isOpen"
            class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
              <div>
                <h2 id="preview-title" class="text-lg font-semibold text-secondary-900">
                  Review Your Request
                </h2>
                <p class="text-sm text-secondary-500">
                  Please review the details before submitting
                </p>
              </div>
              <button
                type="button"
                class="p-2 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
                @click="handleClose"
                :disabled="isSubmitting"
                aria-label="Close preview"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="px-6 py-4 overflow-y-auto flex-1">
              <div class="space-y-6">
                <!-- Requester Info -->
                <div>
                  <h3 class="text-sm font-medium text-secondary-500 uppercase tracking-wider mb-2">
                    Requester
                  </h3>
                  <div class="bg-secondary-50 rounded-lg p-4">
                    <p class="font-medium text-secondary-900">{{ requesterInfo.name }}</p>
                    <p class="text-sm text-secondary-600">{{ requesterInfo.department }}</p>
                  </div>
                </div>

                <!-- Asset Info -->
                <div v-if="formData.type === 'asset'">
                  <h3 class="text-sm font-medium text-secondary-500 uppercase tracking-wider mb-2">
                    Requested Asset
                  </h3>
                  <div class="bg-secondary-50 rounded-lg p-4">
                    <p class="font-medium text-secondary-900">
                      {{ selectedAsset?.name || 'Not selected' }}
                    </p>
                    <p v-if="selectedAsset" class="text-sm text-secondary-600">
                      {{ selectedAsset.code }}
                    </p>
                  </div>
                </div>

                <!-- Kit Info -->
                <div v-if="formData.type === 'kit'">
                  <h3 class="text-sm font-medium text-secondary-500 uppercase tracking-wider mb-2">
                    Requested Kit
                  </h3>
                  <div class="bg-secondary-50 rounded-lg p-4">
                    <p class="font-medium text-secondary-900">
                      {{ selectedKit?.template?.name || 'Not selected' }}
                    </p>
                    <p v-if="selectedKit" class="text-sm text-secondary-600">
                      Kit #{{ selectedKit.id.slice(0, 8).toUpperCase() }}
                    </p>
                  </div>
                </div>

                <!-- Reason -->
                <div>
                  <h3 class="text-sm font-medium text-secondary-500 uppercase tracking-wider mb-2">
                    Reason / Justification
                  </h3>
                  <div class="bg-secondary-50 rounded-lg p-4">
                    <p class="text-secondary-700 whitespace-pre-wrap">{{ formData.reason }}</p>
                  </div>
                </div>

                <!-- Priority -->
                <div>
                  <h3 class="text-sm font-medium text-secondary-500 uppercase tracking-wider mb-2">
                    Priority
                  </h3>
                  <PriorityBadge :priority="formData.priority" />
                </div>

                <!-- Due Date -->
                <div v-if="formData.dueDate">
                  <h3 class="text-sm font-medium text-secondary-500 uppercase tracking-wider mb-2">
                    Due Date
                  </h3>
                  <p class="text-secondary-700">{{ new Date(formData.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}</p>
                </div>

                <!-- Approval note -->
                <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <svg
                      class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-primary-800">Approval Process</p>
                      <p class="text-sm text-primary-700 mt-1">
                        Your request will be sent to your Team Lead for approval.
                        Once approved, an Admin will assign an available asset to you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-secondary-200 flex flex-col sm:flex-row gap-3 justify-end bg-secondary-50">
              <button
                type="button"
                class="btn-secondary order-2 sm:order-1"
                @click="handleClose"
                :disabled="isSubmitting"
              >
                Edit Request
              </button>
              <button
                type="button"
                class="btn-primary order-1 sm:order-2"
                @click="handleConfirm"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </span>
                <span v-else>Submit Request</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
