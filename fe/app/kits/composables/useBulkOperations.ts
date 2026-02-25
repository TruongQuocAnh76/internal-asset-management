import type { Kit, BulkOperationResult } from '../types/kit.types'
import { useKits } from './useKits'

export const useBulkOperations = () => {
  const { bulkArchiveKits, bulkUpdateCategory, bulkUpdateTags, exportKits } = useKits()

  // State
  const selectedKitIds = ref<Set<string>>(new Set())
  const isProcessing = ref(false)
  const results = ref<BulkOperationResult[]>([])
  const showResultsModal = ref(false)

  // Computed
  const selectedCount = computed(() => selectedKitIds.value.size)
  const hasSelection = computed(() => selectedKitIds.value.size > 0)

  // Selection methods
  const toggleSelection = (kitId: string) => {
    if (selectedKitIds.value.has(kitId)) {
      selectedKitIds.value.delete(kitId)
    } else {
      selectedKitIds.value.add(kitId)
    }
    // Trigger reactivity
    selectedKitIds.value = new Set(selectedKitIds.value)
  }

  const selectAll = (kits: Kit[]) => {
    selectedKitIds.value = new Set(kits.map(k => k.id))
  }

  const deselectAll = () => {
    selectedKitIds.value = new Set()
  }

  const isSelected = (kitId: string) => {
    return selectedKitIds.value.has(kitId)
  }

  const toggleSelectAll = (kits: Kit[]) => {
    if (selectedKitIds.value.size === kits.length) {
      deselectAll()
    } else {
      selectAll(kits)
    }
  }

  // Bulk operations
  const archive = async () => {
    if (!hasSelection.value) return

    isProcessing.value = true
    try {
      results.value = await bulkArchiveKits(Array.from(selectedKitIds.value))
      showResultsModal.value = true
    } catch (err) {
      console.error('Bulk archive failed:', err)
    } finally {
      isProcessing.value = false
    }
  }

  const updateCategory = async (category: string) => {
    if (!hasSelection.value) return

    isProcessing.value = true
    try {
      results.value = await bulkUpdateCategory(Array.from(selectedKitIds.value), category)
      showResultsModal.value = true
    } catch (err) {
      console.error('Bulk update category failed:', err)
    } finally {
      isProcessing.value = false
    }
  }

  const updateTags = async (tags: string[], action: 'add' | 'replace') => {
    if (!hasSelection.value) return

    isProcessing.value = true
    try {
      results.value = await bulkUpdateTags(Array.from(selectedKitIds.value), tags, action)
      showResultsModal.value = true
    } catch (err) {
      console.error('Bulk update tags failed:', err)
    } finally {
      isProcessing.value = false
    }
  }

  const exportSelected = async () => {
    if (!hasSelection.value) return

    isProcessing.value = true
    try {
      const blob = await exportKits(Array.from(selectedKitIds.value))
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kits-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      isProcessing.value = false
    }
  }

  // Results helpers
  const successCount = computed(() => results.value.filter(r => r.success).length)
  const failureCount = computed(() => results.value.filter(r => !r.success).length)

  const closeResults = () => {
    showResultsModal.value = false
    results.value = []
    deselectAll()
  }

  return {
    // State
    selectedKitIds,
    isProcessing,
    results,
    showResultsModal,

    // Computed
    selectedCount,
    hasSelection,
    successCount,
    failureCount,

    // Selection methods
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    toggleSelectAll,

    // Bulk operations
    archive,
    updateCategory,
    updateTags,
    exportSelected,

    // Results
    closeResults
  }
}
