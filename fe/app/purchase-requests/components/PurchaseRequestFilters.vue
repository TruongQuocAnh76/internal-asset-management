<script setup lang="ts">
import type { GetPurchaseRequestsParams, PurchaseRequestStatus } from '../types/purchase-request.types'

interface Props {
  modelValue: GetPurchaseRequestsParams
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: GetPurchaseRequestsParams]
  apply: []
}>()

const statusOptions: { value: PurchaseRequestStatus; label: string }[] = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'TL_APPROVED', label: 'TL Approved' },
  { value: 'BOD_APPROVED', label: 'BOD Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'RECEIVED', label: 'Received' },
]

const selectedStatus = ref<PurchaseRequestStatus | ''>((props.modelValue.filterValue as PurchaseRequestStatus) || '')

const handleStatusChange = () => {
  const updated: GetPurchaseRequestsParams = {
    ...props.modelValue,
    filter: selectedStatus.value ? 'status' : undefined,
    filterValue: selectedStatus.value || undefined,
    page: 1,
  }
  emit('update:modelValue', updated)
  emit('apply')
}

const handleOrderChange = (order: 'asc' | 'desc') => {
  emit('update:modelValue', { ...props.modelValue, order, page: 1 })
  emit('apply')
}

const clearFilters = () => {
  selectedStatus.value = ''
  emit('update:modelValue', { page: 1, limit: props.modelValue.limit })
  emit('apply')
}
</script>

<template>
  <div class="card">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Status Filter -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-secondary-600">Status:</label>
        <select
          v-model="selectedStatus"
          @change="handleStatusChange"
          class="!w-auto !py-2 text-sm"
        >
          <option value="">All</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Sort Order -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-secondary-600">Sort:</label>
        <div class="flex rounded-lg overflow-hidden border border-secondary-300">
          <button
            type="button"
            @click="handleOrderChange('desc')"
            :class="[
              'px-3 py-1.5 text-sm font-medium transition-colors',
              modelValue.order !== 'asc'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-secondary-600 hover:bg-secondary-50',
            ]"
          >
            Newest
          </button>
          <button
            type="button"
            @click="handleOrderChange('asc')"
            :class="[
              'px-3 py-1.5 text-sm font-medium transition-colors',
              modelValue.order === 'asc'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-secondary-600 hover:bg-secondary-50',
            ]"
          >
            Oldest
          </button>
        </div>
      </div>

      <!-- Clear -->
      <button
        type="button"
        @click="clearFilters"
        class="ml-auto text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>
