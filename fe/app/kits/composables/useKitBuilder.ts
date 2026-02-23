import type { KitDraft, KitComponentDraft, KitFormData } from '../types/kit.types'

const DRAFT_STORAGE_KEY = 'kit-builder-draft'

export const useKitBuilder = () => {
  // Form state
  const formData = ref<KitFormData>({
    name: '',
    description: '',
    category: '',
    tags: [],
    components: []
  })

  const errors = ref<Record<string, string>>({})
  const isSaving = ref(false)
  const isDirty = ref(false)
  const hasDraft = ref(false)
  const lastSavedAt = ref<string | null>(null)

  // Generate unique ID for components
  const generateComponentId = () => {
    return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Initialize from draft if available
  const initFromDraft = () => {
    if (import.meta.client) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        try {
          const draft: KitDraft = JSON.parse(savedDraft)
          formData.value = {
            name: draft.name,
            description: draft.description,
            category: draft.category,
            tags: draft.tags,
            components: draft.components
          }
          lastSavedAt.value = draft.lastSavedAt
          hasDraft.value = true
          return true
        } catch (e) {
          console.error('Failed to parse draft:', e)
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        }
      }
    }
    return false
  }

  // Save draft to local storage
  const saveDraft = () => {
    if (import.meta.client && isDirty.value) {
      const draft: KitDraft = {
        id: 'draft',
        name: formData.value.name,
        description: formData.value.description,
        category: formData.value.category,
        tags: formData.value.tags,
        components: formData.value.components,
        lastSavedAt: new Date().toISOString()
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
      lastSavedAt.value = draft.lastSavedAt
      hasDraft.value = true
    }
  }

  // Clear draft from local storage
  const clearDraft = () => {
    if (import.meta.client) {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      hasDraft.value = false
      lastSavedAt.value = null
    }
  }

  // Discard draft and reset form
  const discardDraft = () => {
    clearDraft()
    resetForm()
  }

  // Reset form to initial state
  const resetForm = () => {
    formData.value = {
      name: '',
      description: '',
      category: '',
      tags: [],
      components: []
    }
    errors.value = {}
    isDirty.value = false
  }

  // Watch for changes and mark as dirty
  watch(formData, () => {
    isDirty.value = true
  }, { deep: true })

  // Auto-save draft periodically
  let autosaveInterval: ReturnType<typeof setInterval> | null = null

  const startAutosave = () => {
    if (import.meta.client) {
      autosaveInterval = setInterval(() => {
        if (isDirty.value) {
          saveDraft()
        }
      }, 30000) // Save every 30 seconds
    }
  }

  const stopAutosave = () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval)
      autosaveInterval = null
    }
  }

  // Component management
  const addComponent = (component: Omit<KitComponentDraft, 'id'>) => {
    formData.value.components.push({
      ...component,
      id: generateComponentId()
    })
  }

  const updateComponent = (componentId: string, updates: Partial<KitComponentDraft>) => {
    const index = formData.value.components.findIndex(c => c.id === componentId)
    if (index !== -1) {
      formData.value.components[index] = {
        ...formData.value.components[index],
        ...updates
      }
    }
  }

  const removeComponent = (componentId: string) => {
    formData.value.components = formData.value.components.filter(c => c.id !== componentId)
  }

  const moveComponentUp = (componentId: string) => {
    const index = formData.value.components.findIndex(c => c.id === componentId)
    if (index > 0) {
      const temp = formData.value.components[index - 1]
      formData.value.components[index - 1] = formData.value.components[index]
      formData.value.components[index] = temp
    }
  }

  const moveComponentDown = (componentId: string) => {
    const index = formData.value.components.findIndex(c => c.id === componentId)
    if (index < formData.value.components.length - 1) {
      const temp = formData.value.components[index + 1]
      formData.value.components[index + 1] = formData.value.components[index]
      formData.value.components[index] = temp
    }
  }

  // Tags management
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !formData.value.tags.includes(trimmedTag)) {
      formData.value.tags.push(trimmedTag)
    }
  }

  const removeTag = (tag: string) => {
    formData.value.tags = formData.value.tags.filter(t => t !== tag)
  }

  // Validation
  const validateField = (field: keyof KitFormData): boolean => {
    errors.value[field] = ''

    switch (field) {
      case 'name':
        if (!formData.value.name.trim()) {
          errors.value.name = 'Kit name is required'
          return false
        }
        if (formData.value.name.length < 3) {
          errors.value.name = 'Kit name must be at least 3 characters'
          return false
        }
        break
      case 'components':
        if (formData.value.components.length === 0) {
          errors.value.components = 'At least one component is required'
          return false
        }
        break
    }

    return true
  }

  const validateAll = (): boolean => {
    errors.value = {}
    const fields: (keyof KitFormData)[] = ['name', 'components']
    let isValid = true

    for (const field of fields) {
      if (!validateField(field)) {
        isValid = false
      }
    }

    return isValid
  }

  // Computed: estimated available kit count
  const estimatedAvailableKits = computed(() => {
    // This would need to be calculated based on actual asset availability
    // For now, return a placeholder
    return formData.value.components.length > 0 ? 0 : 0
  })

  // Computed: kit composition summary
  const compositionSummary = computed(() => {
    const summary: { type: string; quantity: number; isPlaceholder: boolean; assetName?: string }[] = []

    for (const component of formData.value.components) {
      summary.push({
        type: component.assetType,
        quantity: component.quantity,
        isPlaceholder: component.isPlaceholder,
        assetName: component.asset?.name
      })
    }

    return summary
  })

  const canSubmit = computed(() => {
    return (
      formData.value.name.trim() !== '' &&
      formData.value.components.length > 0 &&
      !isSaving.value
    )
  })

  // Lifecycle
  onMounted(() => {
    initFromDraft()
    startAutosave()
  })

  onUnmounted(() => {
    stopAutosave()
    if (isDirty.value) {
      saveDraft()
    }
  })

  // Save draft on page leave
  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      if (isDirty.value) {
        saveDraft()
      }
    })
  }

  return {
    formData,
    errors,
    isSaving,
    isDirty,
    hasDraft,
    lastSavedAt,
    estimatedAvailableKits,
    compositionSummary,
    canSubmit,
    initFromDraft,
    saveDraft,
    clearDraft,
    discardDraft,
    resetForm,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponentUp,
    moveComponentDown,
    addTag,
    removeTag,
    validateField,
    validateAll
  }
}
