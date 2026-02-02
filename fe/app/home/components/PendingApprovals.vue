<script setup lang="ts">
import type { PendingApproval } from '../types/dashboard.types'

interface Props {
  approvals: PendingApproval[]
  userRole?: 'admin' | 'team_lead' | 'employee'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userRole: 'employee',
})

const pendingOnly = computed(() => 
  props.approvals?.filter(a => a.status === 'pending') ?? []
)

const roleLabels = {
  admin: 'All Pending Approvals',
  team_lead: 'Team Pending Approvals',
  employee: 'My Request Status',
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Pending' },
    approved: { bg: 'bg-success-100', text: 'text-success-700', label: 'Approved' },
    rejected: { bg: 'bg-danger-100', text: 'text-danger-700', label: 'Rejected' },
    returned: { bg: 'bg-secondary-100', text: 'text-secondary-700', label: 'Returned' },
  }
  return badges[status] ?? badges.pending
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-warning-500 to-warning-600 px-6 py-4 flex justify-between items-center">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        {{ roleLabels[userRole] }}
      </h2>
      <span v-if="pendingOnly.length" class="bg-white/20 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
        {{ pendingOnly.length }} pending
      </span>
    </div>
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg animate-pulse">
          <div class="w-10 h-10 bg-secondary-200 rounded-lg"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-32 bg-secondary-200 rounded"></div>
            <div class="h-3 w-24 bg-secondary-200 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!approvals?.length" class="text-center py-8 text-secondary-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No pending approvals</p>
        <p class="text-sm text-secondary-400 mt-1">You're all caught up!</p>
      </div>

      <!-- Approvals List -->
      <div v-else class="space-y-3 max-h-72 overflow-y-auto">
        <div
          v-for="approval in approvals.slice(0, 5)"
          :key="`${approval.asset_name}-${approval.requested_at}`"
          class="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-secondary-900 truncate">{{ approval.asset_name }}</p>
            <p class="text-sm text-secondary-500">
              {{ approval.requester_name }} · {{ formatDate(approval.requested_at) }}
            </p>
          </div>
          <span
            class="px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0"
            :class="[getStatusBadge(approval.status).bg, getStatusBadge(approval.status).text]"
          >
            {{ getStatusBadge(approval.status).label }}
          </span>
        </div>
      </div>

      <!-- View All Link -->
      <NuxtLink
        v-if="approvals?.length"
        to="/approvals"
        class="mt-4 block text-center text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
      >
        View all approvals →
      </NuxtLink>
    </div>
  </div>
</template>
