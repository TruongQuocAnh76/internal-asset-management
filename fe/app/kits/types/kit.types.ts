export type KitStatus = 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED'

export interface KitItem {
  kit_id: string
  asset_id: string
  asset: {
    id: string
    code: string
    name: string
    status: KitStatus
    category_id: string
    category?: {
      name: string
    }
  }
}

export interface Kit {
  id: string
  name: string
  status: KitStatus
  stock: number
  created_at: string
  assets_kits_items: KitItem[]
  components?: KitComponent[]
  totalAvailableKits?: number
  kitsMissingComponents?: number
}

export interface GetKitsParams {
  search?: string
  filter?: 'status'
  filterValue?: string
  order?: 'asc' | 'desc'
  orderBy?: 'name' | 'createdAt' | 'updatedAt'
  page?: number
  limit?: number
}

export interface KitFormData {
  name: string
  asset_ids: string[]
}

export interface KitComponent {
  id: string
  assetType: string
  quantity: number
  isPlaceholder: boolean
  asset?: {
    id: string
    code: string
    name: string
    status: string
    serial?: string
    category?: {
      name: string
    }
  }
}

export interface ComponentPickerAsset {
  id: string
  code: string
  name: string
  status: string
  serial?: string
  category?: {
    name: string
  }
}

export interface KitAuditEntry {
  id: string
  action: 'CREATED' | 'UPDATED' | 'COMPONENT_ADDED' | 'COMPONENT_REMOVED' | 'COMPONENT_REPLACED' | 'ASSIGNED' | 'RETURNED' | 'ARCHIVED' | 'RESTORED'
  description?: string
  user?: {
    id: string
    name: string
  }
  timestamp: string
  details?: Record<string, any>
}

export interface KitAssignment {
  id: string
  userId: string
  userName: string
  assignedAt: string
  returnedAt?: string
}

export interface KitKPIs {
  totalKits: number
  activeKits: number
  assignedKits: number
  archivedKits: number
}

export interface KitsResponse {
  data: Kit[]
  pagination: {
    page: number
    limit: number
    totalKits: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface AssignKitFormData {
  userId: string
  kitId: string
}

export interface BulkOperationResult {
  success: number
  failed: number
  errors: string[]
}

export interface KitComponentDraft {
  id: string
  assetId?: string
  assetType: string
  quantity: number
  isPlaceholder: boolean
}

export interface KitDraft {
  id: string
  name: string
  asset_ids: string[]
  lastSavedAt: string
}
