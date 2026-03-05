<script setup lang="ts">
interface Props {
  totalAssets?: number
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'export': []
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-secondary-900">Assets Management</h1>
        <p class="mt-2 text-secondary-600">
          <span v-if="loading" class="inline-block h-5 w-32 bg-secondary-200 animate-pulse rounded"></span>
          <span v-else>Manage and track all your assets in one place ({{ totalAssets || 0 }} total)</span>
        </p>
      </div>
      <div class="flex gap-3">
        <button
          @click="emit('export')"
          class="px-4 py-2.5 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>
    </div>
  </div>
</template>
