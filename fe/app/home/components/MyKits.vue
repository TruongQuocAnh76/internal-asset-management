<script setup lang="ts">
interface KitItem {
  id: string
  name: string
  kitId?: string
  dueDate?: string
  providedAt?: string
  status?: string
}

interface Props {
  kits: KitItem[]
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

</script>

<template>
  <div class="bg-white rounded-xl shadow-soft overflow-hidden">
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        My Kits
      </h2>
      <NuxtLink to="/kits" class="text-xs text-primary-200 hover:text-white transition-colors">
        View all kits →
      </NuxtLink>
    </div>

    <div class="p-6">
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

      <div v-else-if="!kits?.length" class="text-center py-8 text-secondary-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="font-medium">No kits currently assigned</p>
        <NuxtLink to="/kits" class="text-sm text-primary-600 hover:underline mt-1 inline-block">
          Browse kits
        </NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="kit in kits"
          :key="kit.id"
          :to="`/kits/${kit.kitId || kit.id}`"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors group"
        >
          <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-100">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium text-secondary-900 truncate group-hover:text-primary-700 transition-colors">
              {{ kit.name }}
            </p>
            <p class="text-xs text-secondary-500">
              <span v-if="kit.dueDate" class="text-secondary-600 font-medium">
                Due {{ formatDate(kit.dueDate) }}
              </span>
              <span v-else class="text-secondary-500">No due date</span>
            </p>
          </div>

          <span class="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 bg-primary-100 text-primary-700">
            {{ kit.status || 'Assigned' }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
