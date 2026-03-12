<script setup lang="ts">
import type { AssetSummary } from '../types/dashboard.types'

interface Props {
  summary: AssetSummary
  loading?: boolean
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
})

const statusCards = [
  { key: 'total', label: 'Total Assets', color: 'primary', icon: 'cube', filter: null },
  { key: 'ready', label: 'Ready', color: 'success', icon: 'check-circle', filter: 'READY' },
  { key: 'inUse', label: 'In Use', color: 'primary', icon: 'user', filter: 'IN_USE' },
  { key: 'maintenance', label: 'Maintenance', color: 'warning', icon: 'wrench', filter: 'MAINTAINANCE' },
  { key: 'broken', label: 'Broken', color: 'danger', icon: 'exclamation', filter: 'BROKEN' },
  { key: 'liquidated', label: 'Liquidated', color: 'secondary', icon: 'archive', filter: 'LIQUIDATED' },
] as const

const navigateToAssets = (filter: string | null) => {
  if (!props.isAdmin) return

  if (filter) {
    navigateTo(`/assets?status=${filter}`)
  } else {
    navigateTo('/assets')
  }
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <button
      v-for="card in statusCards"
      :key="card.key"
      @click="navigateToAssets(card.filter)"
      :disabled="!isAdmin"
      class="group bg-white rounded-xl shadow-soft p-4 border-l-4 transition-all text-left"
      :title="!isAdmin ? 'Only admins can open asset details' : undefined"
      :class="{
        'border-primary-500': card.color === 'primary',
        'border-success-500': card.color === 'success',
        'border-warning-500': card.color === 'warning',
        'border-danger-500': card.color === 'danger',
        'border-secondary-400': card.color === 'secondary',
        'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer': isAdmin,
        'opacity-80 cursor-not-allowed': !isAdmin,
      }"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          :class="{
            'bg-primary-100 group-hover:bg-primary-200': card.color === 'primary',
            'bg-success-100 group-hover:bg-success-200': card.color === 'success',
            'bg-warning-100 group-hover:bg-warning-200': card.color === 'warning',
            'bg-danger-100 group-hover:bg-danger-200': card.color === 'danger',
            'bg-secondary-100 group-hover:bg-secondary-200': card.color === 'secondary',
          }"
        >
          <!-- Cube Icon (Total) -->
          <svg v-if="card.icon === 'cube'" class="w-5 h-5" :class="{
            'text-primary-600': card.color === 'primary',
            'text-success-600': card.color === 'success',
            'text-warning-600': card.color === 'warning',
            'text-danger-600': card.color === 'danger',
            'text-secondary-600': card.color === 'secondary',
          }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <!-- Check Circle Icon (Ready) -->
          <svg v-else-if="card.icon === 'check-circle'" class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- User Icon (In Use) -->
          <svg v-else-if="card.icon === 'user'" class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <!-- Wrench Icon (Maintenance) -->
          <svg v-else-if="card.icon === 'wrench'" class="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <!-- Exclamation Icon (Broken) -->
          <svg v-else-if="card.icon === 'exclamation'" class="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <!-- Archive Icon (Liquidated) -->
          <svg v-else-if="card.icon === 'archive'" class="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-secondary-500 font-medium truncate">{{ card.label }}</p>
          <p v-if="loading" class="h-7 w-12 bg-secondary-200 animate-pulse rounded mt-1"></p>
          <p v-else class="text-2xl font-bold text-secondary-900">
            {{ summary[card.key as keyof AssetSummary] ?? 0 }}
          </p>
        </div>
      </div>
    </button>
  </div>
</template>
