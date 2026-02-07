<script setup lang="ts">
import type { BorrowStatus } from '../types/request.types'
import { useRequestHelpers } from '../composables/useRequestHelpers'

interface Props {
  status: BorrowStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showIcon: true
})

const { getStatusConfig } = useRequestHelpers()

const config = computed(() => getStatusConfig(props.status))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs'
    case 'lg':
      return 'px-4 py-2 text-base'
    default:
      return 'px-3 py-1 text-sm'
  }
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3 h-3'
    case 'lg':
      return 'w-5 h-5'
    default:
      return 'w-4 h-4'
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      config.bgClass,
      config.textClass,
      sizeClasses
    ]"
    role="status"
    :aria-label="`Status: ${config.label}`"
  >
    <svg
      v-if="showIcon"
      :class="iconSize"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        :d="config.icon"
      />
    </svg>
    {{ config.label }}
  </span>
</template>
