<script setup lang="ts">
import { useAssetForm } from '../composables/useAssetForm'
import { useAssets } from '../composables/useAssets'
import { useImageUpload } from '../composables/useImageUpload'
import SpecsEditor from './SpecsEditor.vue'

interface Props {
  mode: 'create' | 'edit'
  assetId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'success': []
  'cancel': []
}>()

const {
  formData,
  isSaving,
  errors,
  successMessage,
  statusOptions,
  canSubmit,
  validateField,
  handleSubmit,
} = useAssetForm(props.mode, props.assetId)

const { getCategories } = useAssets()
const { uploadImages } = useImageUpload()

// Image upload state
const selectedImages = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])

// Categories for autocomplete
const categories = ref<{ category: string; count: number }[]>([])
const loadCategories = async () => {
  try {
    const { data } = await getCategories()
    if (data.value) {
      categories.value = data.value as { category: string; count: number }[]
    }
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

// Handle image selection
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedImages.value = Array.from(target.files)
    formData.value.image_num = selectedImages.value.length
    
    // Generate preview URLs
    imagePreviewUrls.value = selectedImages.value.map(file => URL.createObjectURL(file))
  }
}

// Remove image
const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
  URL.revokeObjectURL(imagePreviewUrls.value[index])
  imagePreviewUrls.value.splice(index, 1)
  formData.value.image_num = selectedImages.value.length
}

// Initialize
onMounted(async () => {
  await loadCategories()
})

// Handle form submission
const onSubmit = async () => {
  const result = await handleSubmit()
  if (result && selectedImages.value.length > 0) {
    try {
      // Upload images using presigned URLs
      await uploadImages(selectedImages.value, result.tempImageUrls)
    } catch (err) {
      console.error('Image upload failed:', err)
    }
  }
  if (result) {
    if (props.mode === 'create') {
      // Navigate to asset detail page
      await navigateTo('/assets')
    }
    emit('success')
  }
}

const onCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Form -->
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- General error message -->
      <div v-if="errors.general" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span class="text-danger-700 font-medium">{{ errors.general }}</span>
        </div>
      </div>

      <!-- Success message -->
      <div v-if="successMessage" class="bg-success-50 border border-success-200 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="text-success-700 font-medium">{{ successMessage }}</span>
        </div>
      </div>

      <!-- Asset Information -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Asset Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Asset Name -->
          <div class="input-group">
            <label for="name" class="label">
              Asset Name <span v-if="mode === 'create'" class="text-danger-500">*</span>
            </label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="Enter asset name"
              @blur="validateField('name')"
              :class="{ '!border-danger-500': errors.name }"
            />
            <p v-if="errors.name" class="error-message">{{ errors.name }}</p>
          </div>

          <!-- Category -->
          <div class="input-group">
            <label for="category_name" class="label">
              Category <span v-if="mode === 'create'" class="text-danger-500">*</span>
            </label>
            <input
              id="category_name"
              v-model="formData.category_name"
              type="text"
              list="categories-list"
              placeholder="Select or enter category"
              @blur="validateField('category_name')"
              :class="{ '!border-danger-500': errors.category_name }"
            />
            <datalist id="categories-list">
              <option v-for="cat in categories" :key="cat.category" :value="cat.category" />
            </datalist>
            <p v-if="errors.category_name" class="error-message">{{ errors.category_name }}</p>
          </div>

          <!-- Location -->
          <div class="input-group">
            <label for="location_name" class="label">
              Location <span v-if="mode === 'create'" class="text-danger-500">*</span>
            </label>
            <input
              id="location_name"
              v-model="formData.location_name"
              type="text"
              placeholder="Enter location"
              @blur="validateField('location_name')"
              :class="{ '!border-danger-500': errors.location_name }"
            />
            <p v-if="errors.location_name" class="error-message">{{ errors.location_name }}</p>
          </div>

          <!-- Cost -->
          <div class="input-group">
            <label for="costs" class="label">
              Cost (USD)
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>
              <input
                id="costs"
                v-model.number="formData.costs"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="!pl-8"
                @blur="validateField('costs')"
                :class="{ '!border-danger-500': errors.costs }"
              />
            </div>
            <p v-if="errors.costs" class="error-message">{{ errors.costs }}</p>
          </div>

          <!-- Stock -->
          <div class="input-group">
            <label for="stock" class="label">
              Stock <span v-if="mode === 'create'" class="text-danger-500">*</span>
            </label>
            <input
              id="stock"
              v-model.number="formData.stock"
              type="number"
              min="1"
              placeholder="1"
              @blur="validateField('stock')"
              :class="{ '!border-danger-500': errors.stock }"
            />
            <p v-if="errors.stock" class="error-message">{{ errors.stock }}</p>
          </div>
        </div>
      </div>

      <!-- Images Section (Create mode only) -->
      <div v-if="mode === 'create'" class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Images
        </h2>

        <div class="space-y-4">
          <!-- File Input -->
          <div class="input-group">
            <label for="images" class="label">Upload Images</label>
            <input
              id="images"
              type="file"
              multiple
              accept="image/*"
              @change="handleImageSelect"
              class="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            <p class="text-sm text-secondary-500 mt-1">You can select multiple images</p>
          </div>

          <!-- Image Previews -->
          <div v-if="imagePreviewUrls.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(url, index) in imagePreviewUrls" :key="index" class="relative group">
              <img :src="url" :alt="`Preview ${index + 1}`" class="w-full h-32 object-cover rounded-lg" />
              <button
                type="button"
                @click="removeImage(index)"
                class="absolute top-2 right-2 p-1 bg-danger-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Specifications Section -->
      <div class="card">
        <SpecsEditor v-model="formData.specs" />
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          @click="onCancel"
          class="btn-secondary"
          :disabled="isSaving"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn-primary flex items-center gap-2"
          :disabled="!canSubmit || isSaving"
        >
          <svg v-if="isSaving" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="isSaving">
            {{ mode === 'create' ? 'Creating...' : 'Saving...' }}
          </span>
          <span v-else>
            {{ mode === 'create' ? 'Create Asset' : 'Save Changes' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>
