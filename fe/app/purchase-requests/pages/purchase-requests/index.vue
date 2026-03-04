<script setup lang="ts">
import type { PurchaseRequest, GetPurchaseRequestsParams } from '../../types/purchase-request.types'
import { usePurchaseRequests } from '../../composables/usePurchaseRequests'
import PurchaseRequestsHeader from '../../components/PurchaseRequestsHeader.vue'
import PurchaseRequestFilters from '../../components/PurchaseRequestFilters.vue'
import PurchaseRequestTable from '../../components/PurchaseRequestTable.vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const { getPurchaseRequests } = usePurchaseRequests()

const filters = ref<GetPurchaseRequestsParams>({
  filter: (route.query.filter as 'status') || undefined,
  filterValue: (route.query.filterValue as any) || undefined,
  order: (route.query.order as 'asc' | 'desc') || 'desc',
  orderBy: 'requested_at',
  page: Number(route.query.page) || 1,
  limit: 10,
})

const requests = ref<PurchaseRequest[]>([])
const totalRequests = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)

const fetchRequests = async () => {
  isLoading.value = true
  try {
    const { data, error } = await getPurchaseRequests(filters.value)

    if (error.value) {
      console.error('Error fetching purchase requests:', error.value)
      return
    }

    if (data.value) {
      requests.value = data.value.data || []
      totalRequests.value = data.value.meta?.total || 0
      totalPages.value = data.value.meta?.totalPages || 1
    }
  } catch (err) {
    console.error('Error fetching purchase requests:', err)
  } finally {
    isLoading.value = false
  }
}

const updateUrlParams = () => {
  const query: Record<string, string> = {}

  if (filters.value.filter) query.filter = filters.value.filter
  if (filters.value.filterValue) query.filterValue = filters.value.filterValue
  if (filters.value.order && filters.value.order !== 'desc') query.order = filters.value.order
  if (filters.value.page && filters.value.page > 1) query.page = filters.value.page.toString()

  router.replace({ query })
}

const handleFiltersApply = () => {
  filters.value.page = 1
  updateUrlParams()
  fetchRequests()
}

const handlePageChange = (page: number) => {
  filters.value.page = page
  updateUrlParams()
  fetchRequests()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleRequestClick = (request: PurchaseRequest) => {
  router.push(`/purchase-requests/${request.id}`)
}

const handleCreate = () => {
  router.push('/purchase-requests/new')
}

onMounted(() => {
  fetchRequests()
})

watch(() => route.query, () => {
  filters.value = {
    ...filters.value,
    filter: (route.query.filter as 'status') || undefined,
    filterValue: (route.query.filterValue as any) || undefined,
    order: (route.query.order as 'asc' | 'desc') || 'desc',
    page: Number(route.query.page) || 1,
  }
  fetchRequests()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Header -->
        <PurchaseRequestsHeader
          :total-requests="totalRequests"
          :loading="isLoading"
          @create="handleCreate"
        />

        <!-- Filters -->
        <PurchaseRequestFilters
          v-model="filters"
          @apply="handleFiltersApply"
        />

        <!-- Table -->
        <PurchaseRequestTable
          :requests="requests"
          :loading="isLoading"
          :current-page="filters.page || 1"
          :total-pages="totalPages"
          @page-change="handlePageChange"
          @request-click="handleRequestClick"
        />
      </div>
    </div>
  </div>
</template>
