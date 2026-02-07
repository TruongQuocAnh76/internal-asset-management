export interface Asset {
  id?: string
  code: string
  name: string
  category: {
    name: string
  }
  status: AssetStatus
  costs: number
  stock?: number
  acquired_at: string
  location_name?: string
  image_urls?: string[]
  asset_specs?: {
    specs: Record<string, string>
  }
  created_at?: string
  updated_at?: string
}

export type AssetStatus = 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED'

export interface AssetSpec {
  key: string
  value: string
}

export interface AssetFormData {
  name: string
  category_name: string
  location_name: string
  status: AssetStatus
  costs: number
  image_num: number
  stock: number
  specs: Record<string, string>
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
