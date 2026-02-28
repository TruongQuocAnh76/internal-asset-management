import type {
  MaintenanceItem,
  RepairRecord,
  SetMaintenancePayload,
  ResolveMaintenancePayload,
} from '../types/asset.types'

export const useMaintenance = () => {
  const config = useRuntimeConfig()

  const getMaintenanceItems = async () => {
    return $fetch<MaintenanceItem[]>('/assets/maintenance/items', {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
  }

  const getRepairHistory = async (assetItemId: string) => {
    return $fetch<RepairRecord[]>(`/assets/maintenance/repairs/${assetItemId}`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include',
    })
  }

  const setMaintenance = async (payload: SetMaintenancePayload) => {
    return $fetch<{ asset_item_id: string; status: string }>('/assets/maintenance/repair', {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: payload,
    })
  }

  const resolveMaintenance = async (payload: ResolveMaintenancePayload) => {
    return $fetch<{ asset_item_id: string; status: string }>('/assets/maintenance/resolve', {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: payload,
    })
  }

  return {
    getMaintenanceItems,
    getRepairHistory,
    setMaintenance,
    resolveMaintenance,
  }
}
