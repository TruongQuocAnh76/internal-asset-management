import type { Kit, KitAuditEntry, KitAssignment, KitComponent } from '../types/kit.types'
import { useKits } from './useKits'

export const useKitDetail = (kitId: string) => {
  const {
    getKitById,
    getKitAuditLog,
    getKitAssignments,
    archiveKit,
    restoreKit,
    removeComponentFromKit,
    replaceComponentAsset,
    convertComponentToPlaceholder
  } = useKits()

  // State
  const kit = ref<Kit | null>(null)
  const auditLog = ref<KitAuditEntry[]>([])
  const assignments = ref<KitAssignment[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isUpdating = ref(false)

  // Computed
  const statusConfig = computed(() => {
    const configs = {
      ACTIVE: { color: 'text-success-700', bgColor: 'bg-success-100', borderColor: 'border-success-200', label: 'Active' },
      ARCHIVED: { color: 'text-secondary-700', bgColor: 'bg-secondary-100', borderColor: 'border-secondary-200', label: 'Archived' },
      DRAFT: { color: 'text-warning-700', bgColor: 'bg-warning-100', borderColor: 'border-warning-200', label: 'Draft' }
    }
    return kit.value ? configs[kit.value.status] : configs.ACTIVE
  })

  const inventoryIndicator = computed(() => {
    if (!kit.value) return { complete: 0, missing: 0 }
    return {
      complete: kit.value.totalAvailableKits,
      missing: kit.value.kitsMissingComponents
    }
  })

  const inventoryTooltip = computed(() => {
    return 'Complete kits = minimum of available counts across all required components. A kit is "missing components" when at least one component has insufficient inventory.'
  })

  // Methods
  const loadKit = async () => {
    isLoading.value = true
    error.value = null

    try {
      const data = await getKitById(kitId)
      // Map assets_kits_items to the components shape the UI expects
      const components = (data.assets_kits_items || []).map((item: any) => ({
        id: item.asset_id,
        assetType: item.asset?.category?.name || 'Unknown',
        quantity: 1,
        isPlaceholder: false,
        asset: item.asset ? {
          id: item.asset.id,
          code: item.asset.code,
          name: item.asset.name,
          status: item.asset.status,
          serial: item.asset.serial,
          category: item.asset.category,
        } : undefined,
      }))
      kit.value = { ...data, components }
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to load kit'
    } finally {
      isLoading.value = false
    }
  }

  const loadAuditLog = async () => {
    try {
      auditLog.value = await getKitAuditLog(kitId)
    } catch (err: any) {
      console.error('Failed to load audit log:', err)
    }
  }

  const loadAssignments = async () => {
    try {
      assignments.value = await getKitAssignments(kitId)
    } catch (err: any) {
      console.error('Failed to load assignments:', err)
    }
  }

  const loadAll = async () => {
    await Promise.all([
      loadKit(),
      loadAuditLog(),
      loadAssignments()
    ])
  }

  const handleArchive = async () => {
    isUpdating.value = true
    try {
      await archiveKit(kitId)
      await loadKit()
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to archive kit'
    } finally {
      isUpdating.value = false
    }
  }

  const handleRestore = async () => {
    isUpdating.value = true
    try {
      await restoreKit(kitId)
      await loadKit()
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to restore kit'
    } finally {
      isUpdating.value = false
    }
  }

  const handleRemoveComponent = async (componentId: string) => {
    isUpdating.value = true
    try {
      await removeComponentFromKit(kitId, componentId)
      await loadKit()
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to remove component'
    } finally {
      isUpdating.value = false
    }
  }

  const handleReplaceComponent = async (componentId: string, newAssetId: string) => {
    isUpdating.value = true
    try {
      await replaceComponentAsset(kitId, componentId, newAssetId)
      await loadKit()
      await loadAuditLog()
    } catch (err: any) {
      throw err // Re-throw for caller to handle
    } finally {
      isUpdating.value = false
    }
  }

  const handleConvertToPlaceholder = async (componentId: string) => {
    isUpdating.value = true
    try {
      await convertComponentToPlaceholder(kitId, componentId)
      await loadKit()
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to convert component'
    } finally {
      isUpdating.value = false
    }
  }

  // Formatting helpers
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    }

    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getComponentStatusConfig = (status: string) => {
    const configs = {
      READY: { color: 'text-success-700', bgColor: 'bg-success-100', label: 'Ready' },
      IN_USE: { color: 'text-primary-700', bgColor: 'bg-primary-100', label: 'In Use' },
      MAINTENANCE: { color: 'text-warning-700', bgColor: 'bg-warning-100', label: 'Maintenance' }
    }
    return configs[status as keyof typeof configs] || { color: 'text-secondary-700', bgColor: 'bg-secondary-100', label: status }
  }

  const getAuditActionLabel = (action: KitAuditEntry['action']) => {
    const labels = {
      CREATED: 'Kit Created',
      UPDATED: 'Kit Updated',
      COMPONENT_ADDED: 'Component Added',
      COMPONENT_REMOVED: 'Component Removed',
      COMPONENT_REPLACED: 'Component Replaced',
      ASSIGNED: 'Kit Assigned',
      RETURNED: 'Kit Returned',
      ARCHIVED: 'Kit Archived',
      RESTORED: 'Kit Restored'
    }
    return labels[action] || action
  }

  const getAuditActionIcon = (action: KitAuditEntry['action']) => {
    const icons = {
      CREATED: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      UPDATED: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      COMPONENT_ADDED: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
      COMPONENT_REMOVED: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
      COMPONENT_REPLACED: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      ASSIGNED: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      RETURNED: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
      ARCHIVED: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      RESTORED: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    }
    return icons[action] || icons.UPDATED
  }

  return {
    // State
    kit,
    auditLog,
    assignments,
    loading: isLoading,
    error,
    updating: isUpdating,

    // Computed
    statusConfig,
    inventoryIndicator,
    inventoryTooltip,

    // Methods
    loadKit,
    loadAuditLog,
    loadAssignments,
    loadAll,
    handleArchive,
    handleRestore,
    handleRemoveComponent,
    handleReplaceComponent,
    handleConvertToPlaceholder,

    // Formatters
    formatDate,
    formatDateTime,
    formatRelativeTime,
    getComponentStatusConfig,
    getAuditActionLabel,
    getAuditActionIcon
  }
}
