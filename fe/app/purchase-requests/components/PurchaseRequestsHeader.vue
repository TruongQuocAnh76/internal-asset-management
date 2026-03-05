<script setup lang="ts">
interface Props {
  totalRequests: number
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-secondary-900">Purchase Requests</h1>
      <p class="text-secondary-500 mt-1">
        {{ loading ? 'Loading...' : `${totalRequests} request${totalRequests !== 1 ? 's' : ''} total` }}
      </p>
    </div>
    <button @click="emit('create')" class="btn-primary flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      New Request
    </button>
  </div>
</template>
