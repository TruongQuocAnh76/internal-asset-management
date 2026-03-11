<script setup lang="ts">
import type { BorrowRequest, RequestFilterOptions, GetRequestsParams } from '../../types/request.types'
import { useRequests } from '../../composables/useRequests'
import RequestsHeader from '../../components/RequestsHeader.vue'
import RequestFilters from '../../components/RequestFilters.vue'
import RequestList from '../../components/RequestList.vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const { getRequests, cancelRequest } = useRequests()
const { user } = useAuth()

const canViewAllRequests = computed(() =>
  user.value?.user_roles?.some((ur: any) =>
    ur.role?.name === 'Admin' || ur.role?.name === 'Team Lead'
  ) ?? false
)

const isAdmin = computed(() =>
  user.value?.user_roles?.some((ur: any) => ur.role?.name === 'Admin') ?? false
)

const resolveView = (view?: RequestFilterOptions['view']) => {
  if (!canViewAllRequests.value && view && view !== 'my_requests') {
    return 'my_requests'
  }

  return view || 'my_requests'
}

// Initialize filters from URL
const filters = ref<RequestFilterOptions>({
  view: resolveView(route.query.view as RequestFilterOptions['view']),
  status: route.query.status as any || undefined,
  priority: route.query.priority as any || undefined,
  search: (route.query.search as string) || ''
})

const requests = ref<BorrowRequest[]>([])
const totalRequests = ref(0)
const totalPages = ref(1)
const currentPage = ref(Number(route.query.page) || 1)
const isLoading = ref(false)

const fetchRequests = async () => {
  isLoading.value = true

  try {
    const params: GetRequestsParams = {
      page: currentPage.value,
      limit: 10,
      order: 'desc'
    }

    // Apply view filter
    if (filters.value.view === 'my_requests') {
        params.filter = 'requesterId'
        params.filterValue = user.value?.id
    }
    // Note: team_requests view would need backend support

    // Apply other filters
    if (filters.value.status) {
      params.filter = 'status'
      params.filterValue = filters.value.status
    }
    if (filters.value.search) {
      params.search = filters.value.search
    }

    const { data, error } = await getRequests(params)

    if (error.value) {
      console.error('Error fetching requests:', error.value)
      return
    }

    if (data.value) {
      // Backend returns array directly
      requests.value = Array.isArray(data.value) ? data.value : []
      totalRequests.value = requests.value.length
      totalPages.value = 1 // Backend doesn't return pagination info yet
    }
  } catch (err) {
    console.error('Error fetching requests:', err)
  } finally {
    isLoading.value = false
  }
}

const updateUrlParams = () => {
  const query: Record<string, string> = {}

  if (filters.value.view !== 'my_requests') {
    query.view = filters.value.view
  }
  if (filters.value.status) {
    query.status = filters.value.status
  }
  if (filters.value.priority) {
    query.priority = filters.value.priority
  }
  if (filters.value.search) {
    query.search = filters.value.search
  }
  if (currentPage.value > 1) {
    query.page = currentPage.value.toString()
  }

  router.replace({ query })
}

const handleFiltersApply = () => {
  currentPage.value = 1
  updateUrlParams()
  fetchRequests()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  updateUrlParams()
  fetchRequests()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleRequestClick = (request: BorrowRequest) => {
  router.push(`/requests/${request.id}`)
}

const handleCancelRequest = async (request: BorrowRequest) => {
  if (!confirm('Are you sure you want to cancel this request?')) return

  try {
    await cancelRequest(request.id)
    fetchRequests()
  } catch (err) {
    console.error('Failed to cancel request:', err)
  }
}

const handleCreate = () => {
  router.push('/requests/new')
}

const handleExport = () => {
  // TODO: Implement export
  console.log('Export clicked')
}

// Fetch on mount
onMounted(() => {
  fetchRequests()
})

// Watch route changes
watch(() => route.query, () => {
  filters.value = {
    view: resolveView(route.query.view as RequestFilterOptions['view']),
    status: route.query.status as any || undefined,
    priority: route.query.priority as any || undefined,
    search: (route.query.search as string) || ''
  }
  currentPage.value = Number(route.query.page) || 1
  fetchRequests()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-6">
        <!-- Header -->
        <RequestsHeader
          :total-requests="totalRequests"
          :loading="isLoading"
          :is-admin="isAdmin"
          @create="handleCreate"
          @export="handleExport"
        />

        <!-- Filters -->
        <RequestFilters
          v-model="filters"
          :show-team-requests="canViewAllRequests"
          @apply="handleFiltersApply"
        />

        <!-- Request List -->
        <RequestList
          :requests="requests"
          :loading="isLoading"
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
          @request-click="handleRequestClick"
          @cancel="handleCancelRequest"
        />
      </div>
    </div>
  </div>
</template>
