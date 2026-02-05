<script setup lang="ts">
import type { Activity } from '../types/dashboard.types'

interface Props {
  activities: Activity[]
  loading?: boolean
}

defineProps<Props>()

const eventConfig: Record<string, { icon: string; color: string; label: string }> = {
  borrowed: { icon: 'arrow-right', color: 'primary', label: 'Borrowed' },
  returned: { icon: 'arrow-left', color: 'success', label: 'Returned' },
  maintenance: { icon: 'wrench', color: 'warning', label: 'Maintenance' },
  assigned: { icon: 'user-add', color: 'primary', label: 'Assigned' },
  updated: { icon: 'pencil', color: 'secondary', label: 'Updated' },
  created: { icon: 'plus', color: 'success', label: 'Created' },
}

const getEventConfig = (eventType: string) => {
  return eventConfig[eventType] ?? { icon: 'dot', color: 'secondary', label: eventType }
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-secondary-700 to-secondary-800 px-6 py-4 flex justify-between items-center">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recent Activity
      </h2>
    </div>
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 4" :key="i" class="flex gap-3 animate-pulse">
          <div class="w-8 h-8 bg-secondary-200 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-48 bg-secondary-200 rounded"></div>
            <div class="h-3 w-24 bg-secondary-200 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!activities?.length" class="text-center py-8 text-secondary-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No recent activity</p>
      </div>

      <!-- Activity Feed -->
      <div v-else class="relative">
        <!-- Timeline line -->
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary-200"></div>

        <div class="space-y-4">
          <div
            v-for="(activity, index) in activities.slice(0, 6)"
            :key="`${activity.asset_name}-${activity.occurred_at}`"
            class="relative flex gap-4 pl-2"
          >
            <!-- Timeline dot -->
            <div
              class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              :class="{
                'bg-primary-100': getEventConfig(activity.event_type).color === 'primary',
                'bg-success-100': getEventConfig(activity.event_type).color === 'success',
                'bg-warning-100': getEventConfig(activity.event_type).color === 'warning',
                'bg-secondary-100': getEventConfig(activity.event_type).color === 'secondary',
              }"
            >
              <!-- Arrow Right (borrowed) -->
              <svg v-if="getEventConfig(activity.event_type).icon === 'arrow-right'" class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <!-- Arrow Left (returned) -->
              <svg v-else-if="getEventConfig(activity.event_type).icon === 'arrow-left'" class="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <!-- Wrench (maintenance) -->
              <svg v-else-if="getEventConfig(activity.event_type).icon === 'wrench'" class="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <!-- Default dot -->
              <svg v-else class="w-4 h-4 text-secondary-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 pb-4">
              <p class="text-sm text-secondary-900">
                <span class="font-medium">{{ activity.actor_name }}</span>
                <span class="text-secondary-500"> {{ getEventConfig(activity.event_type).label.toLowerCase() }} </span>
                <span class="font-medium">{{ activity.asset_name }}</span>
              </p>
              <p class="text-xs text-secondary-400 mt-0.5">{{ formatTimestamp(activity.occurred_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- View Full Log Link -->
      <NuxtLink
        v-if="activities?.length"
        to="/audit-logs"
        class="mt-4 block text-center text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
      >
        View Full Activity Log →
      </NuxtLink>
    </div>
  </div>
</template>
