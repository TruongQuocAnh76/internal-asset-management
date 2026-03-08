export type AssetStatus = 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED'
export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE'

export interface AssetItem {
  id: string
  status: AssetStatus
  location_name: string | null
  costs: number | null
  acquired_at: string
  kit_id: string | null
  kit_status: boolean
  created_at?: string
  updated_at?: string
  kit?: {
    id: string
    template: {
      name: string
    }
  } | null
}

export interface Asset {
  id?: string
  code: string
  name: string
  category: {
    name: string
  }
  status: AssetStatus
  stock?: number
  borrowerId?: string | null
  acquired_at: string
  image_urls?: string[]
  salvage_value?: number | null
  life_months?: number | null
  decline_balance_rate?: number | null
  depreciation_method?: DepreciationMethod | null
  asset_specs?: {
    specs: Record<string, string>
  }
  asset_items?: AssetItem[]
  created_at?: string
  updated_at?: string
}

export interface AssetSpec {
  key: string
  value: string
}

export interface AssetFormData {
  name: string
  categoryName: string
  locationName: string
  status: AssetStatus
  costs: number
  initialQuantity: number
  specs: Record<string, string>
  salvageValue?: number | null
  lifeMonths?: number | null
  declineBalanceRate?: number | null
  depreciationMethod?: DepreciationMethod | null
}

export interface AssetItemUpdatePayload {
  location_name?: string
  costs?: number
}

export interface AssetItemUpdatePayload {
  location_name?: string
  costs?: number
}

// State transition types
export interface StateTransition {
  from: AssetStatus | 'READY'
  to: AssetStatus | 'BORROW'
  label: string
  description: string
  requiresReason: boolean
  color: 'success' | 'warning' | 'danger' | 'primary' | 'secondary'
  isNavigation?: boolean
  navigationRoute?: string
}

export interface AssetEvent {
  id: string
  event_type: string
  actor: {
    id: string
    first_name: string
    last_name: string
  }
  previous_status: AssetStatus
  new_status: AssetStatus
  payload: Record<string, any>
  occured_at: string
  created_at: string
}

export interface GetAssetsParams {
  filter?: 'category' | 'status' | 'costs' | 'acquired_at'
  filter_value?: string
  search?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface AssetsResponse {
  data: Asset[]
  pagination: {
    page: number
    limit: number
    totalAssets: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ── Maintenance types ────────────────────────────────────────────

export interface MaintenanceItem {
  id: string
  status: AssetStatus
  location_name: string | null
  costs: number | null
  acquired_at: string
  kit_id: string | null
  kit_status: boolean
  maintenance_notes: string | null
  last_maintained_at: string | null
  asset: {
    id: string
    code: string
    name: string
  }
  kit: {
    id: string
    template: { name: string }
  } | null
  repairs: RepairRecord[]
}

export interface RepairRecord {
  id: string
  asset_item_id: string
  cost: number
  description: string | null
  resolved_status: AssetStatus
  created_at: string
}

export interface SetMaintenancePayload {
  asset_item_id: string
  maintenance_notes: string
}

export interface ResolveMaintenancePayload {
  asset_item_id: string
  resolved_status: 'READY' | 'BROKEN' | 'LIQUIDATED'
  repair_cost?: number
  description?: string
}
