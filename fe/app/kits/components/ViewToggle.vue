<script setup lang="ts">
type ViewMode = 'table' | 'card'

interface Props {
  modelValue: ViewMode
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: ViewMode]
}>()
</script>

<template>
  <div class="inline-flex rounded-lg border border-secondary-200 bg-secondary-100 p-0.5">
    <button
      @click="emit('update:modelValue', 'table')"
      class="p-1.5 rounded transition-colors"
      :class="modelValue === 'table' 
        ? 'bg-white text-primary-600 shadow-sm' 
        : 'text-secondary-500 hover:text-secondary-700'"
      title="Table view"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    </button>
    <button
      @click="emit('update:modelValue', 'card')"
      class="p-1.5 rounded transition-colors"
      :class="modelValue === 'card' 
        ? 'bg-white text-primary-600 shadow-sm' 
        : 'text-secondary-500 hover:text-secondary-700'"
      title="Card view"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    </button>
  </div>
</template>
