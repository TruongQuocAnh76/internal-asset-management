<script setup lang="ts">
import type { ReceiveAssetFormData, PurchaseRequest } from '../types/purchase-request.types'
import { usePurchaseRequests } from '../composables/usePurchaseRequests'
import { useImageUpload } from '../../assets/composables/useImageUpload'
import SpecsEditor from '../../assets/components/SpecsEditor.vue'

interface Props {
  purchaseRequest: PurchaseRequest
}

const props = defineProps<Props>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { receive } = usePurchaseRequests()
const { uploadImages } = useImageUpload()

const formData = ref<ReceiveAssetFormData>({
  name: '',
  category_name: props.purchaseRequest.category.name,
  location_name: '',
  costs: props.purchaseRequest.estimated_cost,
  initial_quantity: props.purchaseRequest.quantity,
  specs: { ...props.purchaseRequest.specs },
  image_num: 0,
  salvage_value: null,
  life_months: null,
  decline_balance_rate: null,
  depreciation_method: null,
})

const isSaving = ref(false)
const errors = ref<Record<string, string>>({})
const successMessage = ref('')

// Image state
const selectedImages = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedImages.value = Array.from(target.files)
    imagePreviewUrls.value = selectedImages.value.map(file => URL.createObjectURL(file))
    formData.value.image_num = selectedImages.value.length
  }
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
  URL.revokeObjectURL(imagePreviewUrls.value[index])
  imagePreviewUrls.value.splice(index, 1)
  formData.value.image_num = selectedImages.value.length
}

const validateAll = (): boolean => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = 'Asset name is required'
  }
  if (!formData.value.location_name.trim()) {
    errors.value.location_name = 'Storage location is required'
  }
  if (formData.value.costs < 0) {
    errors.value.costs = 'Cost cannot be negative'
  }
  if (formData.value.initial_quantity < 1) {
    errors.value.initial_quantity = 'Quantity must be at least 1'
  }
  if (formData.value.depreciation_method === 'DECLINING_BALANCE') {
    if (formData.value.decline_balance_rate == null || formData.value.decline_balance_rate <= 0) {
      errors.value.decline_balance_rate = 'Decline balance rate is required'
    }
  }

  return Object.keys(errors.value).length === 0
}

const canSubmit = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.location_name.trim() !== '' &&
    formData.value.costs >= 0 &&
    formData.value.initial_quantity >= 1 &&
    !isSaving.value
  )
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
  }).format(amount)
}

const onSubmit = async () => {
  if (!validateAll()) return

  isSaving.value = true
  errors.value = {}

  try {
    const result = await receive(props.purchaseRequest.id, formData.value)

    // Upload images if any
    if (selectedImages.value.length > 0 && result?.tempImageUrls?.length) {
      try {
        await uploadImages(selectedImages.value, result.tempImageUrls)
      } catch (err) {
        console.error('Image upload failed:', err)
      }
    }

    successMessage.value = 'Asset received and created successfully'
    emit('success')
  } catch (err: any) {
    errors.value.general = err.data?.message || err.message || 'Failed to receive purchase request'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- General error -->
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

    <!-- Pre-filled from Purchase Request (read-only summary) -->
    <div class="card bg-primary-50 border border-primary-200">
      <h3 class="text-sm font-semibold text-primary-800 mb-3">From Purchase Request</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-primary-600">Category</span>
          <p class="font-medium text-primary-900">{{ purchaseRequest.category.name }}</p>
        </div>
        <div>
          <span class="text-primary-600">Quantity</span>
          <p class="font-medium text-primary-900">{{ purchaseRequest.quantity }}</p>
        </div>
        <div>
          <span class="text-primary-600">Est. Cost</span>
          <p class="font-medium text-primary-900">{{ formatCurrency(purchaseRequest.estimated_cost) }}</p>
        </div>
        <div>
          <span class="text-primary-600">Requester</span>
          <p class="font-medium text-primary-900">{{ purchaseRequest.user.first_name }} {{ purchaseRequest.user.last_name }}</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
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
            <label for="receive_name" class="label">
              Asset Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="receive_name"
              v-model="formData.name"
              type="text"
              placeholder="e.g. Dell XPS 13 Laptop"
              :class="{ '!border-danger-500': errors.name }"
            />
            <p v-if="errors.name" class="error-message">{{ errors.name }}</p>
          </div>

          <!-- Category (pre-filled, read-only) -->
          <div class="input-group">
            <label for="receive_category" class="label">Category</label>
            <input
              id="receive_category"
              :value="formData.category_name"
              type="text"
              disabled
            />
          </div>

          <!-- Location -->
          <div class="input-group">
            <label for="receive_location" class="label">
              Storage Location <span class="text-danger-500">*</span>
            </label>
            <input
              id="receive_location"
              v-model="formData.location_name"
              type="text"
              placeholder="e.g. Head Office - Room 301"
              :class="{ '!border-danger-500': errors.location_name }"
            />
            <p v-if="errors.location_name" class="error-message">{{ errors.location_name }}</p>
          </div>

          <!-- Actual Cost -->
          <div class="input-group">
            <label for="receive_costs" class="label">Actual Cost per Unit</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">VND</span>
              <input
                id="receive_costs"
                v-model.number="formData.costs"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="!pl-14"
                :class="{ '!border-danger-500': errors.costs }"
              />
            </div>
            <p v-if="errors.costs" class="error-message">{{ errors.costs }}</p>
          </div>

          <!-- Quantity -->
          <div class="input-group">
            <label for="receive_quantity" class="label">
              Quantity Received <span class="text-danger-500">*</span>
            </label>
            <input
              id="receive_quantity"
              v-model.number="formData.initial_quantity"
              type="number"
              min="1"
              :class="{ '!border-danger-500': errors.initial_quantity }"
            />
            <p v-if="errors.initial_quantity" class="error-message">{{ errors.initial_quantity }}</p>
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Images
        </h2>

        <div class="space-y-4">
          <div class="input-group">
            <label for="receive_images" class="label">Upload Asset Images</label>
            <input
              id="receive_images"
              type="file"
              multiple
              accept="image/*"
              @change="handleImageSelect"
              class="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
          </div>

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

      <!-- Depreciation Settings -->
      <div class="card">
        <h2 class="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Depreciation Settings
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Depreciation Method -->
          <div class="input-group">
            <label for="receive_depreciation_method" class="label">Depreciation Method</label>
            <select
              id="receive_depreciation_method"
              v-model="formData.depreciation_method"
              class="w-full"
            >
              <option :value="null">Use Category Default</option>
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="DECLINING_BALANCE">Declining Balance</option>
            </select>
            <p class="text-xs text-secondary-400 mt-1">If not set, category defaults will be used.</p>
          </div>

          <!-- Salvage Value (Straight Line) -->
          <div v-if="formData.depreciation_method === 'STRAIGHT_LINE'" class="input-group">
            <label for="receive_salvage_value" class="label">Salvage Value</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">VND</span>
              <input
                id="receive_salvage_value"
                v-model.number="formData.salvage_value"
                type="number"
                min="0"
                placeholder="0"
                class="!pl-14"
              />
            </div>
          </div>

          <!-- Life Months (Straight Line) -->
          <div v-if="formData.depreciation_method === 'STRAIGHT_LINE'" class="input-group">
            <label for="receive_life_months" class="label">Useful Life (months)</label>
            <input
              id="receive_life_months"
              v-model.number="formData.life_months"
              type="number"
              min="1"
              placeholder="e.g. 60"
            />
          </div>

          <!-- Decline Balance Rate (Declining Balance) -->
          <div v-if="formData.depreciation_method === 'DECLINING_BALANCE'" class="input-group">
            <label for="receive_decline_rate" class="label">
              Decline Balance Rate (%) <span class="text-danger-500">*</span>
            </label>
            <div class="relative">
              <input
                id="receive_decline_rate"
                v-model.number="formData.decline_balance_rate"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 20"
                :class="{ '!border-danger-500': errors.decline_balance_rate }"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">%</span>
            </div>
            <p v-if="errors.decline_balance_rate" class="error-message">{{ errors.decline_balance_rate }}</p>
          </div>
        </div>
      </div>

      <!-- Specifications -->
      <div class="card">
        <SpecsEditor v-model="formData.specs" />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          @click="emit('cancel')"
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
          <span v-if="isSaving">Receiving...</span>
          <span v-else>Receive & Create Asset</span>
        </button>
      </div>
    </form>
  </div>
</template>
