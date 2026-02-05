<script setup lang="ts">
import type { Asset } from '../types/asset.types'

interface Props {
  asset: Asset
  statusConfig: { color: string; bgColor: string; label: string }
}

defineProps<Props>()

const emit = defineEmits<{
  'edit': []
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft p-6">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="flex items-start gap-4">
        <!-- Asset Icon -->
        <div class="p-4 bg-primary-100 rounded-xl flex-shrink-0">
          <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        <div>
          <!-- Asset Name & Code -->
          <h1 class="text-2xl font-bold text-secondary-900">{{ asset.name }}</h1>
          <p class="text-sm font-mono text-secondary-500 mt-1">{{ asset.code }}</p>

          <!-- Status Badge -->
          <div class="mt-3">
            <span 
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              :class="[statusConfig.bgColor, statusConfig.color]"
            >
              <span class="w-2 h-2 rounded-full mr-2" :class="statusConfig.color.replace('text-', 'bg-')"></span>
              {{ statusConfig.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Edit Button -->
      <button
        @click="emit('edit')"
        class="btn-secondary flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Asset
      </button>
    </div>
  </div>
</template>
