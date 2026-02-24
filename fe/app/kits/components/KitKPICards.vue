<script setup lang="ts">
import type { KitKPIs } from '../types/kit.types'

interface Props {
  kpis: KitKPIs | null
  loading?: boolean
  activeFilter?: 'low_stock' | 'recently_modified' | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'filter': [filter: 'low_stock' | 'recently_modified' | null]
}>()

const handleClick = (filter: 'low_stock' | 'recently_modified' | null) => {
  if (props.activeFilter === filter) {
    emit('filter', null)
  } else {
    emit('filter', filter)
  }
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Total Kits -->
    <button
      @click="handleClick(null)"
      class="bg-white rounded-xl shadow-soft p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      :class="{ 'ring-2 ring-primary-500': activeFilter === null && activeFilter !== undefined }"
    >
      <div v-if="loading" class="animate-pulse">
        <div class="h-4 w-20 bg-secondary-200 rounded mb-3"></div>
        <div class="h-8 w-16 bg-secondary-200 rounded"></div>
      </div>
      <template v-else>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-primary-100 rounded-lg">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span class="text-sm font-medium text-secondary-600">Total Kits</span>
        </div>
        <p class="text-3xl font-bold text-secondary-900">{{ kpis?.totalKits ?? 0 }}</p>
      </template>
    </button>

    <!-- Low on Stock -->
    <button
      @click="handleClick('low_stock')"
      class="bg-white rounded-xl shadow-soft p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2"
      :class="{ 'ring-2 ring-warning-500': activeFilter === 'low_stock' }"
    >
      <div v-if="loading" class="animate-pulse">
        <div class="h-4 w-20 bg-secondary-200 rounded mb-3"></div>
        <div class="h-8 w-16 bg-secondary-200 rounded"></div>
      </div>
      <template v-else>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-warning-100 rounded-lg">
            <svg class="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-secondary-600">Low on Stock</span>
            <span class="text-xs text-secondary-400">(threshold: {{ kpis?.lowStockThreshold ?? 5 }})</span>
          </div>
        </div>
        <p class="text-3xl font-bold" :class="(kpis?.kitsLowOnStock ?? 0) > 0 ? 'text-warning-600' : 'text-secondary-900'">
          {{ kpis?.kitsLowOnStock ?? 0 }}
        </p>
      </template>
    </button>

    <!-- Recently Modified -->
    <button
      @click="handleClick('recently_modified')"
      class="bg-white rounded-xl shadow-soft p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2"
      :class="{ 'ring-2 ring-success-500': activeFilter === 'recently_modified' }"
    >
      <div v-if="loading" class="animate-pulse">
        <div class="h-4 w-20 bg-secondary-200 rounded mb-3"></div>
        <div class="h-8 w-16 bg-secondary-200 rounded"></div>
      </div>
      <template v-else>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-success-100 rounded-lg">
            <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-sm font-medium text-secondary-600">Recently Modified</span>
        </div>
        <p class="text-3xl font-bold text-secondary-900">{{ kpis?.recentlyModifiedKits ?? 0 }}</p>
      </template>
    </button>
  </div>
</template>
