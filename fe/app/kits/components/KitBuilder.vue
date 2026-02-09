<script setup lang="ts">
import { useKitBuilder } from '../composables/useKitBuilder'
import { useKits } from '../composables/useKits'
import type { KitFormData, ComponentPickerAsset } from '../types/kit.types'
import ComponentPicker from './ComponentPicker.vue'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
  'success': []
}>()

const { createKit, getCategories } = useKits()

const {
  formData,
  errors,
  isSaving,
  isDirty,
  hasDraft,
  lastSavedAt,
  compositionSummary,
  canSubmit,
  saveDraft,
  discardDraft,
  addComponent,
  removeComponent,
  moveComponentUp,
  moveComponentDown,
  addTag,
  removeTag,
  validateField,
  validateAll,
  clearDraft
} = useKitBuilder()

const categories = ref<{ name: string }[]>([])
const tagInput = ref('')
const showComponentPicker = ref(false)
const showDiscardConfirm = ref(false)

const loadCategories = async () => {
  try {
    const { data } = await getCategories()
    if (data.value) {
      categories.value = data.value.map(c => ({ name: c.name }))
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const handleAddTag = () => {
  if (tagInput.value.trim()) {
    addTag(tagInput.value)
    tagInput.value = ''
  }
}

const handleTagKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    handleAddTag()
  }
}

const handleComponentSelect = (asset: ComponentPickerAsset | null, assetType: string) => {
  addComponent({
    assetId: asset?.id || null,
    assetType: assetType,
    quantity: 1,
    isPlaceholder: asset === null,
    asset: asset ? {
      id: asset.id,
      code: asset.code,
      name: asset.name
    } : null
  })
  showComponentPicker.value = false
}

const handleSubmit = async () => {
  if (!validateAll()) return

  isSaving.value = true
  try {
    await createKit(formData.value)
    clearDraft()
    emit('success')
    emit('close')
  } catch (err: any) {
    errors.value.general = err.data?.message || err.message || 'Failed to create kit'
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  if (isDirty.value) {
    showDiscardConfirm.value = true
  } else {
    emit('close')
  }
}

const handleDiscardConfirm = () => {
  discardDraft()
  showDiscardConfirm.value = false
  emit('close')
}

const handleSaveAndClose = () => {
  saveDraft()
  showDiscardConfirm.value = false
  emit('close')
}

const formatLastSaved = computed(() => {
  if (!lastSavedAt.value) return ''
  const date = new Date(lastSavedAt.value)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

watch(() => props.visible, (visible) => {
  if (visible) {
    loadCategories()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="visible" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:p-8">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-secondary-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-secondary-900">Kit Builder</h2>
                <div v-if="hasDraft" class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-secondary-500">Draft saved at {{ formatLastSaved }}</span>
                  <button
                    @click="discardDraft"
                    class="text-xs text-danger-600 hover:text-danger-700"
                  >
                    Discard draft
                  </button>
                </div>
              </div>
              <button
                @click="handleClose"
                class="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Form Content -->
          <div class="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
            <!-- General Error -->
            <div v-if="errors.general" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-danger-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <span class="text-danger-700 font-medium">{{ errors.general }}</span>
              </div>
            </div>

            <!-- Kit Information -->
            <div class="bg-white border border-secondary-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Kit Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Kit Name -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Kit Name <span class="text-danger-500">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    placeholder="e.g., Developer Workstation Kit"
                    @blur="validateField('name')"
                    class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    :class="errors.name ? 'border-danger-500' : 'border-secondary-300'"
                  />
                  <p v-if="errors.name" class="text-sm text-danger-600 mt-1">{{ errors.name }}</p>
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Category <span class="text-danger-500">*</span>
                  </label>
                  <input
                    v-model="formData.category"
                    type="text"
                    list="categories-list"
                    placeholder="Select or enter category"
                    @blur="validateField('category')"
                    class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    :class="errors.category ? 'border-danger-500' : 'border-secondary-300'"
                  />
                  <datalist id="categories-list">
                    <option v-for="cat in categories" :key="cat.name" :value="cat.name" />
                  </datalist>
                  <p v-if="errors.category" class="text-sm text-danger-600 mt-1">{{ errors.category }}</p>
                </div>

                <!-- Description -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Description</label>
                  <textarea
                    v-model="formData.description"
                    rows="3"
                    placeholder="Describe what this kit contains and its intended use..."
                    class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                  ></textarea>
                </div>

                <!-- Tags -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Tags</label>
                  <div class="flex flex-wrap gap-2 mb-2">
                    <span
                      v-for="tag in formData.tags"
                      :key="tag"
                      class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-md text-sm"
                    >
                      {{ tag }}
                      <button
                        @click="removeTag(tag)"
                        class="hover:text-primary-900"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <input
                    v-model="tagInput"
                    type="text"
                    placeholder="Type a tag and press Enter"
                    @keydown="handleTagKeydown"
                    @blur="handleAddTag"
                    class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>

            <!-- Components Section -->
            <div class="bg-white border border-secondary-200 rounded-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Components
                  <span class="text-sm font-normal text-secondary-500">({{ formData.components.length }})</span>
                </h3>
                <button
                  @click="showComponentPicker = true"
                  class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Component
                </button>
              </div>

              <p v-if="errors.components" class="text-sm text-danger-600 mb-4">{{ errors.components }}</p>

              <!-- Components List -->
              <div v-if="formData.components.length === 0" class="text-center py-8 border-2 border-dashed border-secondary-200 rounded-lg">
                <svg class="w-12 h-12 mx-auto text-secondary-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <p class="text-secondary-600 font-medium">No components added yet</p>
                <p class="text-sm text-secondary-500 mt-1">Add components to define what's included in this kit</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(component, index) in formData.components"
                  :key="component.id"
                  class="flex items-center gap-4 p-4 bg-secondary-50 rounded-lg"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span 
                        class="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full"
                        :class="component.isPlaceholder ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'"
                      >
                        {{ component.quantity }}x
                      </span>
                      <span class="font-medium text-secondary-900">{{ component.assetType }}</span>
                      <span
                        v-if="component.isPlaceholder"
                        class="text-xs px-2 py-0.5 bg-warning-100 text-warning-700 rounded"
                      >
                        Any of type
                      </span>
                    </div>
                    <p v-if="component.asset" class="text-sm text-secondary-500 mt-1">
                      {{ component.asset.name }} ({{ component.asset.code }})
                    </p>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      @click="moveComponentUp(component.id)"
                      :disabled="index === 0"
                      class="p-1.5 text-secondary-400 hover:text-secondary-600 disabled:opacity-30 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      @click="moveComponentDown(component.id)"
                      :disabled="index === formData.components.length - 1"
                      class="p-1.5 text-secondary-400 hover:text-secondary-600 disabled:opacity-30 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      @click="removeComponent(component.id)"
                      class="p-1.5 text-danger-400 hover:text-danger-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview Summary -->
            <div v-if="compositionSummary.length > 0" class="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Kit Preview
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  v-for="item in compositionSummary"
                  :key="item.type"
                  class="bg-white rounded-lg p-3 border border-primary-200"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-primary-700">{{ item.quantity }}x</span>
                    <span class="text-sm text-primary-900">{{ item.type }}</span>
                  </div>
                  <p v-if="item.assetName" class="text-xs text-primary-600 mt-1 truncate">{{ item.assetName }}</p>
                  <p v-else class="text-xs text-warning-600 mt-1">Any available</p>
                </div>
              </div>
              <p class="text-sm text-primary-700 mt-4">
                <strong>Note:</strong> Estimated available kit count will be calculated after creation based on component availability.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-secondary-200 flex items-center justify-between">
            <button
              @click="saveDraft"
              class="text-sm text-secondary-600 hover:text-secondary-800 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Draft
            </button>
            <div class="flex gap-3">
              <button
                @click="handleClose"
                class="px-4 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleSubmit"
                :disabled="!canSubmit"
                class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="isSaving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isSaving ? 'Creating...' : 'Create Kit' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Component Picker -->
    <ComponentPicker
      :visible="showComponentPicker"
      @close="showComponentPicker = false"
      @select="handleComponentSelect"
    />

    <!-- Discard Confirmation Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showDiscardConfirm" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <h3 class="text-lg font-semibold text-secondary-900 mb-2">Unsaved Changes</h3>
          <p class="text-secondary-600 mb-6">You have unsaved changes. Would you like to save them as a draft before closing?</p>
          <div class="flex justify-end gap-3">
            <button
              @click="handleDiscardConfirm"
              class="px-4 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              Discard
            </button>
            <button
              @click="handleSaveAndClose"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Save Draft & Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
