<script setup lang="ts">
import type { RequestFilterOptions, BorrowStatus, RequestPriority } from '../types/request.types'
import { useRequestHelpers } from '../composables/useRequestHelpers'
import { useAuth } from '#imports'

interface Props {
  modelValue: RequestFilterOptions
  showTeamRequests?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTeamRequests: false
})

const emit = defineEmits<{
  'update:modelValue': [value: RequestFilterOptions]
  'apply': []
}>()

const { statusConfig, priorityConfig } = useRequestHelpers()

const localFilters = ref<RequestFilterOptions>({ ...props.modelValue })

const { user } = useAuth()

const isAdmin = computed(() => {
  const roles = user.value?.user_roles?.map((r: any) => r?.role?.name) || []
  return roles.includes('Admin') || roles.includes('ADMIN')
})

const viewOptions = computed(() => {
  const options = [
    { value: 'my_requests', label: 'My Requests' }
  ]

  if (isAdmin.value) {
    options.push({ value: 'all_requests', label: 'All Requests' })
  }

  if (props.showTeamRequests) {
    options.splice(1, 0, { value: 'team_requests', label: 'Team Requests' })
    options.push({ value: 'pending_approval', label: 'Pending My Approval' })
  }

  return options
})

const statusOptions: { value: BorrowStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PROVIDED', label: 'Fulfilled' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' }
]

const priorityOptions: { value: RequestPriority | ''; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Normal' },
  { value: 'LOW', label: 'Low' }
]

// Search with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const handleSearch = (e: Event) => {
  const target = e.target as HTMLInputElement
  localFilters.value.search = target.value

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    emitFilters()
  }, 300)
}

const emitFilters = () => {
  emit('update:modelValue', { ...localFilters.value })
  emit('apply')
}

const clearFilters = () => {
  localFilters.value = {
    view: 'my_requests',
    status: undefined,
    priority: undefined,
    search: ''
  }
  emitFilters()
}

const hasActiveFilters = computed(() => {
  return (
    localFilters.value.status ||
    localFilters.value.priority ||
    localFilters.value.search
  )
})

// Sync with parent
watch(() => props.modelValue, (newVal) => {
  localFilters.value = { ...newVal }
}, { deep: true })
</script>

<template>
  <div class="card">
    <div class="space-y-4">
      <!-- View tabs -->
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Request view filters">
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="localFilters.view === option.value"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            localFilters.view === option.value
              ? 'bg-primary-600 text-white'
              : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
          ]"
          @click="localFilters.view = option.value as RequestFilterOptions['view']; emitFilters()"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Filter row -->
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <label for="search" class="sr-only">Search requests</label>
          <div class="flex items-center gap-2">
            <svg class="h-5 w-5 text-secondary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search"
              type="text"
              :value="localFilters.search"
              @input="handleSearch"
              placeholder="Search by asset name, reason..."
              class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 placeholder-secondary-400"
            />
          </div>
        </div>

        <!-- Status filter -->
        <div class="w-full lg:w-48">
          <label for="status-filter" class="sr-only">Filter by status</label>
          <select
            id="status-filter"
            v-model="localFilters.status"
            @change="emitFilters"
            class="w-full"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value || undefined"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Priority filter -->
        <div class="w-full lg:w-40">
          <label for="priority-filter" class="sr-only">Filter by priority</label>
          <select
            id="priority-filter"
            v-model="localFilters.priority"
            @change="emitFilters"
            class="w-full"
          >
            <option
              v-for="option in priorityOptions"
              :key="option.value"
              :value="option.value || undefined"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Clear filters -->
        <button
          v-if="hasActiveFilters"
          type="button"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap self-center"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>
    </div>
  </div>
</template>
