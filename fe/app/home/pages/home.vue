<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../../auth/composables/useAuth'
import { useHome } from '../composables/useHome'

// Components
import AssetStatusCards from '../components/AssetStatusCards.vue'
import CategoryChart from '../components/CategoryChart.vue'
import PendingApprovals from '../components/PendingApprovals.vue'
import RecentActivity from '../components/RecentActivity.vue'
import QuickActions from '../components/QuickActions.vue'

definePageMeta({
  layout: 'default',
})

const { user } = useAuth()
const { getAssetsSummary, getAssetsByCategory, getPendingApprovals, getRecentActivities, getAssetsCountByCategory } = useHome()

// Dashboard state
const isLoading = ref(true)
const assetSummary = ref({
  total: 0,
  ready: 0,
  inUse: 0,
  maintenance: 0,
  broken: 0,
  liquidated: 0,
})
const categoryData = ref<{ category: string; count: number }[]>([])
const pendingApprovals = ref<any[]>([])
const recentActivities = ref<any[]>([])

// Simulated user role - in production this would come from user data
const userRole = ref<'admin' | 'team_lead' | 'employee'>('admin')

// Fetch all dashboard data in a single aggregated load
const loadDashboardData = async () => {
  isLoading.value = true
  try {
    // Fetch all data in parallel for optimal performance
    const [summaryData, categoryCountData, approvals, activities] = await Promise.all([
      getAssetsSummary(),
      getAssetsCountByCategory(),
      getPendingApprovals(),
      getRecentActivities(),
    ])

    assetSummary.value = {
      total: summaryData.data.value.countAllItems,
      ready: summaryData.data.value.byItemStatus.countItemsReady,
      inUse: summaryData.data.value.byItemStatus.countItemsInUse,
      maintenance: summaryData.data.value.byItemStatus.countItemsMaintenance,
      broken: summaryData.data.value.byItemStatus.countItemsBroken,
      liquidated: summaryData.data.value.byItemStatus.countItemsLiquidated,
    }
    categoryData.value = categoryCountData.data.value || []
    
    // Transform pending approvals to match component shape
    const approvalsData = approvals.data?.value || approvals.data || approvals || []
    pendingApprovals.value = Array.isArray(approvalsData) 
      ? approvalsData.map((req: any) => ({
          asset_name: req.asset?.name || req.kit?.template?.name || 'Unknown',
          requester_name: req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Unknown',
          requested_at: req.requested_at,
          status: req.status.toLowerCase()
        }))
      : []
    
    recentActivities.value = activities.recentActivities
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-secondary-900">
          Welcome back{{ user?.first_name ? `, ${user.first_name}` : '' }}!
        </h1>
        <p class="text-secondary-600 mt-1">
          Here's your asset management overview for today.
        </p>
      </div>

      <!-- Section 1: Asset Status Summary Cards -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Asset Status Overview
        </h2>
        <AssetStatusCards :summary="assetSummary" :loading="isLoading" />
      </section>

      <!-- Section 2 & 3: Category Chart + Pending Approvals -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Inventory Composition -->
        <CategoryChart :categories="categoryData" :loading="isLoading" />

        <!-- Pending Approvals (Role-Based) -->
        <PendingApprovals :approvals="pendingApprovals" :user-role="userRole" :loading="isLoading" />
      </section>

      <!-- Section 4 & 5: Recent Activity + Quick Actions -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Recent Activity Feed -->
        <RecentActivity :activities="recentActivities" :loading="isLoading" />

        <!-- Quick Actions -->
        <QuickActions :user-role="userRole" />
      </section>

      <!-- Footer Info -->
      <footer class="text-center text-secondary-400 text-sm py-4 border-t border-secondary-100">
        <p>Asset Management System • Last updated: {{ new Date().toLocaleString() }}</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>
