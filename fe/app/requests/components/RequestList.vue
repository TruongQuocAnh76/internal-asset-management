<script setup lang="ts">
import type { BorrowRequest } from '../types/request.types'
import RequestListItem from './RequestListItem.vue'

interface Props {
  requests: BorrowRequest[]
  loading: boolean
  currentPage: number
  totalPages: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'page-change': [page: number]
  'request-click': [request: BorrowRequest]
  'cancel': [request: BorrowRequest]
}>()

const pages = computed(() => {
  const current = props.currentPage
  const total = props.totalPages
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    
    if (current > 3) {
      pages.push('...')
    }
    
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    
    if (current < total - 2) {
      pages.push('...')
    }
    
    pages.push(total)
  }

  return pages
})
</script>

<template>
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="loading" class="card">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4">
          <div class="h-12 w-12 bg-secondary-200 rounded-lg"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-secondary-200 rounded w-1/3"></div>
            <div class="h-3 bg-secondary-100 rounded w-1/2"></div>
          </div>
          <div class="h-6 w-20 bg-secondary-200 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="requests.length === 0"
      class="card text-center py-12"
    >
      <svg
        class="w-16 h-16 mx-auto text-secondary-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 class="text-lg font-medium text-secondary-900 mt-4">No requests found</h3>
      <p class="text-secondary-500 mt-2">
        Try adjusting your filters or create a new request.
      </p>
    </div>

    <!-- Request list -->
    <div v-else class="space-y-3">
      <RequestListItem
        v-for="request in requests"
        :key="request.id"
        :request="request"
        @click="emit('request-click', request)"
        @cancel="emit('cancel', request)"
      />
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1 && !loading"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
    >
      <p class="text-sm text-secondary-500">
        Page {{ currentPage }} of {{ totalPages }}
      </p>

      <nav
        class="flex items-center gap-1"
        role="navigation"
        aria-label="Pagination"
      >
        <!-- Previous -->
        <button
          type="button"
          class="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="emit('page-change', currentPage - 1)"
          aria-label="Previous page"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <!-- Page numbers -->
        <template v-for="page in pages" :key="page">
          <span
            v-if="page === '...'"
            class="px-3 py-2 text-secondary-400"
          >
            ...
          </span>
          <button
            v-else
            type="button"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-secondary-600 hover:bg-secondary-100'
            ]"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="emit('page-change', page as number)"
          >
            {{ page }}
          </button>
        </template>

        <!-- Next -->
        <button
          type="button"
          class="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="emit('page-change', currentPage + 1)"
          aria-label="Next page"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>
