export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE'

export interface Category {
  id: string
  code: string
  name: string
  salvage_value?: number | null
  default_life_months?: number | null
  decline_balance_rate?: number | null
  default_depreciation_method?: DepreciationMethod | null
}

export interface CategoryFormData {
  name: string
  salvage_value: number | null
  default_life_months: number | null
  decline_balance_rate: number | null
  default_depreciation_method: DepreciationMethod | null
}
