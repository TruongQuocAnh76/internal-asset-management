<script setup lang="ts">
interface Props {
  icon?: 'kit' | 'search' | 'filter' | 'component' | 'assignment'
  title: string
  description?: string
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'kit'
})

const emit = defineEmits<{
  action: []
}>()

const icons = {
  kit: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />`,
  search: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />`,
  filter: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />`,
  component: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />`,
  assignment: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />`
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
      <svg 
        class="w-8 h-8 sm:w-10 sm:h-10 text-secondary-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        v-html="icons[icon]"
      />
    </div>

    <!-- Text -->
    <h3 class="text-lg font-medium text-secondary-900 mb-1">
      {{ title }}
    </h3>
    <p v-if="description" class="text-sm text-secondary-500 max-w-sm">
      {{ description }}
    </p>

    <!-- Action Button -->
    <button
      v-if="actionLabel"
      @click="emit('action')"
      class="mt-6 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {{ actionLabel }}
    </button>
  </div>
</template>
