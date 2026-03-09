<script setup lang="ts">
interface OwnedAsset {
  id: string
  name: string
  type: 'asset' | 'kit'
  assetId?: string
  kitId?: string
  dueDate: string
  providedAt: string
  status: 'PROVIDED' | 'OVERDUE'
}

interface Props {
  assets: OwnedAsset[]
  loading?: boolean
}

defineProps<Props>()

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const daysUntilDue = (dueDate: string) => {
  const diff = new Date(dueDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        My Assets
      </h2>
      <NuxtLink to="/requests" class="text-xs text-primary-200 hover:text-white transition-colors">
        View all requests →
      </NuxtLink>
    </div>

    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="flex gap-3 animate-pulse">
          <div class="w-10 h-10 bg-secondary-200 rounded-lg flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-48 bg-secondary-200 rounded"></div>
            <div class="h-3 w-32 bg-secondary-100 rounded"></div>
          </div>
          <div class="h-5 w-16 bg-secondary-200 rounded-full"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!assets?.length" class="text-center py-8 text-secondary-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p class="font-medium">No assets currently borrowed</p>
        <NuxtLink to="/requests/new" class="text-sm text-primary-600 hover:underline mt-1 inline-block">
          Create a borrow request
        </NuxtLink>
      </div>

      <!-- Asset List -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="asset in assets"
          :key="asset.id"
          :to="`/requests/${asset.id}`"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors group"
        >
          <!-- Icon -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="asset.status === 'OVERDUE' ? 'bg-danger-100' : 'bg-primary-100'"
          >
            <!-- Kit icon -->
            <svg v-if="asset.type === 'kit'" class="w-5 h-5" :class="asset.status === 'OVERDUE' ? 'text-danger-600' : 'text-primary-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <!-- Asset icon -->
            <svg v-else class="w-5 h-5" :class="asset.status === 'OVERDUE' ? 'text-danger-600' : 'text-primary-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-secondary-900 truncate group-hover:text-primary-700 transition-colors">
              {{ asset.name }}
            </p>
            <p class="text-xs text-secondary-500">
              <span v-if="asset.status === 'OVERDUE'" class="text-danger-600 font-medium">
                Overdue since {{ formatDate(asset.dueDate) }}
              </span>
              <span v-else>
                Due {{ formatDate(asset.dueDate) }}
                <span
                  v-if="daysUntilDue(asset.dueDate) <= 3"
                  class="ml-1 text-warning-600 font-medium"
                >
                  ({{ daysUntilDue(asset.dueDate) }}d left)
                </span>
              </span>
            </p>
          </div>

          <!-- Status badge -->
          <span
            class="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
            :class="asset.status === 'OVERDUE'
              ? 'bg-danger-100 text-danger-700'
              : 'bg-primary-100 text-primary-700'"
          >
            {{ asset.status === 'OVERDUE' ? 'Overdue' : 'In Use' }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
