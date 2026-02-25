<script setup lang="ts">
import type { KitAuditEntry } from '../types/kit.types'

interface Props {
  entries: KitAuditEntry[]
  loading?: boolean
}

defineProps<Props>()

const getActionColor = (action: KitAuditEntry['action']) => {
  const colors = {
    CREATED: 'bg-success-100 text-success-600',
    UPDATED: 'bg-primary-100 text-primary-600',
    COMPONENT_ADDED: 'bg-success-100 text-success-600',
    COMPONENT_REMOVED: 'bg-danger-100 text-danger-600',
    COMPONENT_REPLACED: 'bg-warning-100 text-warning-600',
    ASSIGNED: 'bg-primary-100 text-primary-600',
    RETURNED: 'bg-success-100 text-success-600',
    ARCHIVED: 'bg-secondary-100 text-secondary-600',
    RESTORED: 'bg-success-100 text-success-600'
  }
  return colors[action] || 'bg-secondary-100 text-secondary-600'
}

const getActionIcon = (action: KitAuditEntry['action']) => {
  const icons = {
    CREATED: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    UPDATED: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    COMPONENT_ADDED: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
    COMPONENT_REMOVED: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
    COMPONENT_REPLACED: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    ASSIGNED: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    RETURNED: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
    ARCHIVED: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    RESTORED: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
  }
  return icons[action] || icons.UPDATED
}

const getActionLabel = (action: KitAuditEntry['action']) => {
  const labels = {
    CREATED: 'Kit Created',
    UPDATED: 'Kit Updated',
    COMPONENT_ADDED: 'Component Added',
    COMPONENT_REMOVED: 'Component Removed',
    COMPONENT_REPLACED: 'Component Replaced',
    ASSIGNED: 'Kit Assigned',
    RETURNED: 'Kit Returned',
    ARCHIVED: 'Kit Archived',
    RESTORED: 'Kit Restored'
  }
  return labels[action] || action
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  }

  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDateTime(dateString)
}

const expandedEntries = ref<Set<string>>(new Set())

const toggleExpand = (entryId: string) => {
  if (expandedEntries.value.has(entryId)) {
    expandedEntries.value.delete(entryId)
  } else {
    expandedEntries.value.add(entryId)
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="px-6 py-4 border-b border-secondary-200">
      <h3 class="text-lg font-semibold text-secondary-900 flex items-center gap-2">
        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Audit Timeline
      </h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6">
      <div v-for="i in 3" :key="i" class="flex gap-4 mb-6 animate-pulse">
        <div class="w-10 h-10 bg-secondary-200 rounded-full"></div>
        <div class="flex-1">
          <div class="h-4 w-48 bg-secondary-200 rounded mb-2"></div>
          <div class="h-3 w-32 bg-secondary-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div v-else-if="entries.length > 0" class="p-6">
      <div class="relative">
        <!-- Timeline line -->
        <div class="absolute left-5 top-0 bottom-0 w-px bg-secondary-200"></div>

        <div
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="relative flex gap-4 pb-6 last:pb-0"
        >
          <!-- Icon -->
          <div
            class="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            :class="getActionColor(entry.action)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getActionIcon(entry.action)" />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-medium text-secondary-900">{{ getActionLabel(entry.action) }}</p>
                <p class="text-sm text-secondary-600">
                  by {{ entry.actor.firstName }} {{ entry.actor.lastName }}
                </p>
              </div>
              <span class="text-xs text-secondary-500 flex-shrink-0" :title="formatDateTime(entry.timestamp)">
                {{ formatRelativeTime(entry.timestamp) }}
              </span>
            </div>

            <!-- Details Toggle -->
            <button
              v-if="entry.before || entry.after || entry.metadata"
              @click="toggleExpand(entry.id)"
              class="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <svg 
                class="w-3 h-3 transition-transform" 
                :class="{ 'rotate-90': expandedEntries.has(entry.id) }"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              {{ expandedEntries.has(entry.id) ? 'Hide details' : 'Show details' }}
            </button>

            <!-- Expanded Details -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-96"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-96"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="expandedEntries.has(entry.id)" class="mt-3 overflow-hidden">
                <div class="bg-secondary-50 rounded-lg p-4 text-sm space-y-3">
                  <div v-if="entry.before" class="flex gap-2">
                    <span class="font-medium text-secondary-700 flex-shrink-0">Before:</span>
                    <pre class="text-secondary-600 whitespace-pre-wrap text-xs font-mono">{{ JSON.stringify(entry.before, null, 2) }}</pre>
                  </div>
                  <div v-if="entry.after" class="flex gap-2">
                    <span class="font-medium text-secondary-700 flex-shrink-0">After:</span>
                    <pre class="text-secondary-600 whitespace-pre-wrap text-xs font-mono">{{ JSON.stringify(entry.after, null, 2) }}</pre>
                  </div>
                  <div v-if="entry.metadata" class="flex gap-2">
                    <span class="font-medium text-secondary-700 flex-shrink-0">Metadata:</span>
                    <pre class="text-secondary-600 whitespace-pre-wrap text-xs font-mono">{{ JSON.stringify(entry.metadata, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-8 text-center">
      <svg class="w-12 h-12 mx-auto text-secondary-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-secondary-600 font-medium">No audit history</p>
      <p class="text-sm text-secondary-500 mt-1">Activity will appear here as changes are made</p>
    </div>
  </div>
</template>
