import type { BorrowRequest, RequestFormData, GetRequestsParams, RequestAsset, RequestKit, AssetCategory } from '../types/request.types'

export const useRequests = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.backendUrl

  // Get requests with query params - uses GET /requests?query=
  const getRequests = async (params: GetRequestsParams = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.filter) queryParams.append('filter', params.filter)
    if (params.filterValue) queryParams.append('filterValue', params.filterValue)
    if (params.search) queryParams.append('search', params.search)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.order) queryParams.append('order', params.order)
    if (params.orderBy) queryParams.append('orderBy', params.orderBy)

    return useFetch<BorrowRequest[]>(`${baseUrl}/requests`, {
      params: Object.fromEntries(queryParams),
      credentials: 'include'
    })
  }

  // Get single request by ID - uses GET /requests/:id
  const getRequestById = async (id: string) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/${id}`, {
      credentials: 'include'
    })
  }

  // Create request - uses POST /requests
  const createRequest = async (data: RequestFormData) => {
    // Strip type field - backend doesn't need it, it infers from assetId/kitId
    const { type, ...payload } = data
    return $fetch<BorrowRequest>(`${baseUrl}/requests`, {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })
  }

  // Edit request - uses PUT /requests?id=
  const editRequest = async (id: string, data: RequestFormData) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests?id=${id}`, {
      method: 'PUT',
      body: data,
      credentials: 'include'
    })
  }

  // Approve request - uses PUT /requests/approve?id=
  // Team Lead approves PENDING -> APPROVED
  const approveRequest = async (id: string, assetId?: string, kitId?: string) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/approve?id=${id}`, {
      method: 'PUT',
      body: { asset_id: assetId, kit_id: kitId },
      credentials: 'include'
    })
  }

  // Reject request - uses PUT /requests/reject?id=
  // Team Lead or Admin rejects -> REJECTED
  const rejectRequest = async (id: string) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/reject?id=${id}`, {
      method: 'PUT',
      credentials: 'include'
    })
  }

  // Provide request - uses PUT /requests/provide?id=
  // Admin provides asset APPROVED -> PROVIDED
  const provideRequest = async (id: string) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/provide?id=${id}`, {
      method: 'PUT',
      credentials: 'include'
    })
  }

  // Return request - uses PUT /requests/return?id=
  // User returns asset PROVIDED -> RETURNED (or OVERDUE -> RETURNED)
  const returnRequest = async (id: string, assetId?: string, kitId?: string) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/return?id=${id}`, {
      method: 'PUT',
      body: { asset_id: assetId, kit_id: kitId },
      credentials: 'include'
    })
  }

  // Cancel request - uses PUT /requests/cancel?id=
  // User cancels PENDING or APPROVED -> CANCELED
  const cancelRequest = async (id: string) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/cancel?id=${id}`, {
      method: 'PUT',
      credentials: 'include'
    })
  }

  // Get asset categories - uses GET /category
  const getAssetCategories = async () => {
    return useFetch<AssetCategory[]>(`${baseUrl}/category`, {
      credentials: 'include'
    })
  }

  // Get available assets by category
  const getAvailableAssets = async (categoryId?: string, search?: string) => {
    const params: Record<string, string> = { filter: 'status', filterValue: 'READY' }
    if (categoryId) params.category_id = categoryId
    if (search) params.search = search

    return useFetch<{ data: RequestAsset[] }>(`${baseUrl}/assets`, {
      params,
      credentials: 'include',
      transform: (response: any) => response.data || []
    })
  }

  // Get available kits (READY status)
  const getAvailableKits = async (search?: string) => {
    const params: Record<string, string> = { filter: 'status', filterValue: 'READY' }
    if (search) params.search = search

    return useFetch<{ data: RequestKit[] }>(`${baseUrl}/kits`, {
      params,
      credentials: 'include',
      transform: (response: any) => {
        const items = response.data || response || []
        return Array.isArray(items) ? items.map((kit: any) => ({
          id: kit.id,
          status: kit.status,
          template: kit.template
        })) : []
      }
    })
  }

  return {
    getRequests,
    getRequestById,
    createRequest,
    editRequest,
    approveRequest,
    rejectRequest,
    provideRequest,
    returnRequest,
    cancelRequest,
    getAssetCategories,
    getAvailableAssets,
    getAvailableKits
  }
}
