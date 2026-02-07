<script setup lang="ts">
import type { TimelineEntry, TimelineEventType } from '../types/request.types'
import { useRequestHelpers } from '../composables/useRequestHelpers'

interface Props {
  timeline: TimelineEntry[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const { formatDateTime } = useRequestHelpers()

interface EventConfig {
  icon: string
  color: string
  label: string
}

const getEventConfig = (eventType: TimelineEventType): EventConfig => {
  const configs: Record<TimelineEventType, EventConfig> = {
    CREATED: {
      icon: 'M12 4v16m8-8H4',
      color: 'bg-primary-100 text-primary-600',
      label: 'Request Created'
    },
    SUBMITTED: {
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-primary-100 text-primary-600',
      label: 'Request Submitted'
    },
    APPROVED: {
      icon: 'M5 13l4 4L19 7',
      color: 'bg-success-100 text-success-600',
      label: 'Approved'
    },
    REJECTED: {
      icon: 'M6 18L18 6M6 6l12 12',
      color: 'bg-danger-100 text-danger-600',
      label: 'Rejected'
    },
    CHANGES_REQUESTED: {
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'bg-warning-100 text-warning-600',
      label: 'Changes Requested'
    },
    ASSIGNED: {
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'bg-primary-100 text-primary-600',
      label: 'Asset Assigned'
    },
    PROVIDED: {
      icon: 'M5 13l4 4L19 7',
      color: 'bg-success-100 text-success-600',
      label: 'Asset Provided'
    },
    RETURNED: {
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'bg-success-100 text-success-600',
      label: 'Asset Returned'
    },
    CANCELED: {
      icon: 'M6 18L18 6M6 6l12 12',
      color: 'bg-secondary-100 text-secondary-600',
      label: 'Request Canceled'
    },
    COMMENT: {
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      color: 'bg-secondary-100 text-secondary-600',
      label: 'Comment Added'
    }
  }
  return configs[eventType] || configs.COMMENT
}
</script>

<template>
  <div class="card">
    <h3 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Timeline
    </h3>

    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div v-for="i in 3" :key="i" class="flex gap-4">
        <div class="w-10 h-10 bg-secondary-200 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-secondary-200 rounded w-1/4"></div>
          <div class="h-3 bg-secondary-100 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="timeline.length === 0"
      class="text-center py-8 text-secondary-500"
    >
      <p>No timeline entries yet</p>
    </div>

    <!-- Timeline -->
    <div v-else class="relative">
      <!-- Timeline line -->
      <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-secondary-200"></div>

      <ul class="space-y-6" role="list" aria-label="Request timeline">
        <li
          v-for="(entry, index) in timeline"
          :key="entry.id"
          class="relative flex gap-4"
        >
          <!-- Icon -->
          <div
            :class="[
              'relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
              getEventConfig(entry.event_type).color
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getEventConfig(entry.event_type).icon"
              />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pb-6" :class="{ 'pb-0': index === timeline.length - 1 }">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="font-medium text-secondary-900">
                {{ getEventConfig(entry.event_type).label }}
              </span>
            </div>

            <p v-if="entry.user" class="text-sm text-secondary-500">
              by <span class="font-medium">{{ entry.user.first_name }} {{ entry.user.last_name }}</span>
              · {{ formatDateTime(entry.created_at) }}
            </p>
            <p v-else class="text-sm text-secondary-500">
              {{ formatDateTime(entry.created_at) }}
            </p>

            <!-- Description -->
            <div
              v-if="entry.description"
              class="mt-2 p-3 bg-secondary-50 rounded-lg text-sm text-secondary-700"
            >
              <p class="whitespace-pre-wrap">{{ entry.description }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
