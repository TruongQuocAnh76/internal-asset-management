<script setup lang="ts">
import type { MaintenanceItem, RepairRecord, AssetStatus } from '../../types/asset.types'
import { useMaintenance } from '../../composables/useMaintenance'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const { getMaintenanceItems, resolveMaintenance, getRepairHistory } = useMaintenance()

// State
const items = ref<MaintenanceItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Resolve modal state
const showResolveModal = ref(false)
const selectedItem = ref<MaintenanceItem | null>(null)
const resolveForm = ref({
  resolved_status: 'READY' as 'READY' | 'BROKEN' | 'LIQUIDATED',
  repair_cost: 0,
  description: '',
})
const isResolving = ref(false)
const resolveError = ref<string | null>(null)

// Repair history modal state
const showRepairHistory = ref(false)
const repairHistoryItem = ref<MaintenanceItem | null>(null)
const repairRecords = ref<RepairRecord[]>([])
const isLoadingRepairs = ref(false)

const fetchItems = async () => {
  isLoading.value = true
  error.value = null
  try {
    items.value = await getMaintenanceItems()
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to load maintenance items'
  } finally {
    isLoading.value = false
  }
}

const openResolve = (item: MaintenanceItem) => {
  selectedItem.value = item
  resolveForm.value = { resolved_status: 'READY', repair_cost: 0, description: '' }
  resolveError.value = null
  showResolveModal.value = true
}

const closeResolve = () => {
  showResolveModal.value = false
  selectedItem.value = null
}

const handleResolve = async () => {
  if (!selectedItem.value) return
  isResolving.value = true
  resolveError.value = null
  try {
    await resolveMaintenance({
      asset_item_id: selectedItem.value.id,
      resolved_status: resolveForm.value.resolved_status,
      repair_cost: resolveForm.value.repair_cost || 0,
      description: resolveForm.value.description || undefined,
    })
    closeResolve()
    await fetchItems()
  } catch (err: any) {
    resolveError.value = err.data?.message || err.message || 'Failed to resolve maintenance'
  } finally {
    isResolving.value = false
  }
}

const openRepairHistory = async (item: MaintenanceItem) => {
  repairHistoryItem.value = item
  repairRecords.value = []
  showRepairHistory.value = true
  isLoadingRepairs.value = true
  try {
    repairRecords.value = await getRepairHistory(item.id)
  } catch (err: any) {
    console.error('Failed to load repair history', err)
  } finally {
    isLoadingRepairs.value = false
  }
}

const closeRepairHistory = () => {
  showRepairHistory.value = false
  repairHistoryItem.value = null
}

const navigateToAsset = (assetId: string) => {
  router.push(`/assets/${assetId}`)
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    READY: 'Ready',
    IN_USE: 'In Use',
    MAINTAINANCE: 'Maintenance',
    BROKEN: 'Broken',
    LIQUIDATED: 'Liquidated',
  }
  return labels[status] || status
}

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-secondary-900 flex items-center gap-3">
          <div class="p-2 bg-warning-100 rounded-lg">
            <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Maintenance Queue
        </h1>
        <p class="text-secondary-500 mt-1">Asset items currently in maintenance status</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading && items.length === 0" class="flex items-center justify-center py-20">
        <div class="text-center">
          <svg class="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p class="text-secondary-600">Loading maintenance items...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-danger-50 border border-danger-200 rounded-xl p-6 text-center">
        <h3 class="text-lg font-semibold text-danger-800 mb-2">Error</h3>
        <p class="text-danger-600 mb-4">{{ error }}</p>
        <button @click="fetchItems" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="bg-white rounded-xl shadow-soft p-12 text-center">
        <svg class="w-16 h-16 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-secondary-600 mb-2">All Clear</h3>
        <p class="text-secondary-400">No asset items are currently in maintenance.</p>
      </div>

      <!-- Items Table -->
      <div v-else class="bg-white rounded-xl shadow-soft overflow-hidden">
        <div class="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-secondary-900">
            {{ items.length }} item{{ items.length !== 1 ? 's' : '' }} in maintenance
          </h2>
          <button @click="fetchItems" class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-secondary-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Item ID</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Notes</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Kit</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Since</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Cost</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-100">
              <tr v-for="item in items" :key="item.id" class="hover:bg-secondary-50 transition-colors">
                <td class="px-6 py-4">
                  <button @click="navigateToAsset(item.asset.id)" class="text-left group">
                    <p class="text-sm font-medium text-primary-700 group-hover:text-primary-800">{{ item.asset.name }}</p>
                    <p class="text-xs text-secondary-400 font-mono">{{ item.asset.code }}</p>
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-mono text-secondary-700">{{ item.id.slice(0, 8) }}…</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-secondary-700 max-w-xs truncate" :title="item.maintenance_notes || ''">
                    {{ item.maintenance_notes || '—' }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="item.kit" class="text-sm text-primary-700">{{ item.kit.template.name }}</span>
                  <span v-else class="text-sm text-secondary-400">—</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-secondary-600">{{ formatDate(item.last_maintained_at) }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-secondary-900">{{ formatCurrency(item.costs) }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    @click="openRepairHistory(item)"
                    class="text-xs px-2.5 py-1.5 rounded-md border border-secondary-200 text-secondary-600 hover:bg-secondary-50 transition-colors"
                  >
                    History
                  </button>
                  <button
                    @click="openResolve(item)"
                    class="text-xs px-2.5 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Resolve Maintenance Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showResolveModal"
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          @click.self="closeResolve"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-warning-100 rounded-lg">
                <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-secondary-900">Resolve Maintenance</h3>
                <p class="text-sm text-secondary-500">{{ selectedItem?.asset.name }} — {{ selectedItem?.id.slice(0, 8) }}…</p>
              </div>
            </div>

            <div v-if="selectedItem?.maintenance_notes" class="bg-secondary-50 rounded-lg p-3 mb-4">
              <p class="text-xs font-medium text-secondary-500 mb-1">Maintenance Notes</p>
              <p class="text-sm text-secondary-700">{{ selectedItem.maintenance_notes }}</p>
            </div>

            <!-- Resolved Status -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">Resolution Status <span class="text-danger-500">*</span></label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in [{ value: 'READY', label: 'Ready', color: 'success' }, { value: 'BROKEN', label: 'Broken', color: 'danger' }, { value: 'LIQUIDATED', label: 'Liquidated', color: 'secondary' }]"
                  :key="opt.value"
                  @click="resolveForm.resolved_status = opt.value as 'READY' | 'BROKEN' | 'LIQUIDATED'"
                  class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                  :class="resolveForm.resolved_status === opt.value
                    ? `bg-${opt.color}-100 text-${opt.color}-700 border-${opt.color}-300`
                    : 'bg-white text-secondary-600 border-secondary-200 hover:bg-secondary-50'"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Repair Cost -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">Repair Cost</label>
              <input
                v-model.number="resolveForm.repair_cost"
                type="number"
                min="0"
                class="input-field w-full"
                placeholder="0"
              />
            </div>

            <!-- Description -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
              <textarea
                v-model="resolveForm.description"
                rows="3"
                class="input-field w-full"
                placeholder="What was done to resolve the issue..."
              ></textarea>
            </div>

            <!-- Error -->
            <div v-if="resolveError" class="mb-4 p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">
              {{ resolveError }}
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <button @click="closeResolve" class="px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                @click="handleResolve"
                :disabled="isResolving"
                class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {{ isResolving ? 'Resolving...' : 'Resolve' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Repair History Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showRepairHistory"
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          @click.self="closeRepairHistory"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-secondary-900">Repair History</h3>
                <p class="text-sm text-secondary-500">{{ repairHistoryItem?.asset.name }} — {{ repairHistoryItem?.id.slice(0, 8) }}…</p>
              </div>
              <button @click="closeRepairHistory" class="p-1.5 text-secondary-400 hover:text-secondary-700 rounded-lg hover:bg-secondary-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="isLoadingRepairs" class="py-8 text-center text-secondary-400">
              <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </div>

            <div v-else-if="repairRecords.length === 0" class="py-8 text-center text-secondary-400">
              <p class="text-sm">No repair records found.</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="record in repairRecords" :key="record.id" class="border border-secondary-200 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
                    :class="{
                      'bg-success-100 text-success-700 border-success-200': record.resolved_status === 'READY',
                      'bg-danger-100 text-danger-700 border-danger-200': record.resolved_status === 'BROKEN',
                      'bg-secondary-100 text-secondary-700 border-secondary-200': record.resolved_status === 'LIQUIDATED',
                    }"
                  >
                    {{ statusLabel(record.resolved_status) }}
                  </span>
                  <span class="text-xs text-secondary-400">{{ formatDate(record.created_at) }}</span>
                </div>
                <p v-if="record.description" class="text-sm text-secondary-700 mb-1">{{ record.description }}</p>
                <p class="text-sm font-medium text-secondary-900">Cost: {{ formatCurrency(record.cost) }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
