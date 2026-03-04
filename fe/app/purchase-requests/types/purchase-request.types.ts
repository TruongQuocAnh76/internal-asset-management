export type PurchaseRequestStatus =
  | 'SUBMITTED'
  | 'TL_APPROVED'
  | 'BOD_APPROVED'
  | 'REJECTED'
  | 'RECEIVED'

export interface PurchaseRequestUser {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface PurchaseRequestCategory {
  id: string
  code: string
  name: string
}

export interface PurchaseRequest {
  id: string
  reason: string | null
  asset_category_id: string
  specs: Record<string, string>
  requested_by: string
  requested_at: string
  estimated_cost: number
  quantity: number
  status: PurchaseRequestStatus
  category: PurchaseRequestCategory
  user: PurchaseRequestUser
}

export interface PurchaseRequestFormData {
  category_id: string
  reason: string
  estimatedCost: number
  quantity: number
  specs: Record<string, string>
}

export interface GetPurchaseRequestsParams {
  filter?: 'status'
  filterValue?: PurchaseRequestStatus
  order?: 'asc' | 'desc'
  orderBy?: 'status' | 'requested_at'
  page?: number
  limit?: number
}

export interface PurchaseRequestsResponse {
  data: PurchaseRequest[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE'

export interface ReceiveAssetResponse {
  createdAsset: { id: string }
  tempImageUrls: string[]
}

export interface ReceiveAssetFormData {
  name: string
  category_name: string
  location_name: string
  costs: number
  initial_quantity: number
  specs: Record<string, string>
  image_num: number
  salvage_value?: number | null
  life_months?: number | null
  decline_balance_rate?: number | null
  depreciation_method?: DepreciationMethod | null
}
