<script setup lang="ts">
import type { Asset } from '../types/asset.types'

interface Props {
  asset: Asset
  formatCurrency: (value: number | null | undefined) => string
  formatDate: (date: string | null | undefined) => string
}

const props = defineProps<Props>()

const specsEntries = computed(() => {
  const specs = props.asset.asset_specs?.specs
  if (!specs || typeof specs !== 'object') return []
  return Object.entries(specs as Record<string, unknown>)
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Basic Information -->
    <div class="bg-white rounded-xl shadow-soft p-6">
      <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Basic Information
      </h2>

      <dl class="space-y-4">
        <div class="flex justify-between py-2 border-b border-secondary-100">
          <dt class="text-sm text-secondary-500">Category</dt>
          <dd class="text-sm font-medium text-secondary-900">
            {{ asset.category?.name || 'Uncategorized' }}
          </dd>
        </div>

        <div class="flex justify-between py-2 border-b border-secondary-100">
          <dt class="text-sm text-secondary-500">Location</dt>
          <dd class="text-sm font-medium text-secondary-900">
            {{ asset.location_name || 'Not specified' }}
          </dd>
        </div>

        <div class="flex justify-between py-2 border-b border-secondary-100">
          <dt class="text-sm text-secondary-500">Acquired Date</dt>
          <dd class="text-sm font-medium text-secondary-900">
            {{ formatDate(asset.acquired_at) }}
          </dd>
        </div>

        <div class="flex justify-between py-2 border-b border-secondary-100">
          <dt class="text-sm text-secondary-500">Created</dt>
          <dd class="text-sm font-medium text-secondary-900">
            {{ formatDate(asset.created_at) }}
          </dd>
        </div>

        <div class="flex justify-between py-2">
          <dt class="text-sm text-secondary-500">Last Updated</dt>
          <dd class="text-sm font-medium text-secondary-900">
            {{ formatDate(asset.updated_at) }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Financial Information -->
    <div class="bg-white rounded-xl shadow-soft p-6">
      <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Financial Information
      </h2>

      <dl class="space-y-4">
        <div class="flex justify-between py-2 border-b border-secondary-100">
          <dt class="text-sm text-secondary-500">Purchase Cost</dt>
          <dd class="text-sm font-medium text-secondary-900">
            {{ formatCurrency(asset.costs) }}
          </dd>
        </div>
      </dl>

      <div class="mt-6 p-4 bg-primary-50 rounded-lg">
        <p class="text-xs text-secondary-500 mb-1">Total Value</p>
        <p class="text-2xl font-bold text-primary-600">
          {{ formatCurrency(asset.costs) }}
        </p>
      </div>
    </div>

    <!-- Specifications -->
    <div class="bg-white rounded-xl shadow-soft p-6 lg:col-span-2" v-if="asset.asset_specs?.specs">
      <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Specifications
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="[key, value] in Object.entries(asset.asset_specs.specs as Record<string, unknown>)" 
          :key="key"
          class="p-3 bg-secondary-50 rounded-lg"
        >
          <p class="text-xs text-secondary-500 uppercase tracking-wide">{{ key }}</p>
          <p class="text-sm font-medium text-secondary-900 mt-1">{{ value }}</p>
        </div>
      </div>

      <div v-if="!asset.asset_specs?.specs || Object.keys(asset.asset_specs.specs as object).length === 0" class="text-center py-8 text-secondary-400">
        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm">No specifications defined</p>
      </div>
    </div>
  </div>
</template>
