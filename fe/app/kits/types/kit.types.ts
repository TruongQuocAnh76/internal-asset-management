export type KitStatus = 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED'

export interface Asset {
  id: string
  code: string
  name: string
  status: KitStatus
  category_id: string
  image_urls?: string[]
  acquired_at?: string
  created_at: string
  updated_at: string
  category?: {
    name: string
  }
}

export interface KitTemplateItem {
  id: string
  template_id: string
  asset_id: string
  asset: Asset
}

export interface KitTemplate {
  id: string
  name: string
  status: KitStatus
  created_at: string
  template_items: KitTemplateItem[]
}

export interface AssetItem {
  id: string
  kit_id: string
  asset_id: string
  status: KitStatus
  costs?: number | null
  asset?: Asset
}

export interface Kit {
  id: string
  template_id: string
  status: KitStatus
  created_at: string
  template: KitTemplate
  asset_items: AssetItem[]
}

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
  id: string
  success: boolean
  error?: string
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
