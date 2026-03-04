<script setup lang="ts">
import type { PurchaseRequestStatus } from '../types/purchase-request.types'

interface Props {
  status: PurchaseRequestStatus
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const statusConfig: Record<PurchaseRequestStatus, { label: string; bgClass: string; textClass: string; icon: string }> = {
  SUBMITTED: {
    label: 'Submitted',
    bgClass: 'bg-primary-50',
    textClass: 'text-primary-700',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  TL_APPROVED: {
    label: 'TL Approved',
    bgClass: 'bg-success-50',
    textClass: 'text-success-700',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  BOD_APPROVED: {
    label: 'BOD Approved',
    bgClass: 'bg-success-100',
    textClass: 'text-success-800',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  },
  REJECTED: {
    label: 'Rejected',
    bgClass: 'bg-danger-50',
    textClass: 'text-danger-700',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  RECEIVED: {
    label: 'Received',
    bgClass: 'bg-warning-50',
    textClass: 'text-warning-700',
    icon: 'M5 13l4 4L19 7',
  },
}

const config = computed(() => statusConfig[props.status])

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'px-2 py-0.5 text-xs'
    case 'lg': return 'px-4 py-2 text-base'
    default: return 'px-3 py-1 text-sm'
  }
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-3 h-3'
    case 'lg': return 'w-5 h-5'
    default: return 'w-4 h-4'
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      config.bgClass,
      config.textClass,
      sizeClasses,
    ]"
  >
    <svg
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
