<script setup lang="ts">
import type { RequestPermissions } from '../types/request.types'

interface Props {
  permissions: RequestPermissions
  isProcessing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'cancel': []
  'approve': []
  'reject': []
  'request-changes': []
  'assign-asset': []
  'mark-fulfilled': []
  'request-return': []
}>()
</script>

<template>
  <div class="card">
    <h3 class="text-lg font-semibold text-secondary-900 mb-4">Actions</h3>

    <div class="space-y-3">
      <!-- Requester actions -->
      <template v-if="permissions.canCancel">
        <button
          type="button"
          class="w-full btn bg-danger-50 text-danger-700 hover:bg-danger-100 border border-danger-200"
          :disabled="isProcessing"
          @click="emit('cancel')"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel Request
          </span>
        </button>
      </template>

      <!-- Approver actions -->
      <template v-if="permissions.canApprove || permissions.canReject || permissions.canRequestChanges">
        <div class="pt-2 border-t border-secondary-200">
          <p class="text-sm font-medium text-secondary-500 mb-3">Approval Actions</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              v-if="permissions.canApprove"
              type="button"
              class="btn bg-success-600 text-white hover:bg-success-700"
              :disabled="isProcessing"
              @click="emit('approve')"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve
              </span>
            </button>

            <button
              v-if="permissions.canReject"
              type="button"
              class="btn bg-danger-600 text-white hover:bg-danger-700"
              :disabled="isProcessing"
              @click="emit('reject')"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject
              </span>
            </button>

            <button
              v-if="permissions.canRequestChanges"
              type="button"
              class="btn bg-warning-500 text-white hover:bg-warning-600"
              :disabled="isProcessing"
              @click="emit('request-changes')"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Request Changes
              </span>
            </button>
          </div>
        </div>
      </template>

      <!-- Fulfiller actions -->
      <template v-if="permissions.canAssignAsset || permissions.canMarkFulfilled || permissions.canRequestReturn">
        <div class="pt-2 border-t border-secondary-200">
          <p class="text-sm font-medium text-secondary-500 mb-3">Fulfillment Actions</p>

          <div class="space-y-2">
            <button
              v-if="permissions.canAssignAsset"
              type="button"
              class="w-full btn-primary"
              :disabled="isProcessing"
              @click="emit('assign-asset')"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Assign Asset
              </span>
            </button>

            <button
              v-if="permissions.canMarkFulfilled"
              type="button"
              class="w-full btn bg-success-600 text-white hover:bg-success-700"
              :disabled="isProcessing"
              @click="emit('mark-fulfilled')"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Mark as Fulfilled
              </span>
            </button>

            <button
              v-if="permissions.canRequestReturn"
              type="button"
              class="w-full btn-secondary"
              :disabled="isProcessing"
              @click="emit('request-return')"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                Request Return
              </span>
            </button>
          </div>
        </div>
      </template>

      <!-- No actions available -->
      <div
        v-if="!permissions.canCancel && !permissions.canApprove && !permissions.canReject && 
              !permissions.canRequestChanges && !permissions.canAssignAsset && 
              !permissions.canMarkFulfilled && !permissions.canRequestReturn"
        class="text-center py-4 text-secondary-500"
      >
        <svg
          class="w-8 h-8 mx-auto text-secondary-400 mb-2"
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
        <p class="text-sm">No actions available for this request</p>
      </div>
    </div>
  </div>
</template>
