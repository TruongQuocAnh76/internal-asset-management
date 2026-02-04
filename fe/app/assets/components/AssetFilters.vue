<script setup lang="ts">
import type { GetAssetsParams } from '../types/asset.types'

interface Props {
  modelValue: GetAssetsParams
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: GetAssetsParams]
  'apply': []
}>()

const localFilters = ref<GetAssetsParams>({ ...props.modelValue })
const debounceTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'READY', label: 'Ready' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTAINANCE', label: 'Maintenance' },
  { value: 'BROKEN', label: 'Broken' },
  { value: 'LIQUIDATED', label: 'Liquidated' },
]

const updateFilter = (key: keyof GetAssetsParams, value: any, immediate = true) => {
  localFilters.value = { ...localFilters.value, [key]: value }
  
  // Reset filter_value if filter is changed
  if (key === 'filter' && value !== props.modelValue.filter) {
    localFilters.value.filter_value = ''
  }
  
  if (immediate) {
    emit('update:modelValue', localFilters.value)
    emit('apply')
  } else {
    // Debounce for text inputs
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }
    debounceTimeout.value = setTimeout(() => {
      emit('update:modelValue', localFilters.value)
      emit('apply')
    }, 1000)
  }
}

const updateFilterDebounced = (key: keyof GetAssetsParams, value: any) => {
  updateFilter(key, value, false)
}

const clearFilters = () => {
  localFilters.value = {
    filter: undefined,
    filter_value: '',
    search: '',
    order: 'desc',
    page: 1,
    limit: 10,
  }
  emit('update:modelValue', localFilters.value)
  emit('apply')
}

const hasActiveFilters = computed(() => {
  return localFilters.value.filter_value || localFilters.value.search
})

// Cleanup timeout on unmount
onUnmounted(() => {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft p-6">
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Search -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Search</label>
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-secondary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            :value="localFilters.search"
            @input="updateFilterDebounced('search', ($event.target as HTMLInputElement).value)"
            placeholder="Search by name or code..."
            class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 placeholder-secondary-400"
          />
        </div>
      </div>

      <!-- Filter Type -->
      <div class="w-full lg:w-48">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Filter By</label>
        <select
          :value="localFilters.filter"
          @change="updateFilter('filter', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 bg-white"
        >
          <option value="">No Filter</option>
          <option value="status">Status</option>
          <option value="category">Category</option>
        </select>
      </div>

      <!-- Filter Value (Status) -->
      <div v-if="localFilters.filter === 'status'" class="w-full lg:w-48">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Status</label>
        <select
          :value="localFilters.filter_value"
          @change="updateFilter('filter_value', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 bg-white"
        >
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <!-- Filter Value (Category) -->
      <div v-if="localFilters.filter === 'category'" class="w-full lg:w-48">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Category</label>
        <input
          type="text"
          :value="localFilters.filter_value"
          @input="updateFilterDebounced('filter_value', ($event.target as HTMLInputElement).value)"
          placeholder="Enter category..."
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 placeholder-secondary-400"
        />
      </div>

      <!-- Sort Order -->
      <div class="w-full lg:w-40">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Sort</label>
        <select
          :value="localFilters.order"
          @change="updateFilter('order', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 bg-white"
        >
          <option value="asc">Oldest First</option>
          <option value="desc">Newest First</option>
        </select>
      </div>

      <!-- Clear Filters Button -->
      <div class="flex items-end">
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-4 py-2.5 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  </div>
</template>
