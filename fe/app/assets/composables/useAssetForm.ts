import type { AssetFormData, Asset, AssetStatus } from '../types/asset.types'
import { useAssets } from './useAssets'

export interface FormErrors {
  name?: string
  categoryName?: string
  locationName?: string
  costs?: string
  initialQuantity?: string
  general?: string
}

export const useAssetForm = (mode: 'create' | 'edit' = 'create', assetId?: string) => {
  const { createAsset, updateAsset, getAssetById } = useAssets()
  const router = useRouter()

  // Form state
  const formData = ref<AssetFormData>({
    name: '',
    categoryName: '',
    locationName: '',
    status: 'READY' as AssetStatus,
    costs: 0,
    initialQuantity: 1,
    specs: {},
    salvageValue: null,
    lifeMonths: null,
    declineBalanceRate: null,
    depreciationMethod: null,
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
          categoryName: asset.category?.name || '',
          locationName: '',
          status: asset.status || 'READY',
          costs: 0,
          initialQuantity: asset.stock || 1,
          specs: asset.asset_specs?.specs || {},
          salvageValue: asset.salvage_value ?? null,
          lifeMonths: asset.life_months ?? null,
          declineBalanceRate: asset.decline_balance_rate ?? null,
          depreciationMethod: asset.depreciation_method ?? null,
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

      case 'categoryName':
        if (!formData.value.categoryName.trim()) {
          errors.value.categoryName = 'Category is required'
          return false
        }
        break

      case 'locationName':
        if (!formData.value.locationName.trim()) {
          errors.value.locationName = 'Location is required'
          return false
        }
        break

      case 'costs':
        if (formData.value.costs < 0) {
          errors.value.costs = 'Cost cannot be negative'
          return false
        }
        break

      case 'initialQuantity':
        if (formData.value.initialQuantity < 1) {
          errors.value.initialQuantity = 'Initial quantity must be at least 1'
          return false
        }
        break
    }

    return true
  }

  const validateAll = (): boolean => {
    // For edit mode, validate only asset-level fields.
    if (mode === 'edit') {
      if (!formData.value.name.trim()) {
        errors.value.name = 'Name is required'
        return false
      }

      if (!formData.value.categoryName.trim()) {
        errors.value.categoryName = 'Category is required'
        return false
      }

      return true
    }

    // For create mode, all required fields must be filled
    const fields: (keyof FormErrors)[] = ['name', 'categoryName', 'locationName', 'costs']
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
        const payload: Partial<AssetFormData> = {
          name: formData.value.name,
          category_name: formData.value.category_name,
          specs: formData.value.specs,
          salvage_value: formData.value.salvage_value,
          life_months: formData.value.life_months,
          decline_balance_rate: formData.value.decline_balance_rate,
          depreciation_method: formData.value.depreciation_method,
        }

        await updateAsset(assetId, payload)
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
      salvage_value: null,
      life_months: null,
      decline_balance_rate: null,
      depreciation_method: null,
    }
    errors.value = {}
    successMessage.value = ''
  }

  // Computed: check if form has changes (for edit mode)
  const hasChanges = computed(() => {
    if (mode !== 'edit' || !originalAsset.value) return true
    const originalSpecs = JSON.stringify(originalAsset.value.asset_specs?.specs || {})
    const currentSpecs = JSON.stringify(formData.value.specs || {})
    
    return (
      formData.value.name !== originalAsset.value.name ||
      formData.value.category_name !== (originalAsset.value.category?.name || '') ||
      formData.value.status !== originalAsset.value.status ||
      formData.value.salvage_value !== (originalAsset.value.salvage_value ?? null) ||
      formData.value.life_months !== (originalAsset.value.life_months ?? null) ||
      formData.value.decline_balance_rate !== (originalAsset.value.decline_balance_rate ?? null) ||
      formData.value.depreciation_method !== (originalAsset.value.depreciation_method ?? null) ||
      currentSpecs !== originalSpecs
    )
  })

  // Computed: check if form is valid for submit
  const canSubmit = computed(() => {
    if (mode === 'edit') {
      return (
        formData.value.name.trim() !== '' &&
        formData.value.category_name.trim() !== '' &&
        hasChanges.value &&
        !isSaving.value
      )
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
