import type {
  Kit,
  GetKitsParams,
  KitFormData,
} from '../types/kit.types'

export const useKits = () => {
  const config = useRuntimeConfig()

  // GET /kits
  const getKits = async (params: GetKitsParams = {}) => {
    const queryParams = new URLSearchParams()

    if (params.search) queryParams.append('search', params.search)
    if (params.filter) queryParams.append('filter', params.filter)
    if (params.filterValue) queryParams.append('filterValue', params.filterValue)
    if (params.order) queryParams.append('order', params.order)
    if (params.orderBy) queryParams.append('orderBy', params.orderBy)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `/kits${queryString ? `?${queryString}` : ''}`

    return await useFetch<Kit[]>(url, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // GET /kits/:id
  const getKitById = async (id: string) => {
    return await $fetch<Kit>(`/kits/${id}`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // POST /kits
  const createKit = async (formData: KitFormData) => {
    return await $fetch<Kit>('/kits', {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: formData
    })
  }

  // PUT /kits/:id
  const updateKit = async (id: string, formData: Partial<KitFormData>) => {
    return await $fetch<Kit>(`/kits/${id}`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: formData
    })
  }

  // DELETE /kits/:id
  const deleteKit = async (id: string) => {
    return await $fetch<{ message: string }>(`/kits/${id}`, {
      method: 'DELETE',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // POST /kits/:id/components
  const addComponentToKit = async (kitId: string, body: {
    assetId?: string
    assetType: string
    quantity: number
    isPlaceholder: boolean
  }) => {
    return await $fetch(`/kits/${kitId}/components`, {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body
    })
  }

  // DELETE /kits/:id/components/:assetId
  const removeComponentFromKit = async (kitId: string, assetId: string) => {
    return await $fetch(`/kits/${kitId}/components/${assetId}`, {
      method: 'DELETE',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // PUT /kits/:id/components/:assetId/replace
  const replaceComponentAsset = async (kitId: string, oldAssetId: string, newAssetId: string) => {
    return await $fetch(`/kits/${kitId}/components/${oldAssetId}/replace`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: { newAssetId }
    })
  }

  // PUT /kits/:id/components/:assetId/placeholder
  const convertComponentToPlaceholder = async (kitId: string, assetId: string) => {
    return await $fetch(`/kits/${kitId}/components/${assetId}/placeholder`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // GET /kits/:id/audit
  const getKitAuditLog = async (kitId: string) => {
    try {
      return await $fetch<any[]>(`/kits/${kitId}/audit`, {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
    } catch {
      return []
    }
  }

  // GET /kits/:id/assignments
  const getKitAssignments = async (kitId: string) => {
    try {
      return await $fetch<any[]>(`/kits/${kitId}/assignments`, {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
    } catch {
      return []
    }
  }

  // PUT /kits/:id/archive
  const archiveKit = async (kitId: string) => {
    return await $fetch(`/kits/${kitId}/archive`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // PUT /kits/:id/restore
  const restoreKit = async (kitId: string) => {
    return await $fetch(`/kits/${kitId}/restore`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // GET /assets (for searching available assets to add to kits)
  const searchAvailableAssets = async (query: string, status?: string) => {
    const params = new URLSearchParams()
    if (query) params.append('search', query)
    if (status) params.append('filter', 'status')
    if (status) params.append('filterValue', status)

    return await useFetch<{ data: any[] }>(`/assets?${params.toString()}`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  return {
    getKits,
    getKitById,
    createKit,
    updateKit,
    deleteKit,
    addComponentToKit,
    removeComponentFromKit,
    replaceComponentAsset,
    convertComponentToPlaceholder,
    getKitAuditLog,
    getKitAssignments,
    archiveKit,
    restoreKit,
    searchAvailableAssets,
  }
}
