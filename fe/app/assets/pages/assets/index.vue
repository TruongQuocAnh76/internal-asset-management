<script setup lang="ts">
import AssetsHeader from '../components/AssetsHeader.vue'
import AssetFilters from '../components/AssetFilters.vue'
import AssetTable from '../components/AssetTable.vue'
import type { Asset, GetAssetsParams } from '../../types/asset.types'
import { useAssets } from '../../composables/useAssets'

const { getAllAssets } = useAssets()
const route = useRoute()
const router = useRouter()

// Initialize filters from URL query params
const filters = ref<GetAssetsParams>({
  filter: (route.query.filter as GetAssetsParams['filter']) || undefined,
  filter_value: (route.query.filter_value as string) || '',
  search: (route.query.search as string) || '',
  order: (route.query.order as 'asc' | 'desc') || 'desc',
  page: Number(route.query.page) || 1,
  limit: Number(route.query.limit) || 10,
})

// Handle status filter from URL (from dashboard cards)
if (route.query.status) {
  filters.value.filter = 'status'
  filters.value.filter_value = route.query.status as string
}

const assets = ref<Asset[]>([])
const totalAssets = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)

const fetchAssets = async () => {
  isLoading.value = true
  try {
    const { data, error } = await getAllAssets(filters.value)
    
    if (error.value) {
      console.error('Error fetching assets:', error.value)
      return
    }

    if (data.value) {
      assets.value = data.value.data || []
      totalAssets.value = data.value.pagination?.totalAssets || 0
      totalPages.value = data.value.pagination?.totalPages || 1
    }
  } catch (err) {
    console.error('Error fetching assets:', err)
  } finally {
    isLoading.value = false
  }
}

const updateUrlParams = () => {
  const query: Record<string, string> = {}
  
  if (filters.value.filter && filters.value.filter_value) {
    query.filter = filters.value.filter
    query.filter_value = filters.value.filter_value
  }
  
  if (filters.value.search) {
    query.search = filters.value.search
  }
  
  if (filters.value.order) {
    query.order = filters.value.order
  }
  
  if (filters.value.page && filters.value.page > 1) {
    query.page = filters.value.page.toString()
  }
  
  if (filters.value.limit && filters.value.limit !== 10) {
    query.limit = filters.value.limit.toString()
  }
  
  router.replace({ query })
}

const handleFiltersApply = () => {
  filters.value.page = 1 // Reset to first page on filter change
  updateUrlParams()
  fetchAssets()
}

const handlePageChange = (page: number) => {
  filters.value.page = page
  updateUrlParams()
  fetchAssets()
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleAssetClick = (asset: Asset) => {
  router.push(`/assets/${asset.id}`)
}

const handleAddAsset = () => {
  navigateTo('/assets/new')
}

const handleExport = () => {
  // TODO: Implement export functionality
  console.log('Export clicked')
}

// Fetch assets on mount
onMounted(() => {
  fetchAssets()
})

// Watch for route changes (browser back/forward)
watch(() => route.query, () => {
  filters.value = {
    filter: (route.query.filter as GetAssetsParams['filter']) || undefined,
    filter_value: (route.query.filter_value as string) || '',
    search: (route.query.search as string) || '',
    order: (route.query.order as 'asc' | 'desc') || 'desc',
    page: Number(route.query.page) || 1,
    limit: Number(route.query.limit) || 10,
  }
  fetchAssets()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <button
            type="button"
            @click="router.back()"
            class="flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-900"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <NuxtLink
            to="/kits"
            class="btn-secondary flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            View Kits
          </NuxtLink>
        </div>
        <!-- Header -->
        <AssetsHeader
          :total-assets="totalAssets"
          :loading="isLoading"
          @add-asset="handleAddAsset"
          @export="handleExport"
        />

        <!-- Filters -->
        <AssetFilters
          v-model="filters"
          @apply="handleFiltersApply"
        />

        <!-- Assets Table -->
        <AssetTable
          :assets="assets"
          :loading="isLoading"
          :current-page="filters.page || 1"
          :total-pages="totalPages"
          @page-change="handlePageChange"
          @asset-click="handleAssetClick"
        />
      </div>
    </div>
  </div>
</template>
