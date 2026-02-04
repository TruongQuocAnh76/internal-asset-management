<script setup lang="ts">
import { useAssetDetail } from '../../../composables/useAssetDetail'
import AssetDetailHeader from '../../../components/AssetDetailHeader.vue'
import AssetInfoCards from '../../../components/AssetInfoCards.vue'
import StatusActions from '../../../components/StatusActions.vue'
import StateTransitionModal from '../../../components/StateTransitionModal.vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)

const {
  asset,
  loading,
  error,
  statusConfig,
  availableTransitions,
  modalOpen,
  selectedTransition,
  transitionLoading,
  loadAsset,
  openTransitionModal,
  closeTransitionModal,
  confirmTransition,
  formatCurrency,
  formatDate
} = useAssetDetail(id.value)

// Load asset on mount
onMounted(() => {
  loadAsset()
})

// Reload if ID changes
watch(id, (newId) => {
  if (newId) {
    loadAsset()
  }
})

const handleEdit = () => {
  router.push(`/assets/${id.value}/edit`)
}

const handleBack = () => {
  router.push('/assets')
}

const handleTransitionSelect = (transition: typeof selectedTransition.value) => {
  if (transition) {
    openTransitionModal(transition)
  }
}

const handleTransitionConfirm = async (status: string, reason: string) => {
  await confirmTransition()
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button
        @click="handleBack"
        class="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-6 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Assets
      </button>

      <!-- Loading State -->
      <div v-if="loading && !asset" class="flex items-center justify-center py-20">
        <div class="text-center">
          <svg class="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p class="text-secondary-600">Loading asset details...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
        <svg class="w-12 h-12 text-danger-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 class="text-lg font-semibold text-danger-800 mb-2">Error Loading Asset</h3>
        <p class="text-danger-600 mb-4">{{ error }}</p>
        <button @click="loadAsset" class="btn-primary">
          Try Again
        </button>
      </div>

      <!-- Asset Detail Content -->
      <div v-else-if="asset" class="space-y-6">
        <!-- Header with asset name, code, status -->
        <AssetDetailHeader 
          :asset="asset" 
          :status-config="statusConfig"
          @edit="handleEdit"
        />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content (2 cols) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Asset Info Cards -->
            <AssetInfoCards 
              :asset="asset"
              :format-currency="formatCurrency"
              :format-date="formatDate"
            />
          </div>

          <!-- Sidebar (1 col) -->
          <div class="space-y-6">
            <!-- Status Actions -->
            <StatusActions
              :transitions="availableTransitions"
              :loading="transitionLoading"
              @select="handleTransitionSelect"
            />

            <!-- Quick Info Card -->
            <div class="bg-white rounded-xl shadow-soft p-6">
              <h2 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity
              </h2>
              
              <div class="text-center py-6 text-secondary-400">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="text-sm">Activity timeline coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found State -->
      <div v-else class="text-center py-20">
        <svg class="w-16 h-16 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-secondary-600 mb-2">Asset Not Found</h3>
        <p class="text-secondary-400 mb-4">The asset you're looking for doesn't exist or has been removed.</p>
        <button @click="handleBack" class="btn-primary">
          Back to Assets
        </button>
      </div>
    </div>

    <!-- State Transition Modal -->
    <StateTransitionModal
      :is-open="modalOpen"
      :transition="selectedTransition"
      :loading="transitionLoading"
      @close="closeTransitionModal"
      @confirm="handleTransitionConfirm"
    />
  </div>
</template>
