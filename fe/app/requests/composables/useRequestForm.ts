import type { RequestFormData, RequestAsset, AssetCategory } from '../types/request.types'
import { useRequests } from './useRequests'
import { useDraft } from './useDraft'

export const useRequestForm = () => {
  const { createRequest, getAssetCategories, getAvailableAssets } = useRequests()
  const { saveDraft, getDraft, clearDraft, hasDraft } = useDraft()
  const { user } = useAuth()

  // Form state - matches backend CreateRequestDto
  const formData = ref<RequestFormData>({
    assetId: undefined,
    kitId: undefined,
    requesterId: '',
    reason: '',
    priority: 'MEDIUM'
  })

  // UI state
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isSubmitting = ref(false)
  const showPreview = ref(false)
  const showDraftRestore = ref(false)
  const createdRequestId = ref<string | null>(null)

  // Validation errors
  const errors = ref<Partial<Record<keyof RequestFormData | 'general', string>>>({})

  // Asset categories and available assets
  const assetCategories = ref<AssetCategory[]>([])
  const availableAssets = ref<RequestAsset[]>([])
  const selectedCategoryId = ref<string>('')
  const selectedAsset = ref<RequestAsset | null>(null)
  const isLoadingAssets = ref(false)

  // Computed
  const requesterInfo = computed(() => ({
    id: user.value?.id || '',
    name: `${user.value?.first_name || ''} ${user.value?.last_name || ''}`.trim(),
    email: user.value?.email || '',
    department: user.value?.department || ''
  }))

  const canSubmit = computed(() => {
    return (
      (formData.value.assetId || formData.value.kitId) &&
      formData.value.reason.trim().length > 0 &&
      Object.keys(errors.value).length === 0
    )
  })

  // Load asset categories on init
  const loadAssetCategories = async () => {
    try {
      const { data } = await getAssetCategories()
      if (data.value) {
        assetCategories.value = Array.isArray(data.value) ? data.value : []
      } else {
        assetCategories.value = []
      }
    } catch (err) {
      console.error('Failed to load asset categories:', err)
      assetCategories.value = []
    }
  }

  // Load available assets when category changes
  const loadAvailableAssets = async (search?: string) => {
    isLoadingAssets.value = true
    try {
      const { data } = await getAvailableAssets(selectedCategoryId.value || undefined, search)
      if (data.value) {
        availableAssets.value = Array.isArray(data.value) ? data.value : []
      } else {
        availableAssets.value = []
      }
    } catch (err) {
      console.error('Failed to load available assets:', err)
      availableAssets.value = []
    } finally {
      isLoadingAssets.value = false
    }
  }

  // Validate a single field
  const validateField = (field: keyof RequestFormData) => {
    delete errors.value[field]

    switch (field) {
      case 'assetId':
        if (!formData.value.assetId) {
          errors.value.assetId = 'Please select an asset'
        }
        break

      case 'reason':
        if (!formData.value.reason.trim()) {
          errors.value.reason = 'Reason/justification is required'
        } else if (formData.value.reason.length < 10) {
          errors.value.reason = 'Please provide a more detailed reason (min 10 characters)'
        } else if (formData.value.reason.length > 500) {
          errors.value.reason = 'Reason is too long (max 500 characters)'
        }
        break
    }

    return !errors.value[field]
  }

  // Validate all fields
  const validateForm = () => {
    errors.value = {}
    
    validateField('assetId')
    validateField('reason')

    return Object.keys(errors.value).length === 0
  }

  // Handle category selection (filter assets)
  const onCategoryChange = (categoryId: string) => {
    selectedCategoryId.value = categoryId
    formData.value.assetId = ''
    selectedAsset.value = null
    loadAvailableAssets()
    autoSave()
  }

  // Handle specific asset selection
  const onAssetChange = (assetId: string) => {
    formData.value.assetId = assetId
    selectedAsset.value = Array.isArray(availableAssets.value) 
      ? availableAssets.value.find((a: RequestAsset) => a.id === assetId) || null
      : null
    validateField('assetId')
    autoSave()
  }

  // Auto-save draft
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null
  const autoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    autoSaveTimeout = setTimeout(() => {
      saveDraft(formData.value)
    }, 1000)
  }

  // Show preview modal
  const openPreview = () => {
    if (validateForm()) {
      showPreview.value = true
    }
  }

  const closePreview = () => {
    showPreview.value = false
  }

  // Submit request
  const submitRequest = async () => {
    if (!validateForm()) return null

    isSubmitting.value = true
    errors.value = {}

    try {
      // Set requester ID from current user
      formData.value.requesterId = user.value?.id || ''

      const result = await createRequest(formData.value)
      createdRequestId.value = result.id

      // Clear draft on successful submit
      clearDraft()
      showPreview.value = false

      return result
    } catch (err: any) {
      console.error('Failed to submit request:', err)
      errors.value.general = err.message || 'Failed to submit request. Please try again.'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  // Restore draft
  const restoreDraft = () => {
    const draft = getDraft()
    if (draft) {
      formData.value = { ...draft.form_data }
      if (draft.form_data.assetId) {
        loadAvailableAssets()
      }
    }
    showDraftRestore.value = false
  }

  const discardDraft = () => {
    clearDraft()
    showDraftRestore.value = false
  }

  // Reset form
  const resetForm = () => {
    formData.value = {
      assetId: '',
      requesterId: '',
      reason: '',
      priority: 'MEDIUM'
    }
    selectedCategoryId.value = ''
    selectedAsset.value = null
    availableAssets.value = []
    errors.value = {}
    createdRequestId.value = null
  }

  // Initialize
  const init = async (prefilledAssetId?: string) => {
    isLoading.value = true
    await loadAssetCategories()
    await loadAvailableAssets()
    
    // If assetId is provided, pre-select it
    if (prefilledAssetId) {
      formData.value.assetId = prefilledAssetId
      // Find and set the selected asset
      if (Array.isArray(availableAssets.value)) {
        const asset = availableAssets.value.find(a => a.id === prefilledAssetId)
        if (asset) {
          selectedAsset.value = asset
          // Set the category if available
          if (asset.category_id) {
            selectedCategoryId.value = asset.category_id
          }
        }
      }
    } else {
      // Check for existing draft only if no prefilled asset
      if (hasDraft()) {
        showDraftRestore.value = true
      }
    }
    
    isLoading.value = false
  }

  return {
    // State
    formData,
    errors,
    isLoading,
    isSaving,
    isSubmitting,
    showPreview,
    showDraftRestore,
    createdRequestId,
    assetCategories,
    availableAssets,
    selectedCategoryId,
    selectedAsset,
    isLoadingAssets,

    // Computed
    requesterInfo,
    canSubmit,

    // Methods
    init,
    validateField,
    validateForm,
    onCategoryChange,
    onAssetChange,
    openPreview,
    closePreview,
    submitRequest,
    restoreDraft,
    discardDraft,
    resetForm,
    loadAvailableAssets
  }
}
