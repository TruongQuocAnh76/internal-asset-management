import type {
  Kit,
  GetKitsParams,
  KitFormData,
} from '../types/kit.types'

export const useKits = () => {
  const config = useRuntimeConfig()

  // GET /assets/kits
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
    const url = `/assets/kits${queryString ? `?${queryString}` : ''}`

    return await useFetch<Kit[]>(url, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // GET /assets/kits/:id
  const getKitById = async (id: string) => {
    return await $fetch<Kit>(`/assets/kits/${id}`, {
      method: 'GET',
      baseURL: config.public.backendUrl,
      credentials: 'include'
    })
  }

  // POST /assets/kits
  const createKit = async (formData: KitFormData) => {
    return await $fetch<Kit>('/assets/kits', {
      method: 'POST',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: formData
    })
  }

  // PUT /assets/kits/:id
  const updateKit = async (id: string, formData: Partial<KitFormData>) => {
    return await $fetch<Kit>(`/assets/kits/${id}`, {
      method: 'PUT',
      baseURL: config.public.backendUrl,
      credentials: 'include',
      body: formData
    })
  }

  // DELETE /assets/kits/:id
  const deleteKit = async (id: string) => {
    return await $fetch<{ message: string }>(`/assets/kits/${id}`, {
      method: 'DELETE',
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
    searchAvailableAssets,
  }
}
