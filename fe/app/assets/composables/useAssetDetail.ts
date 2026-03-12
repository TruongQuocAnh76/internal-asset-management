import type { Ref } from 'vue'
import type { Asset, AssetItem, AssetStatus, StateTransition } from '../types/asset.types'
import { useAssets } from './useAssets'
import { useMaintenance } from './useMaintenance'

// Define allowed state transitions
const STATE_TRANSITIONS: Record<AssetStatus, StateTransition[]> = {
  READY: [
    { from: 'READY', to: 'BORROW', label: 'Request Borrow', description: 'Create a borrow request for this asset', requiresReason: false, color: 'primary', isNavigation: true, navigationRoute: '/requests/new' },
    { from: 'READY', to: 'MAINTAINANCE', label: 'Send to Maintenance', description: 'Schedule this asset for maintenance', requiresReason: true, color: 'warning' },
  ],
  IN_USE: [
    { from: 'IN_USE', to: 'MAINTAINANCE', label: 'Send to Maintenance', description: 'Schedule this asset for maintenance', requiresReason: true, color: 'warning' },
    { from: 'IN_USE', to: 'BROKEN', label: 'Mark as Broken', description: 'Report this asset as broken or damaged', requiresReason: true, color: 'danger' },
  ],
  MAINTAINANCE: [
    { from: 'MAINTAINANCE', to: 'READY', label: 'Return to Available', description: 'Maintenance complete, make available', requiresReason: false, color: 'success' },
    { from: 'MAINTAINANCE', to: 'BROKEN', label: 'Mark as Broken', description: 'Asset cannot be repaired', requiresReason: true, color: 'danger' },
    { from: 'MAINTAINANCE', to: 'LIQUIDATED', label: 'Liquidate', description: 'Permanently remove this asset from inventory', requiresReason: true, color: 'danger' },
  ],
  BROKEN: [
    { from: 'BROKEN', to: 'MAINTAINANCE', label: 'Send to Maintenance', description: 'Attempt to repair this asset', requiresReason: false, color: 'warning' },
  ],
  LIQUIDATED: [],
}

export const useAssetDetail = (assetId: Ref<string> | string) => {
  const { getAssetById, getAssetItems, updateAssetStatus } = useAssets()
  const { setMaintenance, resolveMaintenance } = useMaintenance()

  // State
  const asset = ref<Asset | null>(null)
  const assetItems = ref<AssetItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isTransitioning = ref(false)

  // Modal state
  const showTransitionModal = ref(false)
  const selectedTransition = ref<StateTransition | null>(null)
  const transitionReason = ref('')
  const transitionError = ref<string | null>(null)

  // Maintenance modal state
  const showMaintenanceModal = ref(false)
  const maintenanceTransition = ref<StateTransition | null>(null)
  const maintenanceError = ref<string | null>(null)

  // Computed
  const availableTransitions = computed(() => {
    if (!asset.value) return []
    return STATE_TRANSITIONS[asset.value.status] || []
  })

  const statusConfig = computed(() => {
    const configs: Record<AssetStatus, { color: string; bgColor: string; label: string }> = {
      READY: { color: 'text-success-700', bgColor: 'bg-success-100', label: 'Ready' },
      IN_USE: { color: 'text-primary-700', bgColor: 'bg-primary-100', label: 'In Use' },
      MAINTAINANCE: { color: 'text-warning-700', bgColor: 'bg-warning-100', label: 'Maintenance' },
      BROKEN: { color: 'text-danger-700', bgColor: 'bg-danger-100', label: 'Broken' },
      LIQUIDATED: { color: 'text-secondary-700', bgColor: 'bg-secondary-100', label: 'Liquidated' },
    }
    return asset.value ? configs[asset.value.status] : { color: 'text-secondary-700', bgColor: 'bg-secondary-100', label: 'Unknown' }
  })

  // Methods
  const loadAsset = async () => {
    isLoading.value = true
    error.value = null

    try {
      asset.value = await getAssetById(toValue(assetId))
      assetItems.value = await getAssetItems(toValue(assetId))
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to load asset'
    } finally {
      isLoading.value = false
    }
  }

  // Helper: is this a maintenance-related transition?
  const isMaintenanceTransition = (transition: StateTransition) => {
    return transition.to === 'MAINTAINANCE' || transition.from === 'MAINTAINANCE'
  }

  const openTransitionModal = (transition: StateTransition) => {
    if (isMaintenanceTransition(transition)) {
      maintenanceTransition.value = transition
      maintenanceError.value = null
      showMaintenanceModal.value = true
      return
    }
    selectedTransition.value = transition
    transitionReason.value = ''
    transitionError.value = null
    showTransitionModal.value = true
  }

  const closeTransitionModal = () => {
    showTransitionModal.value = false
    selectedTransition.value = null
    transitionReason.value = ''
    transitionError.value = null
  }

  const closeMaintenanceModal = () => {
    showMaintenanceModal.value = false
    maintenanceTransition.value = null
    maintenanceError.value = null
  }

  const confirmTransition = async () => {
    if (!selectedTransition.value || !asset.value) return

    if (selectedTransition.value.requiresReason && !transitionReason.value.trim()) {
      transitionError.value = 'Please provide a reason for this transition'
      return
    }

    isTransitioning.value = true
    transitionError.value = null

    try {
      await updateAssetStatus(
        toValue(assetId),
        selectedTransition.value.to,
        transitionReason.value.trim() || undefined
      )
      
      // Reload asset to get updated status
      await loadAsset()
      closeTransitionModal()
    } catch (err: any) {
      transitionError.value = err.data?.message || err.message || 'Failed to update status'
    } finally {
      isTransitioning.value = false
    }
  }

  const confirmSetMaintenance = async (assetItemId: string, maintenanceNotes: string) => {
    isTransitioning.value = true
    maintenanceError.value = null
    try {
      await setMaintenance({ asset_item_id: assetItemId, maintenance_notes: maintenanceNotes })
      await loadAsset()
      closeMaintenanceModal()
    } catch (err: any) {
      maintenanceError.value = err.data?.message || err.message || 'Failed to set maintenance'
    } finally {
      isTransitioning.value = false
    }
  }

  const confirmResolveMaintenance = async (
    assetItemId: string,
    resolvedStatus: 'READY' | 'BROKEN' | 'LIQUIDATED',
    repairCost: number,
    description: string,
  ) => {
    isTransitioning.value = true
    maintenanceError.value = null
    try {
      await resolveMaintenance({
        asset_item_id: assetItemId,
        resolved_status: resolvedStatus,
        repair_cost: repairCost || undefined,
        description: description || undefined,
      })
      await loadAsset()
      closeMaintenanceModal()
    } catch (err: any) {
      maintenanceError.value = err.data?.message || err.message || 'Failed to resolve maintenance'
    } finally {
      isTransitioning.value = false
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '—'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      currencyDisplay: 'code',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
    // State
    asset,
    assetItems,
    loading: isLoading,
    error,
    transitionLoading: isTransitioning,

    // Modal state
    modalOpen: showTransitionModal,
    selectedTransition,
    transitionReason,
    transitionError,

    // Maintenance modal state
    maintenanceModalOpen: showMaintenanceModal,
    maintenanceTransition,
    maintenanceError,

    // Computed
    availableTransitions,
    statusConfig,

    // Methods
    loadAsset,
    openTransitionModal,
    closeTransitionModal,
    closeMaintenanceModal,
    confirmTransition,
    confirmSetMaintenance,
    confirmResolveMaintenance,
    formatCurrency,
    formatDate,
    formatDateTime,
  }
}
