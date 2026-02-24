<script setup lang="ts">
import type { QuickAction } from '../types/dashboard.types'

interface Props {
  userRole?: 'admin' | 'team_lead' | 'employee'
}

const props = withDefaults(defineProps<Props>(), {
  userRole: 'employee',
})

const allActions: QuickAction[] = [
  {
    id: 'view-assets',
    label: 'View Assets',
    description: 'Browse all available assets',
    icon: 'cube',
    route: '/assets',
    color: 'primary',
    roles: ['admin', 'team_lead', 'employee'],
  },
  {
    id: 'view-kits',
    label: 'View Kits',
    description: 'Browse all asset kits',
    icon: 'kit',
    route: '/kits',
    color: 'secondary',
    roles: ['admin', 'team_lead', 'employee'],
  },
  {
    id: 'request-borrow',
    label: 'Request Asset',
    description: 'Submit a borrow request',
    icon: 'hand',
    route: '/requests/new',
    color: 'success',
    roles: ['admin', 'team_lead', 'employee'],
  },
  {
    id: 'review-approvals',
    label: 'Review Approvals',
    description: 'Manage pending requests',
    icon: 'clipboard-check',
    route: '/requests',
    color: 'warning',
    roles: ['admin', 'team_lead'],
  },
  {
    id: 'manage-users',
    label: 'Manage Users',
    description: 'User administration',
    icon: 'users',
    route: '/users',
    color: 'secondary',
    roles: ['admin'],
  },
]

const availableActions = computed(() =>
  allActions.filter(action => action.roles.includes(props.userRole))
)
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-success-600 to-success-700 px-6 py-4">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Actions
      </h2>
    </div>
    <div class="p-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NuxtLink
          v-for="action in availableActions"
          :key="action.id"
          :to="action.route"
          class="group flex items-center gap-4 p-4 rounded-xl border-2 border-transparent transition-all hover:shadow-md"
          :class="{
            'bg-primary-50 hover:border-primary-200': action.color === 'primary',
            'bg-success-50 hover:border-success-200': action.color === 'success',
            'bg-warning-50 hover:border-warning-200': action.color === 'warning',
            'bg-secondary-50 hover:border-secondary-200': action.color === 'secondary',
          }"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            :class="{
              'bg-primary-100': action.color === 'primary',
              'bg-success-100': action.color === 'success',
              'bg-warning-100': action.color === 'warning',
              'bg-secondary-100': action.color === 'secondary',
            }"
          >
            <!-- Cube Icon -->
            <svg v-if="action.icon === 'cube'" class="w-6 h-6" :class="{
              'text-primary-600': action.color === 'primary',
              'text-success-600': action.color === 'success',
              'text-warning-600': action.color === 'warning',
              'text-secondary-600': action.color === 'secondary',
            }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <!-- Hand Icon -->
            <svg v-else-if="action.icon === 'hand'" class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            <!-- Clipboard Check Icon -->
            <svg v-else-if="action.icon === 'clipboard-check'" class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <!-- Users Icon -->
            <svg v-else-if="action.icon === 'users'" class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <!-- Kit Icon -->
            <svg v-else-if="action.icon === 'kit'" class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-secondary-900 group-hover:text-secondary-700">{{ action.label }}</p>
            <p class="text-sm text-secondary-500">{{ action.description }}</p>
          </div>
          <svg class="w-5 h-5 text-secondary-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
