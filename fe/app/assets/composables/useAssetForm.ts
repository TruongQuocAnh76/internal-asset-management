import type { AssetFormData, Asset, AssetStatus } from '../types/asset.types'
import { useAssets } from './useAssets'

export interface FormErrors {
  name?: string
  category_name?: string
  location_name?: string
  costs?: string
  initial_quantity?: string
  general?: string
}

export const useAssetForm = (mode: 'create' | 'edit' = 'create', assetId?: string) => {
  const { createAsset, updateAsset, getAssetById } = useAssets()
  const router = useRouter()

  // Form state
  const formData = ref<AssetFormData>({
    name: '',
    category_name: '',
    location_name: '',
    status: 'READY' as AssetStatus,
    costs: 0,
    initial_quantity: 1,
    specs: {},
  })

  // UI state
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errors = ref<FormErrors>({})
  const successMessage = ref('')
  const originalAsset = ref<Asset | null>(null)

  // Status options
  const statusOptions: { value: AssetStatus; label: string }[] = [
    { value: 'READY', label: 'Ready' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'MAINTAINANCE', label: 'Maintenance' },
    { value: 'BROKEN', label: 'Broken' },
    { value: 'LIQUIDATED', label: 'Liquidated' },
  ]

  // Load existing asset for edit mode
  const loadAsset = async () => {
    if (mode !== 'edit' || !assetId) return

    isLoading.value = true
    try {
      const asset = await getAssetById(assetId)
      if (asset) {
        originalAsset.value = asset
        formData.value = {
          name: asset.name || '',
          category_name: asset.category?.name || '',
          location_name: asset.location_name || '',
          status: asset.status || 'READY',
          costs: asset.costs || 0,
          initial_quantity: asset.stock || 1,
          specs: asset.asset_specs?.specs || {},
        }
      }
    } catch (err: any) {
      errors.value.general = err.data?.message || err.message || 'Failed to load asset'
    } finally {
      isLoading.value = false
    }
  }

  // Initialize - load asset if in edit mode
  onMounted(() => {
    if (mode === 'edit' && assetId) {
      loadAsset()
    }
  })

  // Validation
  const validateField = (field: keyof FormErrors): boolean => {
    errors.value[field] = undefined

    switch (field) {
      case 'name':
        if (!formData.value.name.trim()) {
          errors.value.name = 'Name is required'
          return false
        }
        if (formData.value.name.length < 2) {
          errors.value.name = 'Name must be at least 2 characters'
          return false
        }
        break

      case 'category_name':
        if (!formData.value.category_name.trim()) {
          errors.value.category_name = 'Category is required'
          return false
        }
        break

      case 'location_name':
        if (!formData.value.location_name.trim()) {
          errors.value.location_name = 'Location is required'
          return false
        }
        break

      case 'costs':
        if (formData.value.costs < 0) {
          errors.value.costs = 'Cost cannot be negative'
          return false
        }
        break

      case 'initial_quantity':
        if (formData.value.initial_quantity < 1) {
          errors.value.initial_quantity = 'Initial quantity must be at least 1'
          return false
        }
        break
    }

    return true
  }

  const validateAll = (): boolean => {
    // For edit mode, require at least one field to have a value
    if (mode === 'edit') {
      const hasAtLeastOneField = 
        formData.value.name.trim() !== '' ||
        formData.value.category_name.trim() !== '' ||
        formData.value.location_name.trim() !== '' ||
        formData.value.costs > 0

      if (!hasAtLeastOneField) {
        errors.value.general = 'At least one field must be filled'
        return false
      }
      
      // Only validate costs if provided
      if (formData.value.costs < 0) {
        errors.value.costs = 'Cost cannot be negative'
        return false
      }
      
      return true
    }

    // For create mode, all required fields must be filled
    const fields: (keyof FormErrors)[] = ['name', 'category_name', 'location_name', 'costs']
    let isValid = true

    for (const field of fields) {
      if (!validateField(field)) {
        isValid = false
      }
    }

    return isValid
  }

  // Submit handlers
  const handleSubmit = async (imageCount: number = 0) => {
    errors.value.general = undefined
    successMessage.value = ''

    // Validate all fields
    if (!validateAll()) {
      return false
    }

    isSaving.value = true

    try {
      if (mode === 'create') {
        const result = await createAsset(formData.value, imageCount)
        successMessage.value = 'Asset created successfully'
        
        // Return result so form can upload images
        return result
      } else if (mode === 'edit' && assetId) {
        await updateAsset(assetId, formData.value)
        successMessage.value = 'Asset updated successfully'
        return true
      }
    } catch (err: any) {
      errors.value.general = err.data?.message || err.message || 'An error occurred while saving'
      return false
    } finally {
      isSaving.value = false
    }

    return false
  }

  // Reset form
  const resetForm = () => {
    formData.value = {
      name: '',
      category_name: '',
      location_name: '',
      status: 'READY',
      costs: 0,
      initial_quantity: 1,
      specs: {},
    }
    errors.value = {}
    successMessage.value = ''
  }

  // Computed: check if form has changes (for edit mode)
  const hasChanges = computed(() => {
    if (mode !== 'edit' || !originalAsset.value) return true
    
    return (
      formData.value.name !== originalAsset.value.name ||
      formData.value.category_name !== (originalAsset.value.category?.name || '') ||
      formData.value.costs !== originalAsset.value.costs ||
      formData.value.status !== originalAsset.value.status
    )
  })

  // Computed: check if form is valid for submit
  const canSubmit = computed(() => {
    if (mode === 'edit') {
      // For edit mode, require at least one field
      const hasAtLeastOneField = 
        formData.value.name.trim() !== '' ||
        formData.value.category_name.trim() !== '' ||
        formData.value.location_name.trim() !== '' ||
        formData.value.costs > 0
      
      return hasAtLeastOneField && formData.value.costs >= 0 && !isSaving.value
    }
    
    // For create mode, all required fields must be filled
    return (
      formData.value.name.trim() !== '' &&
      formData.value.category_name.trim() !== '' &&
      formData.value.location_name.trim() !== '' &&
      formData.value.costs >= 0 &&
      !isSaving.value
    )
  })

  return {
    // State
    formData,
    isLoading,
    isSaving,
    errors,
    successMessage,
    
    // Options
    statusOptions,

    // Computed
    hasChanges,
    canSubmit,

    // Methods
    validateField,
    validateAll,
    handleSubmit,
    resetForm,
    loadAsset,
  }
}
