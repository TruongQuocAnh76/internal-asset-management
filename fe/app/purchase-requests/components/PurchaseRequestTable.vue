<script setup lang="ts">
import type { PurchaseRequest } from '../types/purchase-request.types'
import PurchaseRequestStatusBadge from './PurchaseRequestStatusBadge.vue'

interface Props {
  requests: PurchaseRequest[]
  loading: boolean
  currentPage: number
  totalPages: number
}

defineProps<Props>()

const emit = defineEmits<{
  'page-change': [page: number]
  'request-click': [request: PurchaseRequest]
  'approve': [request: PurchaseRequest]
  'reject': [request: PurchaseRequest]
}>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatCost = (cost: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
  }).format(cost)
}
</script>

<template>
  <div class="card p-0 overflow-hidden">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3 text-secondary-500">
        <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="font-medium">Loading requests...</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="requests.length === 0" class="flex flex-col items-center justify-center py-16 text-secondary-400">
      <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-lg font-medium">No purchase requests found</p>
      <p class="text-sm mt-1">Try adjusting your filters or create a new request</p>
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead class="bg-secondary-50 border-b border-secondary-200">
        <tr>
          <th class="text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Requester</th>
          <th class="text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Category</th>
          <th class="text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Reason</th>
          <th class="text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Est. Cost</th>
          <th class="text-center text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Qty</th>
          <th class="text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Status</th>
          <th class="text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider px-6 py-3">Requested</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-secondary-100">
        <tr
          v-for="request in requests"
          :key="request.id"
          @click="emit('request-click', request)"
          class="hover:bg-secondary-50 transition-colors cursor-pointer"
        >
          <td class="px-6 py-4">
            <div class="text-sm font-medium text-secondary-900">
              {{ request.user.first_name }} {{ request.user.last_name }}
            </div>
            <div class="text-xs text-secondary-400">{{ request.user.email }}</div>
          </td>
          <td class="px-6 py-4">
            <span class="text-sm text-secondary-700">{{ request.category.name }}</span>
          </td>
          <td class="px-6 py-4 max-w-xs">
            <p class="text-sm text-secondary-600 truncate">{{ request.reason || '—' }}</p>
          </td>
          <td class="px-6 py-4 text-right">
            <span class="text-sm font-medium text-secondary-900">{{ formatCost(request.estimated_cost) }}</span>
          </td>
          <td class="px-6 py-4 text-center">
            <span class="text-sm text-secondary-700">{{ request.quantity }}</span>
          </td>
          <td class="px-6 py-4">
            <PurchaseRequestStatusBadge :status="request.status" size="sm" />
          </td>
          <td class="px-6 py-4">
            <span class="text-sm text-secondary-500">{{ formatDate(request.requested_at) }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-secondary-200 bg-secondary-50">
      <button
        :disabled="currentPage <= 1"
        @click="emit('page-change', currentPage - 1)"
        class="btn-secondary !py-1.5 !px-3 text-sm"
      >
        Previous
      </button>
      <span class="text-sm text-secondary-600">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        :disabled="currentPage >= totalPages"
        @click="emit('page-change', currentPage + 1)"
        class="btn-secondary !py-1.5 !px-3 text-sm"
      >
        Next
      </button>
    </div>
  </div>
</template>
