<script setup lang="ts">
interface Props {
  totalRequests: number
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'create': []
  'export': []
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-secondary-900">My Requests</h1>
      <p class="text-secondary-500 mt-1">
        <span v-if="loading" class="inline-flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading...
        </span>
        <span v-else>{{ totalRequests }} request{{ totalRequests !== 1 ? 's' : '' }}</span>
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="btn-secondary flex items-center gap-2"
        @click="emit('export')"
        aria-label="Export requests"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span class="hidden sm:inline">Export</span>
      </button>
      
      <button
        type="button"
        class="btn-primary flex items-center gap-2"
        @click="emit('create')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>New Request</span>
      </button>
    </div>
  </div>
</template>
