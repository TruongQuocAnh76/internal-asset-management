<script setup lang="ts">
import KitsHeader from '../../components/KitsHeader.vue'
import KitFilters from '../../components/KitFilters.vue'
import KitTable from '../../components/KitTable.vue'
import KitCards from '../../components/KitCards.vue'
import KitBuilder from '../../components/KitBuilder.vue'
import LoadingSkeleton from '../../components/LoadingSkeleton.vue'
import EmptyState from '../../components/EmptyState.vue'

definePageMeta({
  layout: 'default',
})
import type { Kit, GetKitsParams } from '../../types/kit.types'
import { useKits } from '../../composables/useKits'
// Bulk operations removed

const { getKits, getCategories } = useKits()
// bulk operations removed

const route = useRoute()
const router = useRouter()

// Filters state
const filters = ref<GetKitsParams>({
  search: (route.query.search as string) || '',
  filter: (route.query.filter as GetKitsParams['filter']) || undefined,
  order: (route.query.order as 'asc' | 'desc') || 'desc',
  page: Number(route.query.page) || 1,
  limit: Number(route.query.limit) || 10,
})

// Data state
const kits = ref<Kit[]>([])
const totalKits = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)

// UI state
const showKitBuilder = ref(false)
const viewMode = ref<'table' | 'card'>('table')

// Detect mobile and set default view
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth < 640
  viewMode.value = isMobile.value ? 'card' : 'table'
  
  const handleResize = () => {
    isMobile.value = window.innerWidth < 640
  }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => window.removeEventListener('resize', handleResize))
})

const fetchKits = async () => {
  isLoading.value = true
  try {
    const { data, error } = await getKits(filters.value)
    
    if (error.value) {
      console.error('Error fetching kits:', error.value)
      return
    }

    if (data.value) {
      kits.value = data.value.data || []
      totalKits.value = data.value.pagination?.totalKits || 0
      totalPages.value = data.value.pagination?.totalPages || 1
    }
  } catch (err) {
    console.error('Error fetching kits:', err)
  } finally {
    isLoading.value = false
  }
}


const updateUrlParams = () => {
  const query: Record<string, string> = {}
  
  if (filters.value.search) {
    query.search = filters.value.search
  }
  
  // category/status filters removed

  if (filters.value.filter) {
    query.filter = filters.value.filter
  }
  
  if (filters.value.order && filters.value.order !== 'desc') {
    query.order = filters.value.order
  }
  
  if (filters.value.page && filters.value.page > 1) {
    query.page = filters.value.page.toString()
  }
  
  router.replace({ query })
}

const handleFiltersApply = () => {
  filters.value.page = 1
  updateUrlParams()
  fetchKits()
}

const handlePageChange = (page: number) => {
  filters.value.page = page
  updateUrlParams()
  fetchKits()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleKitClick = (kit: Kit) => {
  router.push(`/kits/${kit.id}`)
}

const handleCreateKit = () => {
  showKitBuilder.value = true
}

const handleKitCreated = () => {
  showKitBuilder.value = false
  fetchKits()
}

// bulk operation handlers removed

// Initialize
onMounted(() => {
  fetchKits()
})

// Watch for route changes
watch(() => route.query, () => {
  filters.value = {
    search: (route.query.search as string) || '',
    filter: (route.query.filter as GetKitsParams['filter']) || undefined,
    order: (route.query.order as 'asc' | 'desc') || 'desc',
    page: Number(route.query.page) || 1,
    limit: Number(route.query.limit) || 10,
  }
  fetchKits()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Header -->
        <KitsHeader
          :total-kits="totalKits"
          :loading="isLoading"
          @create-kit="handleCreateKit"
        />

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="flex-1 w-full">
            <KitFilters
              v-model="filters"
              @apply="handleFiltersApply"
            />
          </div>
        </div>

        <!-- Loading State -->
        <LoadingSkeleton v-if="isLoading" :variant="viewMode" :rows="5" />

        <!-- Kits Table/Cards -->
        <template v-else-if="kits.length > 0">
          <!-- Desktop: Table View -->
          <KitTable
            v-if="viewMode === 'table'"
            :kits="kits"
            :loading="isLoading"
            :current-page="filters.page || 1"
            :total-pages="totalPages"
            @page-change="handlePageChange"
            @kit-click="handleKitClick"
          />

          <!-- Card View (preferred on mobile) -->
          <KitCards
            v-else
            :kits="kits"
            :loading="isLoading"
            @view="handleKitClick"
          />

          <!-- Pagination for Card View -->
          <div v-if="viewMode === 'card' && totalPages > 1" class="flex justify-center items-center gap-2 pt-4">
            <button
              @click="handlePageChange(filters.page! - 1)"
              :disabled="filters.page === 1"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="filters.page === 1 
                ? 'bg-secondary-100 text-secondary-400' 
                : 'bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50'"
            >
              Previous
            </button>
            <span class="text-sm text-secondary-600">
              Page {{ filters.page }} of {{ totalPages }}
            </span>
            <button
              @click="handlePageChange(filters.page! + 1)"
              :disabled="filters.page === totalPages"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="filters.page === totalPages 
                ? 'bg-secondary-100 text-secondary-400' 
                : 'bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50'"
            >
              Next
            </button>
          </div>
        </template>

        <!-- Empty State -->
        <EmptyState
          v-else
          :icon="filters.search ? 'filter' : 'kit'"
          :title="filters.search ? 'No kits match your filters' : 'No kits yet'"
          :description="filters.search
            ? 'Try adjusting your search or filters to find what you\'re looking for.'
            : 'Get started by creating your first kit to organize your assets.'"
          :action-label="filters.search ? undefined : 'Create Kit'"
          @action="handleCreateKit"
        />
      </div>
    </div>

          <!-- Bulk operations removed -->

    <!-- Kit Builder Modal -->
    <KitBuilder
      :visible="showKitBuilder"
      @close="showKitBuilder = false"
      @success="handleKitCreated"
    />
  </div>
</template>
