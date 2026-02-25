<script setup lang="ts">
import type { BorrowRequest } from '../types/request.types'
import { useRequestHelpers } from '../composables/useRequestHelpers'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'

interface Props {
  request: BorrowRequest
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'click': []
  'cancel': []
}>()

const { getRelativeTime } = useRequestHelpers()

const requestTitle = computed(() => {
  if (props.request.kit) {
    return props.request.kit.template?.name || 'Kit Request'
  }
  return props.request.asset?.name || 'Asset Request'
})

const requestType = computed(() => {
  return props.request.kit_id ? 'kit' : 'asset'
})

const canCancel = computed(() => {
  return props.request.status === 'PENDING' || props.request.status === 'APPROVED'
})

const handleCancel = (e: Event) => {
  e.stopPropagation()
  emit('cancel')
}
</script>

<template>
  <div
    class="card hover:shadow-md transition-shadow cursor-pointer group"
    @click="emit('click')"
    role="button"
    tabindex="0"
    @keydown.enter="emit('click')"
    @keydown.space.prevent="emit('click')"
    :aria-label="`Request for ${requestTitle}, ${request.status}`"
  >
    <div class="flex flex-col sm:flex-row sm:items-center gap-4">
      <!-- Icon -->
      <div
        :class="[
          'hidden sm:flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0',
          request.status === 'PENDING' ? 'bg-warning-100' :
          request.status === 'APPROVED' ? 'bg-success-100' :
          request.status === 'PROVIDED' ? 'bg-success-100' :
          request.status === 'REJECTED' ? 'bg-danger-100' :
          'bg-secondary-100'
        ]"
      >
        <svg
          :class="[
            'w-6 h-6',
            request.status === 'PENDING' ? 'text-warning-600' :
            request.status === 'APPROVED' ? 'text-success-600' :
            request.status === 'PROVIDED' ? 'text-success-600' :
            request.status === 'REJECTED' ? 'text-danger-600' :
            'text-secondary-500'
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>

      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-start gap-2 mb-1">
          <h3 class="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
            {{ requestTitle }}
          </h3>
          <span
            :class="[
              'px-2 py-0.5 text-xs font-medium rounded-full',
              requestType === 'kit'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            ]"
          >
            {{ requestType === 'kit' ? 'Kit' : 'Asset' }}
          </span>
          <StatusBadge :status="request.status" size="sm" />
          <PriorityBadge :priority="request.priority" size="sm" />
        </div>

        <p v-if="request.reason" class="text-sm text-secondary-500 truncate">
          {{ request.reason }}
        </p>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-secondary-500">
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            {{ request.id.slice(0, 8).toUpperCase() }}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{ getRelativeTime(request.created_at) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 self-start sm:self-center">
        <button
          v-if="canCancel"
          type="button"
          class="px-3 py-1.5 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
          @click="handleCancel"
          aria-label="Cancel request"
        >
          Cancel
        </button>
        
        <svg
          class="w-5 h-5 text-secondary-400 group-hover:text-primary-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
