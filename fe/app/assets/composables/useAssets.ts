import type {
  GetAssetsParams,
  AssetsResponse,
  Asset,
  AssetItem,
  AssetFormData,
  AssetStatus,
  AssetItemUpdatePayload,
} from '../types/asset.types'

export const useAssets = () => {
  const config = useRuntimeConfig()

  const getAllAssets = async (params: GetAssetsParams = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.status) queryParams.append('status', params.status)
    if (params.category_id) queryParams.append('category_id', params.category_id)
    if (params.acquired_at) queryParams.append('acquired_at', params.acquired_at)

    if (params.search) {
      queryParams.append('search', params.search)
    }
    
    if (params.order) {
      queryParams.append('order', params.order)
    }
    
    if (params.page) {
      queryParams.append('page', params.page.toString())
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const queryString = queryParams.toString()
    const url = `/assets${queryString ? `?${queryString}` : ''}`

    try {
      const result = await $fetch<AssetsResponse>(url, {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      return { data: ref(result), error: ref<any>(null) }
    } catch (err) {
      return { data: ref<AssetsResponse | null>(null), error: ref(err) }
    }
  }

  const getAssetById = async (id: string) => {
    return await $fetch<Asset>(`/assets/${id}`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  const getAssetItems = async (assetId: string) => {
    return await $fetch<AssetItem[]>(`/assets/${assetId}/items`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  const createAsset = async (formData: AssetFormData, imageCount: number = 0) => {
    return await $fetch<{ createdAsset: { id: string }; tempImageUrls: string[] }>('/assets', {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: {
        ...formData,
        image_num: imageCount,
        specs: formData.specs || {}
      }
    })
  }

  const updateAsset = async (id: string, formData: Partial<AssetFormData>) => {
    return await $fetch<Asset>(`/assets/${id}`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: {
        ...formData,
        specs: formData.specs || {}
      }
    })
  }

  const updateAssetStatus = async (id: string, status: AssetStatus, reason?: string) => {
    return await $fetch<Asset>(`/assets/${id}`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: {
        status,
        ...(reason && { reason })
      }
    })
  }

  const updateAssetItem = async (itemId: string, payload: AssetItemUpdatePayload) => {
    return await $fetch<AssetItem>(`/assets/items/${itemId}`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: payload,
    })
  }

  const getCategories = async () => {
    try {
      const result = await $fetch<{ id: string; name: string; code: string }[]>('/assets/category/count', {
        method: 'GET',
        baseURL: config.public.backendUrl,
        credentials: 'include'
      })
      return { data: ref(result) }
    } catch {
      return { data: ref<{ id: string; name: string; code: string }[] | null>(null) }
    }
  }

  const exportAssets = async (format: 'pdf' | 'excel') => {
    const url = `${config.public.backendUrl}/assets/export?format=${format}`
    const res = await $fetch.raw(url, {
      method: 'GET',
      credentials: 'include',
      responseType: 'blob',
    })
    const blob = res._data as Blob
    const ext = format === 'pdf' ? 'pdf' : 'xlsx'
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `asset-report-${Date.now()}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  return {
    getAllAssets,
    getAssetById,
    getAssetItems,
    createAsset,
    updateAsset,
    updateAssetStatus,
    updateAssetItem,
    getCategories,
    exportAssets,
  }
}
