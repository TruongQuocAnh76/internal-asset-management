export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE'

export interface Category {
  id: string
  code: string
  name: string
  salvageValue?: number | null
  defaultLifeMonths?: number | null
  declineBalanceRate?: number | null
  defaultDepreciationMethod?: DepreciationMethod | null
}

export interface CategoryFormData {
  name: string
  salvageValue: number | null
  defaultLifeMonths: number | null
  declineBalanceRate: number | null
  defaultDepreciationMethod: DepreciationMethod | null
}
