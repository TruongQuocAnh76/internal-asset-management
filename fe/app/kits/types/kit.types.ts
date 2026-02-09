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

export interface KitDraft {
  id: string
  name: string
  asset_ids: string[]
  lastSavedAt: string
}
