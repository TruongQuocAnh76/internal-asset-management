import type {
  Kit,
  GetKitsParams,
  KitFormData,
  KitsResponse,
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

    try {
      const result = await $fetch<KitsResponse>(url, {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      return { data: ref(result), error: ref<any>(null) }
    } catch (err) {
      return { data: ref<KitsResponse | null>(null), error: ref(err) }
    }
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
      body: {
        name: formData.name,
        asset_ids: formData.components
          .filter(c => c.assetId) // only include components with actual assets
          .map(c => c.assetId) // extract the asset IDs
      }
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
  const searchAvailableAssets = async (query: string, categoryId?: string) => {
    const params = new URLSearchParams()
    if (query) params.append('search', query)
    params.append('status', 'READY')
    if (categoryId) params.append('category_id', categoryId)

    try {
      const result = await $fetch<{ data: any[] }>(`/assets?${params.toString()}`, {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      return { data: ref(result) }
    } catch {
      return { data: ref<{ data: any[] } | null>(null) }
    }
  }

  // GET /category - Get all categories
  const getCategories = async () => {
    try {
      const result = await $fetch<{ id: string; name: string; code: string }[]>('/category', {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      return { data: ref(result) }
    } catch {
      return { data: ref<{ id: string; name: string; code: string }[] | null>(null) }
    }
  }

  // GET /kits/kpis - Get kit KPIs
  const getKitKPIs = async () => {
    try {
      const data = await $fetch<any>('/kits/kpis', {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      return {
        data: (data as any) || {
          totalKits: 0,
          activeKits: 0,
          assignedKits: 0,
          archivedKits: 0,
        },
        error: null
      }
    } catch (err) {
      console.error('Error fetching KPIs:', err)
      return {
        data: {
          totalKits: 0,
          activeKits: 0,
          assignedKits: 0,
          archivedKits: 0,
        },
        error: null
      }
    }
  }

  // POST /kits/export - Export kits
  const exportKits = async (kitIds: string[]) => {
    try {
      const blob = await $fetch<Blob>('/kits/export', {
        method: 'POST',
        baseURL: config.public.backendUrl,
        credentials: 'include',
        body: { kitIds },
        responseType: 'blob'
      })
      return blob
    } catch (error) {
      console.error('Error exporting kits:', error)
      throw error
    }
  }

  // POST /kits/bulk/archive - Bulk archive kits
  const bulkArchiveKits = async (kitIds: string[]) => {
    try {
      const result = await $fetch<{ success: boolean }[]>('/kits/bulk/archive', {
        method: 'POST',
        baseURL: config.public.backendUrl,
        credentials: 'include',
        body: { kitIds }
      })
      return kitIds.map((id, index) => ({
        id,
        success: result?.[index]?.success ?? true,
        error: result?.[index]?.success === false ? 'Failed to archive' : undefined
      }))
    } catch (error) {
      console.error('Error archiving kits:', error)
      return kitIds.map(id => ({
        id,
        success: false,
        error: 'Network error'
      }))
    }
  }

  // PUT /kits/bulk/category - Bulk update category
  const bulkUpdateCategory = async (kitIds: string[], category: string) => {
    try {
      const result = await $fetch<{ success: boolean }[]>('/kits/bulk/category', {
        method: 'PUT',
        baseURL: config.public.backendUrl,
        credentials: 'include',
        body: { kitIds, category }
      })
      return kitIds.map((id, index) => ({
        id,
        success: result?.[index]?.success ?? true,
        error: result?.[index]?.success === false ? 'Failed to update category' : undefined
      }))
    } catch (error) {
      console.error('Error updating categories:', error)
      return kitIds.map(id => ({
        id,
        success: false,
        error: 'Network error'
      }))
    }
  }

  // PUT /kits/bulk/tags - Bulk update tags
  const bulkUpdateTags = async (kitIds: string[], tags: string[], action: 'add' | 'replace') => {
    try {
      const result = await $fetch<{ success: boolean }[]>('/kits/bulk/tags', {
        method: 'PUT',
        baseURL: config.public.backendUrl,
        credentials: 'include',
        body: { kitIds, tags, action }
      })
      return kitIds.map((id, index) => ({
        id,
        success: result?.[index]?.success ?? true,
        error: result?.[index]?.success === false ? 'Failed to update tags' : undefined
      }))
    } catch (error) {
      console.error('Error updating tags:', error)
      return kitIds.map(id => ({
        id,
        success: false,
        error: 'Network error'
      }))
    }
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
    getCategories,
    getKitKPIs,
    exportKits,
    bulkArchiveKits,
    bulkUpdateCategory,
    bulkUpdateTags,
  }
}
