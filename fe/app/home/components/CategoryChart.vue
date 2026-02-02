<script setup lang="ts">
import type { CategoryData } from '../types/dashboard.types'

interface Props {
  categories: CategoryData[]
  loading?: boolean
}

const props = defineProps<Props>()

const maxCount = computed(() => {
  if (!props.categories?.length) return 1
  return Math.max(...props.categories.map(c => c.count), 1)
})

const categoryColors = [
  'bg-primary-500',
  'bg-success-500',
  'bg-warning-500',
  'bg-danger-500',
  'bg-secondary-500',
  'bg-primary-400',
  'bg-success-400',
  'bg-warning-400',
]

const getBarColor = (index: number) => categoryColors[index % categoryColors.length]
const getBarWidth = (count: number) => `${(count / maxCount.value) * 100}%`
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        Assets by Category
      </h2>
    </div>
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 4" :key="i" class="space-y-2">
          <div class="h-4 w-24 bg-secondary-200 animate-pulse rounded"></div>
          <div class="h-6 bg-secondary-100 animate-pulse rounded-full"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!categories?.length" class="text-center py-8 text-secondary-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No category data available</p>
      </div>

      <!-- Chart -->
      <div v-else class="space-y-4">
        <div v-for="(cat, index) in categories" :key="cat.category" class="space-y-1">
          <div class="flex justify-between items-center text-sm">
            <span class="font-medium text-secondary-700">{{ cat.category }}</span>
            <span class="text-secondary-500">{{ cat.count }}</span>
          </div>
          <div class="h-6 bg-secondary-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :class="getBarColor(index)"
              :style="{ width: getBarWidth(cat.count) }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
