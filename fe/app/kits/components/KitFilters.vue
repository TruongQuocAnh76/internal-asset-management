<script setup lang="ts">
import type { GetKitsParams } from '../types/kit.types'

interface Props {
  modelValue: GetKitsParams
  categories?: { name: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: GetKitsParams]
  'apply': []
}>()

const localFilters = ref<GetKitsParams>({ ...props.modelValue })
const debounceTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'DRAFT', label: 'Draft' },
]

const updateFilter = (key: keyof GetKitsParams, value: any, immediate = true) => {
  localFilters.value = { ...localFilters.value, [key]: value }

  if (immediate) {
    emit('update:modelValue', localFilters.value)
    emit('apply')
  } else {
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value)
    }
    debounceTimeout.value = setTimeout(() => {
      emit('update:modelValue', localFilters.value)
      emit('apply')
    }, 500)
  }
}

const clearFilters = () => {
  localFilters.value = {
    search: '',
    category: '',
    status: undefined,
    filter: undefined,
    order: 'desc',
    page: 1,
    limit: 10,
  }
  emit('update:modelValue', localFilters.value)
  emit('apply')
}

const hasActiveFilters = computed(() => {
  return localFilters.value.search || localFilters.value.category || localFilters.value.status
})

watch(() => props.modelValue, (newVal) => {
  localFilters.value = { ...newVal }
}, { deep: true })

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
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            :value="localFilters.search"
            @input="updateFilter('search', ($event.target as HTMLInputElement).value, false)"
            placeholder="Search by kit name..."
            class="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 placeholder-secondary-400"
          />
        </div>
      </div>

      <!-- Category Filter -->
      <div class="w-full lg:w-48">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Category</label>
        <select
          :value="localFilters.category"
          @change="updateFilter('category', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 bg-white"
        >
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Status Filter -->
      <div class="w-full lg:w-40">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Status</label>
        <select
          :value="localFilters.status"
          @change="updateFilter('status', ($event.target as HTMLSelectElement).value || undefined)"
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 bg-white"
        >
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <!-- Sort Order -->
      <div class="w-full lg:w-40">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Sort</label>
        <select
          :value="localFilters.order"
          @change="updateFilter('order', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow text-secondary-900 bg-white"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <!-- Clear Filters -->
      <div class="flex items-end">
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-4 py-2.5 text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          Clear filters
        </button>
      </div>
    </div>
  </div>
</template>
