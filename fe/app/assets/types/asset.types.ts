export interface Asset {
  code: string
  name: string
  category: {
    name: string
  }
  status: AssetStatus
  costs: number
  acquired_at: string
}

export type AssetStatus = 'READY' | 'IN_USE' | 'MAINTAINANCE' | 'BROKEN' | 'LIQUIDATED'

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
