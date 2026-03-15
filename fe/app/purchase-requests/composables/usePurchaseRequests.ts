import type {
  PurchaseRequest,
  PurchaseRequestFormData,
  GetPurchaseRequestsParams,
  PurchaseRequestsResponse,
  ReceiveAssetFormData,
  ReceiveAssetResponse,
} from '../types/purchase-request.types'

export const usePurchaseRequests = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.backendUrl

  const getPurchaseRequestById = async (id: string) => {
    return $fetch<PurchaseRequest>(`${baseUrl}/purchase-requests/${id}`, {
      method: 'GET',
      credentials: 'include',
    })
  }

  const getPurchaseRequests = async (params: GetPurchaseRequestsParams = {}) => {
    const queryParams = new URLSearchParams()

    if (params.filter) queryParams.append('filter', params.filter)
    if (params.filterValue) queryParams.append('filterValue', params.filterValue)
    if (params.order) queryParams.append('order', params.order)
    if (params.orderBy) queryParams.append('orderBy', params.orderBy)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `/purchase-requests${queryString ? `?${queryString}` : ''}`

    try {
      const result = await $fetch<PurchaseRequestsResponse>(url, {
        method: 'GET',
        baseURL: baseUrl,
        credentials: 'include',
      })
      return { data: ref(result), error: ref<any>(null) }
    } catch (err) {
      return { data: ref<PurchaseRequestsResponse | null>(null), error: ref(err) }
    }
  }

  const createPurchaseRequest = async (
    data: PurchaseRequestFormData,
    requestedBy: string,
  ) => {
    return $fetch<PurchaseRequest>(`${baseUrl}/purchase-requests`, {
      method: 'POST',
      body: {
        ...data,
        requested_by: requestedBy,
        specs: data.specs || {},
      },
      credentials: 'include',
    })
  }

  const tlApprove = async (id: string) => {
    return $fetch<PurchaseRequest>(`${baseUrl}/purchase-requests/${id}/tl-approve`, {
      method: 'POST',
      credentials: 'include',
    })
  }

  const bodApprove = async (id: string) => {
    return $fetch<PurchaseRequest>(`${baseUrl}/purchase-requests/${id}/bod-approve`, {
      method: 'POST',
      credentials: 'include',
    })
  }

  const reject = async (id: string) => {
    return $fetch<PurchaseRequest>(`${baseUrl}/purchase-requests/${id}/reject`, {
      method: 'POST',
      credentials: 'include',
    })
  }

  const receive = async (id: string, data: ReceiveAssetFormData) => {
    return $fetch<ReceiveAssetResponse>(`${baseUrl}/purchase-requests/${id}/receive`, {
      method: 'POST',
      body: data,
      credentials: 'include',
    })
  }

  return {
    getPurchaseRequestById,
    getPurchaseRequests,
    createPurchaseRequest,
    tlApprove,
    bodApprove,
    reject,
    receive,
  }
}
