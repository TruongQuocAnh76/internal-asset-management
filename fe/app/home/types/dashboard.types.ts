export interface AssetSummary {
  total: number
  ready: number
  inUse: number
  maintenance: number
  broken: number
  liquidated: number
}

export interface CategoryData {
  category: string
  count: number
}

export interface PendingApproval {
  asset_name: string
  requester_name: string
  requested_at: string
  status: string
}

export interface Activity {
  asset_name: string
  event_type: string
  actor_name: string
  occurred_at: string
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  route: string
  color: 'primary' | 'success' | 'warning' | 'secondary'
  roles: string[]
}
