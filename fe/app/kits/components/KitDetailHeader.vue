<script setup lang="ts">
import type { Kit } from '../types/kit.types'

interface Props {
  kit: Kit
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'edit': []
  'assign': []
  'archive': []
  'restore': []
  'manage-components': []
}>()

const getStatusColor = (status: string) => {
  const colors = {
    ACTIVE: 'bg-success-100 text-success-700 border-success-200',
    ARCHIVED: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    DRAFT: 'bg-warning-100 text-warning-700 border-warning-200',
  }
  return colors[status as keyof typeof colors] || 'bg-secondary-100 text-secondary-700 border-secondary-200'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="p-6">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <!-- Kit Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-secondary-900 truncate">{{ kit.name }}</h1>
            <span 
              class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border flex-shrink-0"
              :class="getStatusColor(kit.status)"
            >
              {{ kit.status }}
            </span>
          </div>

          <p v-if="kit.description" class="text-secondary-600 mb-4">{{ kit.description }}</p>

          <div class="flex flex-wrap gap-4 text-sm">
            <div v-if="kit.category" class="flex items-center gap-2 text-secondary-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {{ kit.category }}
            </div>
            <div class="flex items-center gap-2 text-secondary-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {{ formatDate(kit.createdAt) }}
            </div>
            <div v-if="kit.createdBy" class="flex items-center gap-2 text-secondary-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ kit.createdBy.firstName }} {{ kit.createdBy.lastName }}
            </div>
          </div>

          <!-- Tags -->
          <div v-if="kit.tags?.length" class="flex flex-wrap gap-2 mt-4">
            <span 
              v-for="tag in kit.tags" 
              :key="tag"
              class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-600"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          <button
            @click="emit('manage-components')"
            class="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Manage Components
          </button>

          <button
            v-if="kit.status === 'ACTIVE'"
            @click="emit('assign')"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-soft"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Assign Kit
          </button>

          <div class="relative group">
            <button
              class="px-3 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                @click="emit('edit')"
                class="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Kit
              </button>
              <button
                v-if="kit.status === 'ACTIVE'"
                @click="emit('archive')"
                class="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive Kit
              </button>
              <button
                v-if="kit.status === 'ARCHIVED'"
                @click="emit('restore')"
                class="w-full px-4 py-2 text-left text-sm text-success-600 hover:bg-success-50 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restore Kit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
