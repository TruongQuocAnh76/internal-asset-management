import type { BorrowRequest, RequestPermissions, UserRole, ApprovalStep } from '../types/request.types'
import { getApprovalChain } from '../types/request.types'
import { useRequests } from './useRequests'

export const useRequestDetail = (requestId: string) => {
  const { 
    getRequestById, 
    cancelRequest, 
    approveRequest,
    rejectRequest,
    provideRequest,
    returnRequest
  } = useRequests()
  const { user } = useAuth()

  // State
  const request = ref<BorrowRequest | null>(null)
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  // Modal states
  const showApprovalModal = ref(false)
  const approvalAction = ref<'APPROVE' | 'REJECT' | null>(null)

  // Check if current user is the requester
  const isRequester = computed(() => {
    return request.value?.requester_id === user.value?.id
  })

  // Check if user has approve permission
  const hasApprovePermission = computed(() => {
    return user.value?.permissions?.includes('request:approve') || false
  })

  // Check if user has provided permission
  const hasProvidedPermission = computed(() => {
    return user.value?.permissions?.includes('request:provided') || false
  })

  // Calculate permissions based on user permissions and request status
  // Flow: PENDING -> User with approve permission -> APPROVED -> User with provided permission -> PROVIDED -> User RETURN -> RETURNED
  // User can CANCEL while PENDING or APPROVED
  // Users with approve or provided permission can REJECT
  const permissions = computed<RequestPermissions>(() => {
    if (!request.value) {
      return {
        canView: false,
        canEdit: false,
        canCancel: false,
        canApprove: false,
        canReject: false,
        canProvide: false,
        canReturn: false
      }
    }

    const status = request.value.status

    return {
      canView: true,
      canEdit: isRequester.value && status === 'PENDING',
      // User can cancel while PENDING or APPROVED (before provided)
      canCancel: isRequester.value && (status === 'PENDING' || status === 'APPROVED'),
      // Users with approve permission can approve PENDING requests
      canApprove: hasApprovePermission.value && status === 'PENDING',
      // Users with approve permission can reject PENDING, users with provided permission can reject PENDING or APPROVED
      canReject: (hasApprovePermission.value && status === 'PENDING') || (hasProvidedPermission.value && (status === 'PENDING' || status === 'APPROVED')),
      // Users with provided permission can provide APPROVED requests (changes to PROVIDED)
      canProvide: hasProvidedPermission.value && status === 'APPROVED',
      // User can return PROVIDED or OVERDUE assets
      canReturn: isRequester.value && (status === 'PROVIDED' || status === 'OVERDUE')
    }
  })

  // Get hardcoded approval chain based on current status
  const approvalChain = computed<ApprovalStep[]>(() => {
    if (!request.value) return []
    return getApprovalChain(request.value.status)
  })

  // Format request title
  const requestTitle = computed(() => {
    if (!request.value) return ''
    if (request.value.kit) {
      return request.value.kit.template?.name || 'Kit Request'
    }
    return request.value.asset?.name || 'Asset Request'
  })

  // Determine request type
  const requestType = computed(() => {
    return request.value?.kit_id ? 'kit' : 'asset'
  })

  // Fetch request details
  const fetchRequest = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getRequestById(requestId)
      if (data.value) {
        request.value = data.value
      }
    } catch (err: any) {
      console.error('Failed to fetch request:', err)
      error.value = err.message || 'Failed to load request details'
    } finally {
      isLoading.value = false
    }
  }

  // Cancel request - user can cancel PENDING or APPROVED
  const handleCancel = async () => {
    if (!request.value || !permissions.value.canCancel) return

    isProcessing.value = true
    try {
      request.value = await cancelRequest(request.value.id)
    } catch (err: any) {
      console.error('Failed to cancel request:', err)
      error.value = err.message || 'Failed to cancel request'
    } finally {
      isProcessing.value = false
    }
  }

  // Open approval modal
  const openApprovalModal = (action: 'APPROVE' | 'REJECT') => {
    approvalAction.value = action
    showApprovalModal.value = true
  }

  const closeApprovalModal = () => {
    approvalAction.value = null
    showApprovalModal.value = false
  }

  // Handle approve (PENDING -> APPROVED) - requires 'request:approve' permission
  const handleApprove = async () => {
    if (!request.value || !permissions.value.canApprove) return

    isProcessing.value = true
    try {
      request.value = await approveRequest(
        request.value.id,
        request.value.asset_id || undefined,
        request.value.kit_id || undefined
      )
      closeApprovalModal()
    } catch (err: any) {
      console.error('Failed to approve request:', err)
      error.value = err.message || 'Failed to approve request'
    } finally {
      isProcessing.value = false
    }
  }

  // Handle reject (PENDING/APPROVED -> REJECTED)
  const handleReject = async () => {
    if (!request.value || !permissions.value.canReject) return

    isProcessing.value = true
    try {
      request.value = await rejectRequest(request.value.id)
      closeApprovalModal()
    } catch (err: any) {
      console.error('Failed to reject request:', err)
      error.value = err.message || 'Failed to reject request'
    } finally {
      isProcessing.value = false
    }
  }

  // Handle provide (APPROVED -> PROVIDED) - requires 'request:provided' permission
  const handleProvide = async () => {
    if (!request.value || !permissions.value.canProvide) return

    isProcessing.value = true
    try {
      request.value = await provideRequest(request.value.id)
    } catch (err: any) {
      console.error('Failed to provide asset:', err)
      error.value = err.message || 'Failed to provide asset'
    } finally {
      isProcessing.value = false
    }
  }

  // Handle return (PROVIDED/OVERDUE -> RETURNED)
  const handleReturn = async () => {
    if (!request.value || !permissions.value.canReturn) return

    isProcessing.value = true
    try {
      request.value = await returnRequest(
        request.value.id,
        request.value.asset_id || undefined,
        request.value.kit_id || undefined
      )
    } catch (err: any) {
      console.error('Failed to return asset:', err)
      error.value = err.message || 'Failed to return asset'
    } finally {
      isProcessing.value = false
    }
  }

  // Initialize
  onMounted(() => {
    fetchRequest()
  })

  return {
    // State
    request,
    isLoading,
    isProcessing,
    error,
    showApprovalModal,
    approvalAction,

    // Computed
    isRequester,
    hasApprovePermission,
    hasProvidedPermission,
    permissions,
    requestTitle,
    requestType,
    approvalChain,

    // Methods
    fetchRequest,
    handleCancel,
    openApprovalModal,
    closeApprovalModal,
    handleApprove,
    handleReject,
    handleProvide,
    handleReturn
  }
}
