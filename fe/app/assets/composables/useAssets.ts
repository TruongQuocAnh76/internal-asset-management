import type { GetAssetsParams, AssetsResponse, Asset, AssetFormData, AssetStatus } from '../types/asset.types'

export const useAssets = () => {
  const config = useRuntimeConfig()

  const getAllAssets = async (params: GetAssetsParams = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.filter && params.filter_value) {
      queryParams.append('filter', params.filter)
      queryParams.append('filterValue', params.filter_value)
    }
    
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

    const data = await useFetch<AssetsResponse>(url, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })

    return data
  }

  const getAssetById = async (id: string) => {
    return await $fetch<Asset>(`/assets/${id}`, {
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

  const getCategories = async () => {
    const data = await useFetch<{ id: string; name: string; code: string }[]>('/assets/category/count', {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })

    return data
  }

  return {
    getAllAssets,
    getAssetById,
    createAsset,
    updateAsset,
    updateAssetStatus,
    getCategories,
  }
}
