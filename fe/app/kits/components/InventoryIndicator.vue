<script setup lang="ts">
interface Props {
  complete: number
  missing: number
  tooltip: string
}

defineProps<Props>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft p-6">
    <h3 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Inventory Status
      <div class="relative group">
        <svg class="w-4 h-4 text-secondary-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="absolute left-0 bottom-full mb-2 w-64 p-3 bg-secondary-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          {{ tooltip }}
          <div class="absolute left-4 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-secondary-900"></div>
        </div>
      </div>
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Complete Kits -->
      <div class="bg-success-50 border border-success-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-success-100 rounded-lg">
            <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-success-700">{{ complete }}</p>
            <p class="text-sm text-success-600">Complete kits available</p>
          </div>
        </div>
      </div>

      <!-- Missing Components -->
      <div class="bg-warning-50 border border-warning-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-warning-100 rounded-lg">
            <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-warning-700">{{ missing }}</p>
            <p class="text-sm text-warning-600">Kits missing components</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Indicator Bar -->
    <div class="mt-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm font-medium text-secondary-700">Fulfillment Rate</span>
        <span class="text-sm text-secondary-500">
          {{ complete + missing > 0 ? Math.round((complete / (complete + missing)) * 100) : 0 }}%
        </span>
      </div>
      <div class="h-3 bg-secondary-200 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-success-500 to-success-400 transition-all duration-500"
          :style="{ width: `${complete + missing > 0 ? (complete / (complete + missing)) * 100 : 0}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
