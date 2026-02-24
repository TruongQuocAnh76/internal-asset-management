<script setup lang="ts">
import type { Kit } from '../types/kit.types'

interface Props {
  kits: Kit[]
  loading?: boolean
  currentPage: number
  totalPages: number
  selectedIds?: Set<string>
  showSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSelection: false,
  selectedIds: () => new Set()
})

const emit = defineEmits<{
  'page-change': [page: number]
  'kit-click': [kit: Kit]
  'toggle-select': [kitId: string]
  'toggle-select-all': []
}>()

const getStatusColor = (status: string) => {
  const colors = {
    ACTIVE: 'bg-success-100 text-success-700 border-success-200',
    ARCHIVED: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    DRAFT: 'bg-warning-100 text-warning-700 border-warning-200',
  }
  return colors[status as keyof typeof colors] || 'bg-secondary-100 text-secondary-700 border-secondary-200'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes}m ago`
    }
    return `${diffHours}h ago`
  }

  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}

const handleKitClick = (kit: Kit, event: MouseEvent) => {
  // Don't navigate if clicking on checkbox
  if ((event.target as HTMLElement).closest('.checkbox-wrapper')) {
    return
  }
  emit('kit-click', kit)
}

const isAllSelected = computed(() => {
  return props.kits.length > 0 && props.kits.every(k => props.selectedIds?.has(k.id))
})

const isPartiallySelected = computed(() => {
  return props.kits.some(k => props.selectedIds?.has(k.id)) && !isAllSelected.value
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-secondary-50 border-b border-secondary-200">
          <tr>
            <th v-if="showSelection" class="px-4 py-4 text-left">
              <div class="checkbox-wrapper">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isPartiallySelected"
                  @change="emit('toggle-select-all')"
                  class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Kit Name
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Components
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Available Kits
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-secondary-100">
          <!-- Loading State -->
          <tr v-if="loading" v-for="i in 5" :key="i">
            <td v-if="showSelection" class="px-4 py-4">
              <div class="h-4 w-4 bg-secondary-200 animate-pulse rounded"></div>
            </td>
            <td v-for="j in 5" :key="j" class="px-6 py-4">
              <div class="h-5 bg-secondary-200 animate-pulse rounded"></div>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr 
            v-else
            v-for="kit in kits" 
            :key="kit.id"
            @click="handleKitClick(kit, $event)"
            class="hover:bg-secondary-50 cursor-pointer transition-colors"
            :class="{ 'bg-primary-50': selectedIds?.has(kit.id) }"
          >
            <td v-if="showSelection" class="px-4 py-4">
              <div class="checkbox-wrapper" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds?.has(kit.id)"
                  @change="emit('toggle-select', kit.id)"
                  class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </td>
            <td class="px-6 py-4">
              <div>
                <div class="text-sm font-medium text-secondary-900">{{ kit.template.name }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span class="text-sm font-medium text-secondary-900">{{ kit.template.template_items?.length || 0 }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border"
                :class="kit.asset_items?.length > 0 ? 'bg-success-50 border-success-300 text-success-700' : 'bg-secondary-50 border-secondary-300 text-secondary-600'"
              >
                {{ kit.asset_items?.length || 0 }} items
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                :class="getStatusColor(kit.status)"
              >
                {{ kit.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div>
                <span class="text-sm text-secondary-900" :title="formatDate(kit.created_at)">
                  {{ formatRelativeTime(kit.created_at) }}
                </span>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!loading && kits.length === 0">
            <td :colspan="showSelection ? 6 : 5" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center justify-center text-secondary-500">
                <svg class="w-12 h-12 mb-3 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p class="text-lg font-medium">No kits found</p>
                <p class="text-sm mt-1">Try adjusting your filters or create a new kit</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && kits.length > 0" class="px-6 py-4 bg-secondary-50 border-t border-secondary-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-secondary-600">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <div class="flex gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="currentPage === 1 
              ? 'bg-secondary-200 text-secondary-500' 
              : 'bg-white text-secondary-700 hover:bg-secondary-100 border border-secondary-300'"
          >
            Previous
          </button>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="currentPage === totalPages 
              ? 'bg-secondary-200 text-secondary-500' 
              : 'bg-white text-secondary-700 hover:bg-secondary-100 border border-secondary-300'"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
