<script setup lang="ts">
import type { StateTransition } from '../types/asset.types'

interface Props {
  transitions: StateTransition[]
  loading: boolean
  assetId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select': [transition: StateTransition]
}>()

const router = useRouter()

const handleTransitionClick = (transition: StateTransition) => {
  if (transition.isNavigation && transition.navigationRoute) {
    // Navigate to the route with asset info as query params
    router.push({
      path: transition.navigationRoute,
      query: {
        assetId: props.assetId
      }
    })
  } else {
    emit('select', transition)
  }
}

const getButtonClass = (color: string) => {
  const classes: Record<string, string> = {
    success: 'bg-success-50 text-success-700 hover:bg-success-100 border-success-200',
    warning: 'bg-warning-50 text-warning-700 hover:bg-warning-100 border-warning-200',
    danger: 'bg-danger-50 text-danger-700 hover:bg-danger-100 border-danger-200',
    primary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border-secondary-200'
  }
  return classes[color] || classes.secondary
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft p-6">
    <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      Status Actions
    </h2>

    <div v-if="transitions.length === 0" class="text-center py-6 text-secondary-400">
      <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <p class="text-sm">No actions available for current status</p>
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="transition in transitions"
        :key="transition.to"
        @click="handleTransitionClick(transition)"
        :disabled="loading"
        class="w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left"
        :class="getButtonClass(transition.color)"
      >
        <!-- Icon -->
        <div 
          class="p-2 rounded-lg"
          :class="{
            'bg-success-100': transition.color === 'success',
            'bg-warning-100': transition.color === 'warning',
            'bg-danger-100': transition.color === 'danger',
            'bg-primary-100': transition.color === 'primary',
            'bg-secondary-100': !transition.color || transition.color === 'secondary'
          }"
        >
          <!-- Borrow icon -->
          <svg v-if="transition.to === 'BORROW'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <!-- Ready icon -->
          <svg v-else-if="transition.to === 'READY'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- In Use icon -->
          <svg v-else-if="transition.to === 'IN_USE'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <!-- Maintenance icon -->
          <svg v-else-if="transition.to === 'MAINTAINANCE'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <!-- Broken icon -->
          <svg v-else-if="transition.to === 'BROKEN'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <!-- Liquidated icon -->
          <svg v-else-if="transition.to === 'LIQUIDATED'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <!-- Default icon -->
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <p class="font-medium">{{ transition.label }}</p>
          <p class="text-sm opacity-75 truncate">{{ transition.description }}</p>
        </div>

        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>
