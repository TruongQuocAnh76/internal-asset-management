import type { BorrowRequest, RequestFormData, GetRequestsParams, RequestAsset, RequestKit, AssetCategory } from '../types/request.types'

export const useRequests = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.backendUrl

  // Get requests with query params - uses GET /requests
  const getRequests = async (params: GetRequestsParams = {}) => {
    const queryParams: Record<string, string> = {}

    if (params.status) queryParams.status = params.status
    if (params.requesterId) queryParams.requesterId = params.requesterId
    if (params.assetId) queryParams.assetId = params.assetId
    if (params.kitId) queryParams.kitId = params.kitId
    if (params.priority) queryParams.priority = params.priority
    if (params.search) queryParams.search = params.search
    if (params.page) queryParams.page = params.page.toString()
    if (params.limit) queryParams.limit = params.limit.toString()
    if (params.order) queryParams.order = params.order
    if (params.orderBy) queryParams.orderBy = params.orderBy

    try {
      const result = await $fetch<BorrowRequest[]>(`${baseUrl}/requests`, {
        params: queryParams,
        credentials: 'include'
      })
      return { data: ref(result), error: ref<any>(null) }
    } catch (err) {
      return { data: ref<BorrowRequest[] | null>(null), error: ref(err) }
    }
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
    const { type, dueDate, ...rest } = data
    const payload = {
      ...rest,
      ...(dueDate ? { dueDate } : {})
    }
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
  const provideRequest = async (id: string, assetId?: string, kitId?: string) => {
    const body: Record<string, string> = {}
    if (assetId) body.assetId = assetId
    if (kitId) body.kitId = kitId
    return $fetch<BorrowRequest>(`${baseUrl}/requests/provide?id=${id}`, {
      method: 'PUT',
      body,
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

  // Assign request - uses POST /requests/assign
  // Admin directly assigns an asset or kit to a user
  const assignRequest = async (data: {
    assetId?: string
    kitId?: string
    requesterId: string
    reason: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    dueDate?: string
  }) => {
    return $fetch<BorrowRequest>(`${baseUrl}/requests/assign`, {
      method: 'POST',
      body: data,
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
    try {
      const result = await $fetch<AssetCategory[]>(`${baseUrl}/category`, {
        credentials: 'include'
      })
      return { data: ref(result) }
    } catch {
      return { data: ref<AssetCategory[] | null>(null) }
    }
  }

  // Get available assets by category
  const getAvailableAssets = async (categoryId?: string, search?: string) => {
    const params: Record<string, string> = { status: 'READY' }
    if (categoryId) params.category_id = categoryId
    if (search) params.search = search

    try {
      const response = await $fetch<{ data: RequestAsset[] }>(`${baseUrl}/assets`, {
        params,
        credentials: 'include',
      })
      return { data: ref((response as any)?.data ?? response ?? []) }
    } catch {
      return { data: ref<RequestAsset[] | null>(null) }
    }
  }

  // Get available kits (READY status), optionally filtered by category
  const getAvailableKits = async (search?: string, categoryId?: string) => {
    const params: Record<string, string> = { filter: 'status', filterValue: 'AVAILABLE' }
    if (search) params.search = search
    if (categoryId) params.category_id = categoryId

    try {
      const response = await $fetch<any>(`${baseUrl}/kits`, {
        params,
        credentials: 'include',
      })
      const items = (response as any)?.data ?? response ?? []
      const result: RequestKit[] = Array.isArray(items) ? items.map((kit: any) => ({
        id: kit.id,
        status: kit.status,
        template: kit.template
      })) : []
      return { data: ref(result) }
    } catch {
      return { data: ref<RequestKit[] | null>(null) }
    }
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
    assignRequest,
    getAssetCategories,
    getAvailableAssets,
    getAvailableKits
  }
}
