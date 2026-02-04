<script setup lang="ts">
import type { Asset } from '../types/asset.types'

interface Props {
  assets: Asset[]
  loading?: boolean
  currentPage: number
  totalPages: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'page-change': [page: number]
  'asset-click': [asset: Asset]
}>()

const getStatusColor = (status: string) => {
  const colors = {
    READY: 'bg-success-100 text-success-700 border-success-200',
    IN_USE: 'bg-primary-100 text-primary-700 border-primary-200',
    MAINTAINANCE: 'bg-warning-100 text-warning-700 border-warning-200',
    BROKEN: 'bg-danger-100 text-danger-700 border-danger-200',
    LIQUIDATED: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  }
  return colors[status as keyof typeof colors] || 'bg-secondary-100 text-secondary-700'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}

const handleAssetClick = (asset: Asset) => {
  emit('asset-click', asset)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-secondary-50 border-b border-secondary-200">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Code
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Category
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Cost
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
              Acquired Date
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-secondary-100">
          <tr v-if="loading" v-for="i in 5" :key="i">
            <td v-for="j in 6" :key="j" class="px-6 py-4">
              <div class="h-5 bg-secondary-200 animate-pulse rounded"></div>
            </td>
          </tr>
          <tr 
            v-else
            v-for="asset in assets" 
            :key="asset.code"
            @click="handleAssetClick(asset)"
            class="hover:bg-secondary-50 cursor-pointer transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-mono font-medium text-secondary-900">{{ asset.code }}</span>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-secondary-900">{{ asset.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-secondary-600">{{ asset.category?.name || 'N/A' }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                :class="getStatusColor(asset.status)"
              >
                {{ asset.status.replace('_', ' ') }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-secondary-900">{{ formatCurrency(asset.costs) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-secondary-600">{{ formatDate(asset.acquired_at) }}</span>
            </td>
          </tr>
          <tr v-if="!loading && assets.length === 0">
            <td colspan="6" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center justify-center text-secondary-500">
                <svg class="w-12 h-12 mb-3 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-lg font-medium">No assets found</p>
                <p class="text-sm mt-1">Try adjusting your filters or search criteria</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && assets.length > 0" class="px-6 py-4 bg-secondary-50 border-t border-secondary-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-secondary-600">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <div class="flex gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="currentPage === 1 
              ? 'bg-secondary-200 text-secondary-500' 
              : 'bg-white text-secondary-700 hover:bg-secondary-100 border border-secondary-300'"
          >
            Previous
          </button>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="currentPage === totalPages 
              ? 'bg-secondary-200 text-secondary-500' 
              : 'bg-white text-secondary-700 hover:bg-secondary-100 border border-secondary-300'"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
