import type { PurchaseRequestFormData } from '../types/purchase-request.types'
import { usePurchaseRequests } from './usePurchaseRequests'

export interface PurchaseRequestFormErrors {
  category_id?: string
  reason?: string
  estimatedCost?: string
  quantity?: string
  general?: string
}

export const usePurchaseRequestForm = () => {
  const { createPurchaseRequest } = usePurchaseRequests()
  const { user } = useAuth()

  const formData = ref<PurchaseRequestFormData>({
    category_id: '',
    reason: '',
    estimatedCost: 0,
    quantity: 1,
    specs: {},
  })

  const isSaving = ref(false)
  const errors = ref<PurchaseRequestFormErrors>({})
  const successMessage = ref('')

  const validateField = (field: keyof PurchaseRequestFormErrors): boolean => {
    errors.value[field] = undefined

    switch (field) {
      case 'category_id':
        if (!formData.value.category_id) {
          errors.value.category_id = 'Category is required'
          return false
        }
        break

      case 'reason':
        if (!formData.value.reason.trim()) {
          errors.value.reason = 'Reason is required'
          return false
        }
        if (formData.value.reason.length < 10) {
          errors.value.reason = 'Reason must be at least 10 characters'
          return false
        }
        break

      case 'estimatedCost':
        if (formData.value.estimatedCost <= 0) {
          errors.value.estimatedCost = 'Estimated cost must be greater than 0'
          return false
        }
        break

      case 'quantity':
        if (formData.value.quantity < 1) {
          errors.value.quantity = 'Quantity must be at least 1'
          return false
        }
        break
    }

    return true
  }

  const validateAll = (): boolean => {
    const fields: (keyof PurchaseRequestFormErrors)[] = [
      'category_id',
      'reason',
      'estimatedCost',
      'quantity',
    ]
    let isValid = true

    for (const field of fields) {
      if (!validateField(field)) {
        isValid = false
      }
    }

    return isValid
  }

  const handleSubmit = async () => {
    errors.value.general = undefined
    successMessage.value = ''

    if (!validateAll()) return false

    if (!user.value?.id) {
      errors.value.general = 'You must be logged in to submit a purchase request'
      return false
    }

    isSaving.value = true

    try {
      const result = await createPurchaseRequest(formData.value, user.value.id)
      successMessage.value = 'Purchase request submitted successfully'
      return result
    } catch (err: any) {
      errors.value.general =
        err.data?.message || err.message || 'Failed to submit purchase request'
      return false
    } finally {
      isSaving.value = false
    }
  }

  const resetForm = () => {
    formData.value = {
      category_id: '',
      reason: '',
      estimatedCost: 0,
      quantity: 1,
      specs: {},
    }
    errors.value = {}
    successMessage.value = ''
  }

  const canSubmit = computed(() => {
    return (
      formData.value.category_id !== '' &&
      formData.value.reason.trim().length >= 10 &&
      formData.value.estimatedCost > 0 &&
      formData.value.quantity >= 1 &&
      !isSaving.value
    )
  })

  return {
    formData,
    isSaving,
    errors,
    successMessage,
    canSubmit,
    validateField,
    validateAll,
    handleSubmit,
    resetForm,
  }
}
