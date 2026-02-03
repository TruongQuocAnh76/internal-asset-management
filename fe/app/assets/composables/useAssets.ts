import type { GetAssetsParams, AssetsResponse } from '../types/asset.types'

export const useAssets = () => {
  const config = useRuntimeConfig()

  const getAllAssets = async (params: GetAssetsParams = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.filter && params.filter_value) {
      queryParams.append('filter', params.filter)
      queryParams.append('filter_value', params.filter_value)
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

  return {
    getAllAssets,
  }
}
