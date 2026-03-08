<script setup lang="ts">
import { useAssetDetail } from '../../../composables/useAssetDetail'
import AssetDetailHeader from '../../../components/AssetDetailHeader.vue'
import AssetInfoCards from '../../../components/AssetInfoCards.vue'
import StatusActions from '../../../components/StatusActions.vue'
import StateTransitionModal from '../../../components/StateTransitionModal.vue'
import MaintenanceTransitionModal from '../../../components/MaintenanceTransitionModal.vue'
import ImageCarousel from '../../../components/ImageCarousel.vue'
import { useAssets } from '../../../composables/useAssets'
import type { AssetItem } from '../../../types/asset.types'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)

const {
  asset,
  assetItems,
  loading,
  error,
  statusConfig,
  availableTransitions,
  modalOpen,
  selectedTransition,
  transitionLoading,
  maintenanceModalOpen,
  maintenanceTransition,
  maintenanceError,
  loadAsset,
  openTransitionModal,
  closeTransitionModal,
  closeMaintenanceModal,
  confirmTransition,
  confirmSetMaintenance,
  confirmResolveMaintenance,
  formatCurrency,
  formatDate
} = useAssetDetail(id.value)

const { updateAssetItem } = useAssets()
const itemEditOpen = ref(false)
const itemEditLoading = ref(false)
const itemEditError = ref('')
const selectedItem = ref<AssetItem | null>(null)
const itemEditForm = ref({
  location_name: '',
  costs: 0,
})

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

const openItemEditModal = (item: AssetItem) => {
  selectedItem.value = item
  itemEditForm.value = {
    location_name: item.location_name || '',
    costs: item.costs || 0,
  }
  itemEditError.value = ''
  itemEditOpen.value = true
}

const closeItemEditModal = () => {
  itemEditOpen.value = false
  itemEditLoading.value = false
  itemEditError.value = ''
  selectedItem.value = null
}

const saveItemEdit = async () => {
  if (!selectedItem.value) return
  if (!itemEditForm.value.location_name.trim()) {
    itemEditError.value = 'Location is required'
    return
  }
  if (itemEditForm.value.costs < 0) {
    itemEditError.value = 'Cost cannot be negative'
    return
  }

  itemEditLoading.value = true
  itemEditError.value = ''
  try {
    await updateAssetItem(selectedItem.value.id, {
      location_name: itemEditForm.value.location_name.trim(),
      costs: itemEditForm.value.costs,
    })
    await loadAsset()
    closeItemEditModal()
  } catch (err: any) {
    itemEditError.value = err?.data?.message || err?.message || 'Failed to update asset item'
  } finally {
    itemEditLoading.value = false
  }
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
            <!-- Image Carousel -->
            <ImageCarousel 
              v-if="asset.image_urls && asset.image_urls.length > 0"
              :images="asset.image_urls"
              :alt="asset.name"
            />
            
            <!-- Asset Info Cards -->
            <AssetInfoCards 
              :asset="asset"
              :format-date="formatDate"
            />

            <!-- Asset Items Table -->
            <div class="bg-white rounded-xl shadow-soft overflow-hidden">
              <div class="px-6 py-4 border-b border-secondary-200">
                <h2 class="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Asset Items
                  <span class="ml-2 text-sm font-normal text-secondary-500">({{ assetItems.length }})</span>
                </h2>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full" v-if="assetItems.length > 0">
                  <thead class="bg-secondary-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ID</th>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Location</th>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Cost</th>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Kit</th>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Acquired</th>
                      <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-secondary-100">
                    <tr v-for="item in assetItems" :key="item.id" class="hover:bg-secondary-50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm font-mono text-secondary-700">{{ item.id.slice(0, 8) }}…</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span 
                          class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                          :class="{
                            'bg-success-100 text-success-700 border-success-200': item.status === 'READY',
                            'bg-primary-100 text-primary-700 border-primary-200': item.status === 'IN_USE',
                            'bg-warning-100 text-warning-700 border-warning-200': item.status === 'MAINTAINANCE',
                            'bg-danger-100 text-danger-700 border-danger-200': item.status === 'BROKEN',
                            'bg-secondary-100 text-secondary-700 border-secondary-200': item.status === 'LIQUIDATED',
                          }"
                        >
                          {{ item.status.replace('_', ' ') }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-secondary-700">{{ item.location_name || '—' }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm font-medium text-secondary-900">{{ formatCurrency(item.costs) }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span v-if="item.kit" class="inline-flex items-center gap-1 text-sm text-primary-700">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {{ item.kit.template.name }}
                        </span>
                        <span v-else class="text-sm text-secondary-400">—</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-secondary-600">{{ formatDate(item.acquired_at) }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          class="btn-secondary !px-3 !py-1.5 text-xs"
                          @click="openItemEditModal(item)"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-else class="px-6 py-12 text-center text-secondary-400">
                  <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p class="text-sm">No individual items found for this asset</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar (1 col) -->
          <div class="space-y-6">
            <!-- Status Actions -->
            <StatusActions
              :transitions="availableTransitions"
              :loading="transitionLoading"
              :asset-id="asset.id"
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

    <!-- Maintenance Transition Modal -->
    <MaintenanceTransitionModal
      :is-open="maintenanceModalOpen"
      :transition="maintenanceTransition"
      :asset-items="assetItems"
      :loading="transitionLoading"
      :error="maintenanceError"
      @close="closeMaintenanceModal"
      @set-maintenance="confirmSetMaintenance"
      @resolve-maintenance="confirmResolveMaintenance"
    />

    <div v-if="itemEditOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="closeItemEditModal" />
      <div class="relative w-full max-w-lg rounded-xl bg-white shadow-lg">
        <div class="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-secondary-900">Edit Asset Item</h3>
          <button type="button" class="text-secondary-500 hover:text-secondary-700" @click="closeItemEditModal">X</button>
        </div>

        <form class="p-6 space-y-4" @submit.prevent="saveItemEdit">
          <p class="text-sm text-secondary-500" v-if="selectedItem">
            Item ID: <span class="font-mono">{{ selectedItem.id.slice(0, 8) }}…</span>
          </p>

          <div class="input-group">
            <label class="label" for="item-location">Location</label>
            <input id="item-location" v-model="itemEditForm.location_name" type="text" placeholder="Enter location" />
          </div>

          <div class="input-group">
            <label class="label" for="item-cost">Cost (VND)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">VND</span>
              <input id="item-cost" v-model.number="itemEditForm.costs" type="number" min="0" step="0.01" class="!pl-14" />
            </div>
          </div>

          <p v-if="itemEditError" class="text-sm text-danger-600">{{ itemEditError }}</p>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button type="button" class="btn-secondary" :disabled="itemEditLoading" @click="closeItemEditModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="itemEditLoading">
              {{ itemEditLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
