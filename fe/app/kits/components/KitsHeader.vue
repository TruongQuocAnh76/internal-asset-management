<script setup lang="ts">
interface Props {
  totalKits: number
  loading?: boolean
  selectedCount?: number
}

defineProps<Props>()

const emit = defineEmits<{
  'create-kit': []
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-secondary-900">Kits</h1>
      <p class="text-secondary-600 mt-1">
        <span v-if="loading" class="inline-block h-4 w-24 bg-secondary-200 animate-pulse rounded"></span>
        <span v-else>{{ totalKits }} kit{{ totalKits !== 1 ? 's' : '' }} in total</span>
        <span v-if="selectedCount" class="ml-2 text-primary-600 font-medium">
          ({{ selectedCount }} selected)
        </span>
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        @click="emit('create-kit')"
        class="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-soft"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Kit Builder
      </button>
    </div>
  </div>
</template>
