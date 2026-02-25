import type { CategoryFormData, Category, DepreciationMethod } from '../types/category.types'
import { useCategories } from './useCategories'

export interface CategoryFormErrors {
  name?: string
  general?: string
}

export const useCategoryForm = (mode: 'create' | 'edit' = 'create', categoryId?: string) => {
  const { createCategory, updateCategory, getCategoryById } = useCategories()
  const router = useRouter()

  // Form state
  const formData = ref<CategoryFormData>({
    name: '',
    salvage_value: null,
    default_life_months: null,
    decline_balance_rate: null,
    default_depreciation_method: null,
  })

  // UI state
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errors = ref<CategoryFormErrors>({})
  const successMessage = ref('')
  const originalCategory = ref<Category | null>(null)

  // Load existing category for edit mode
  const loadCategory = async () => {
    if (mode !== 'edit' || !categoryId) return

    isLoading.value = true
    try {
      const category = await getCategoryById(categoryId)
      if (category) {
        originalCategory.value = category
        formData.value = {
          name: category.name || '',
          salvage_value: category.salvage_value ?? null,
          default_life_months: category.default_life_months ?? null,
          decline_balance_rate: category.decline_balance_rate ?? null,
          default_depreciation_method: category.default_depreciation_method ?? null,
        }
      }
    } catch (err: any) {
      errors.value.general = err.data?.message || err.message || 'Failed to load category'
    } finally {
      isLoading.value = false
    }
  }

  // Initialize
  onMounted(() => {
    if (mode === 'edit' && categoryId) {
      loadCategory()
    }
  })

  // Validation
  const validateField = (field: keyof CategoryFormErrors): boolean => {
    errors.value[field] = undefined

    if (field === 'name') {
      if (!formData.value.name.trim()) {
        errors.value.name = 'Name is required'
        return false
      }
      if (formData.value.name.length < 2) {
        errors.value.name = 'Name must be at least 2 characters'
        return false
      }
    }

    return true
  }

  const validateAll = (): boolean => {
    return validateField('name')
  }

  // Submit
  const handleSubmit = async () => {
    errors.value.general = undefined
    successMessage.value = ''

    if (!validateAll()) return false

    isSaving.value = true

    try {
      if (mode === 'create') {
        await createCategory(formData.value)
        successMessage.value = 'Category created successfully'
        return true
      } else if (mode === 'edit' && categoryId) {
        await updateCategory(categoryId, formData.value)
        successMessage.value = 'Category updated successfully'
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
      salvage_value: null,
      default_life_months: null,
      decline_balance_rate: null,
      default_depreciation_method: null,
    }
    errors.value = {}
    successMessage.value = ''
  }

  // Computed
  const hasChanges = computed(() => {
    if (mode !== 'edit' || !originalCategory.value) return true
    return formData.value.name !== originalCategory.value.name ||
      formData.value.salvage_value !== (originalCategory.value.salvage_value ?? null) ||
      formData.value.default_life_months !== (originalCategory.value.default_life_months ?? null) ||
      formData.value.decline_balance_rate !== (originalCategory.value.decline_balance_rate ?? null) ||
      formData.value.default_depreciation_method !== (originalCategory.value.default_depreciation_method ?? null)
  })

  const canSubmit = computed(() => {
    return formData.value.name.trim() !== '' && !isSaving.value
  })

  return {
    formData,
    isLoading,
    isSaving,
    errors,
    successMessage,
    hasChanges,
    canSubmit,
    validateField,
    validateAll,
    handleSubmit,
    resetForm,
    loadCategory,
  }
}
