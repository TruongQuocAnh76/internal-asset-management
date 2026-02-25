<script setup lang="ts">
import type { RequestPriority } from '../types/request.types'
import { useRequestHelpers } from '../composables/useRequestHelpers'

interface Props {
  priority: RequestPriority
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showLabel: true
})

const { getPriorityConfig } = useRequestHelpers()

const config = computed(() => getPriorityConfig(props.priority))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs'
    case 'lg':
      return 'px-4 py-2 text-base'
    default:
      return 'px-2.5 py-1 text-sm'
  }
})

const dotSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-1.5 h-1.5'
    case 'lg':
      return 'w-3 h-3'
    default:
      return 'w-2 h-2'
  }
})

const dotColorClass = computed(() => {
  switch (props.priority) {
    case 'HIGH':
      return 'bg-danger-500'
    case 'MEDIUM':
      return 'bg-primary-500'
    default:
      return 'bg-secondary-400'
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
    :aria-label="`Priority: ${config.label}`"
  >
    <span :class="['rounded-full', dotSize, dotColorClass]" aria-hidden="true"></span>
    <span v-if="showLabel">{{ config.label }}</span>
  </span>
</template>
