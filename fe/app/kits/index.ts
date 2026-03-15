// Components
export { default as KitKPICards } from './components/KitKPICards.vue'
export { default as KitFilters } from './components/KitFilters.vue'
export { default as KitsHeader } from './components/KitsHeader.vue'
export { default as KitTable } from './components/KitTable.vue'
export { default as KitCards } from './components/KitCards.vue'
export { default as ComponentPicker } from './components/ComponentPicker.vue'
export { default as KitBuilder } from './components/KitBuilder.vue'
export { default as KitDetailHeader } from './components/KitDetailHeader.vue'
export { default as InventoryIndicator } from './components/InventoryIndicator.vue'
export { default as ComponentsList } from './components/ComponentsList.vue'
export { default as AuditTimeline } from './components/AuditTimeline.vue'
export { default as AssignKitDialog } from './components/AssignKitDialog.vue'
export { default as ManageComponentsModal } from './components/ManageComponentsModal.vue'

// UI Components
export { default as PhotoUpload } from './components/PhotoUpload.vue'
export { default as ResponsiveTabs } from './components/ResponsiveTabs.vue'
export { default as ResponsiveModal } from './components/ResponsiveModal.vue'
export { default as EmptyState } from './components/EmptyState.vue'
export { default as LoadingSkeleton } from './components/LoadingSkeleton.vue'
export { default as ViewToggle } from './components/ViewToggle.vue'
export { default as MobileBottomNav } from './components/MobileBottomNav.vue'

// Composables
export { useKits } from './composables/useKits'
export { useKitBuilder } from './composables/useKitBuilder'
export { useKitDetail } from './composables/useKitDetail'
// Bulk operations removed

// Types
export type {
  Kit,
  KitComponent,
  KitAssignment,
  KitAuditEntry,
  KitDraft,
  KitKPIs,
  GetKitsParams,
  KitsResponse,
  KitFormData,
  AssignKitFormData,
  ComponentPickerAsset,
  BulkOperationResult
} from './types/kit.types'
